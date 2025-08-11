import { Injectable, inject, signal }            from '@angular/core';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError, switchMap }       from 'rxjs/operators';
import Dexie, { Table }                          from 'dexie';
import { TracingApiService }                     from './tracing-api.service';

interface CacheEntry {
    key: string;
    data: any;
    timestamp: Date;
    expiresAt?: Date;
    tags: string[];
    size: number;
    accessCount: number;
    lastAccessed: Date;
}

interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    oldestEntry?: Date;
    newestEntry?: Date;
}

interface CacheConfig {
    maxSize: number; // in MB
    defaultTtl: number; // in milliseconds
    maxEntries: number;
    cleanupInterval: number; // in milliseconds
}

class TracingCacheDatabase extends Dexie {
    cache!: Table<CacheEntry>;
    stats!: Table<{ key: string; value: any }>;

    constructor() {
        super('TracingCacheDB');

        this.version(1).stores({
            cache: 'key, timestamp, expiresAt, *tags, lastAccessed',
            stats: 'key'
        });
    }
}

@Injectable({
    providedIn: 'root'
})
export class OfflineCacheService {
    private readonly api = inject(TracingApiService);
    private readonly db = new TracingCacheDatabase();

    // Cache configuration
    private readonly config: CacheConfig = {
        maxSize        : 100, // 100MB
        defaultTtl     : 24 * 60 * 60 * 1000, // 24 hours
        maxEntries     : 10000,
        cleanupInterval: 5 * 60 * 1000 // 5 minutes
    };

    // Cache statistics
    private readonly cacheStats = signal<CacheStats>({
        totalEntries: 0,
        totalSize   : 0,
        hitRate     : 0,
        missRate    : 0
    });

    // Network status
    private readonly isOnline = signal(navigator.onLine);
    private readonly cacheHealth$ = new BehaviorSubject({
        isHealthy  : true,
        lastCleanup: new Date(),
        errorCount : 0
    });

    constructor() {
        this.initializeCache();
        this.setupNetworkListeners();
        this.startPeriodicCleanup();
        this.loadCacheStats();
    }

    // ========== PUBLIC API ==========

    /**
     * Get data from cache or fetch from API
     */
    get<T>(key: string, fetchFn?: () => Observable<T>, options?: {
        ttl?: number;
        tags?: string[];
        forceRefresh?: boolean;
    }): Observable<T | null> {
        if (options?.forceRefresh) {
            return this.fetchAndCache(key, fetchFn, options);
        }

        return from(this.getCacheEntry(key)).pipe(
            switchMap(entry => {
                if (entry && !this.isExpired(entry)) {
                    // Cache hit
                    this.updateAccessStats(entry);
                    this.incrementHitCount();
                    return of(entry.data);
                }

                // Cache miss - fetch from API if available
                this.incrementMissCount();

                if (fetchFn && this.isOnline()) {
                    return this.fetchAndCache(key, fetchFn, options);
                }

                // Return stale data if offline and available
                return of(entry?.data || null);
            }),
            catchError(error => {
                console.error('Cache get error:', error);
                return of(null);
            })
        );
    }

    /**
     * Set data in cache
     */
    set(key: string, data: any, options?: {
        ttl?: number;
        tags?: string[];
    }): Observable<void> {
        const entry: CacheEntry = {
            key,
            data,
            timestamp   : new Date(),
            expiresAt   : options?.ttl ? new Date(Date.now() + options.ttl) : new Date(Date.now() + this.config.defaultTtl),
            tags        : options?.tags || [],
            size        : this.calculateSize(data),
            accessCount : 0,
            lastAccessed: new Date()
        };

        return from(this.db.cache.put(entry)).pipe(
            tap(() => this.updateCacheStats()),
            map(() => void 0),
            catchError(error => {
                console.error('Cache set error:', error);
                return of(void 0);
            })
        );
    }

    /**
     * Remove data from cache
     */
    delete(key: string): Observable<void> {
        return from(this.db.cache.delete(key)).pipe(
            tap(() => this.updateCacheStats()),
            map(() => void 0)
        );
    }

    /**
     * Clear cache by tags
     */
    clearByTags(tags: string[]): Observable<void> {
        return from(
            this.db.cache.where('tags').anyOf(tags).delete()
        ).pipe(
            tap(() => this.updateCacheStats()),
            map(() => void 0)
        );
    }

    /**
     * Clear all cache
     */
    clearAll(): Observable<void> {
        return from(this.db.cache.clear()).pipe(
            tap(() => this.updateCacheStats()),
            map(() => void 0)
        );
    }

    /**
     * Get cache statistics
     */
    getStats(): Observable<CacheStats> {
        return this.cacheStats.asObservable();
    }

    /**
     * Get cache health status
     */
    getHealth(): Observable<any> {
        return this.cacheHealth$.asObservable();
    }

    /**
     * Preload data for offline use
     */
    preloadData(preloadConfig: Array<{
        key: string;
        fetchFn: () => Observable<any>;
        tags?: string[];
        ttl?: number;
    }>): Observable<void> {
        const preloadTasks = preloadConfig.map(config =>
            this.fetchAndCache(config.key, config.fetchFn, {
                tags: config.tags,
                ttl : config.ttl
            })
        );

        return from(Promise.all(preloadTasks.map(task => task.toPromise()))).pipe(
            map(() => void 0)
        );
    }

    /**
     * Get cached templates for offline use
     */
    getCachedTemplates(): Observable<any[]> {
        return this.get('flow-templates', () => this.api.getTemplates(), {
            tags: [ 'templates' ],
            ttl : 2 * 60 * 60 * 1000 // 2 hours
        }).pipe(
            map(templates => templates || [])
        );
    }

    /**
     * Get cached versions for a template
     */
    getCachedVersions(templateId: string): Observable<any[]> {
        return this.get(`template-versions-${ templateId }`,
            () => this.api.getVersionsByTemplate(templateId), {
                tags: [ 'versions', `template-${ templateId }` ],
                ttl : 30 * 60 * 1000 // 30 minutes
            }).pipe(
            map(versions => versions || [])
        );
    }

    /**
     * Get cached version details
     */
    getCachedVersion(versionId: string): Observable<any> {
        return this.get(`version-${ versionId }`,
            () => this.api.getVersion(versionId), {
                tags: [ 'version-details', `version-${ versionId }` ],
                ttl : 60 * 60 * 1000 // 1 hour
            });
    }

    /**
     * Cache flow instances for offline access
     */
    cacheInstances(filters?: any): Observable<any> {
        const cacheKey = `instances-${ JSON.stringify(filters || {}) }`;

        return this.get(cacheKey,
            () => this.api.getInstances(filters), {
                tags: [ 'instances' ],
                ttl : 10 * 60 * 1000 // 10 minutes
            });
    }

    // ========== PRIVATE METHODS ==========

    private initializeCache(): void {
        // Initialize cache metadata
        this.db.stats.put({key: 'hitCount', value: 0});
        this.db.stats.put({key: 'missCount', value: 0});
        this.db.stats.put({key: 'lastCleanup', value: new Date()});
    }

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline.set(true);
        });

        window.addEventListener('offline', () => {
            this.isOnline.set(false);
        });
    }

    private startPeriodicCleanup(): void {
        setInterval(() => {
            this.performCleanup().subscribe();
        }, this.config.cleanupInterval);
    }

    private fetchAndCache<T>(key: string, fetchFn?: () => Observable<T>, options?: {
        ttl?: number;
        tags?: string[];
    }): Observable<T> {
        if (!fetchFn) {
            return of(null as any);
        }

        return fetchFn().pipe(
            switchMap(data => {
                return this.set(key, data, options).pipe(
                    map(() => data)
                );
            })
        );
    }

    private getCacheEntry(key: string): Promise<CacheEntry | undefined> {
        return this.db.cache.get(key);
    }

    private isExpired(entry: CacheEntry): boolean {
        if (!entry.expiresAt) return false;
        return new Date() > entry.expiresAt;
    }

    private updateAccessStats(entry: CacheEntry): void {
        entry.accessCount++;
        entry.lastAccessed = new Date();
        this.db.cache.put(entry);
    }

    private calculateSize(data: any): number {
        // Rough estimation of object size in bytes
        return JSON.stringify(data).length * 2; // UTF-16 uses 2 bytes per character
    }

    private performCleanup(): Observable<void> {
        return from(this.db.transaction('rw', this.db.cache, async () => {
            // Remove expired entries
            const now = new Date();
            await this.db.cache.where('expiresAt').below(now).delete();

            // Check if we need to free up space
            const stats = await this.calculateCurrentStats();

            if (stats.totalSize > this.config.maxSize * 1024 * 1024 ||
                stats.totalEntries > this.config.maxEntries) {

                // Remove least recently used entries
                const entries = await this.db.cache
                    .orderBy('lastAccessed')
                    .limit(Math.floor(stats.totalEntries * 0.1)) // Remove 10%
                    .toArray();

                const keysToDelete = entries.map(e => e.key);
                await this.db.cache.bulkDelete(keysToDelete);
            }

            // Update cleanup timestamp
            await this.db.stats.put({key: 'lastCleanup', value: new Date()});
        })).pipe(
            tap(() => {
                this.updateCacheHealth(true);
                this.updateCacheStats();
            }),
            catchError(error => {
                console.error('Cache cleanup error:', error);
                this.updateCacheHealth(false);
                return of(void 0);
            }),
            map(() => void 0)
        );
    }

    private async calculateCurrentStats(): Promise<CacheStats> {
        const entries = await this.db.cache.toArray();
        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

        const hitCount = (await this.db.stats.get('hitCount'))?.value || 0;
        const missCount = (await this.db.stats.get('missCount'))?.value || 0;
        const totalRequests = hitCount + missCount;

        return {
            totalEntries: entries.length,
            totalSize,
            hitRate     : totalRequests > 0 ? (hitCount / totalRequests) * 100 : 0,
            missRate    : totalRequests > 0 ? (missCount / totalRequests) * 100 : 0,
            oldestEntry : entries.length > 0 ? new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) : undefined,
            newestEntry : entries.length > 0 ? new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) : undefined
        };
    }

    private updateCacheStats(): void {
        from(this.calculateCurrentStats()).subscribe(stats => {
            this.cacheStats.set(stats);
        });
    }

    private loadCacheStats(): void {
        this.updateCacheStats();
    }

    private incrementHitCount(): void {
        this.db.stats.get('hitCount').then(stat => {
            const currentCount = stat?.value || 0;
            this.db.stats.put({key: 'hitCount', value: currentCount + 1});
        });
    }

    private incrementMissCount(): void {
        this.db.stats.get('missCount').then(stat => {
            const currentCount = stat?.value || 0;
            this.db.stats.put({key: 'missCount', value: currentCount + 1});
        });
    }

    private updateCacheHealth(success: boolean): void {
        const current = this.cacheHealth$.value;

        this.cacheHealth$.next({
            isHealthy  : success && current.errorCount < 5,
            lastCleanup: success ? new Date() : current.lastCleanup,
            errorCount : success ? 0 : current.errorCount + 1
        });
    }
}
