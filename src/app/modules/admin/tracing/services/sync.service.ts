import { Injectable, inject, signal }                      from '@angular/core';
import { Observable, from, of, BehaviorSubject, interval } from 'rxjs';
import { catchError, switchMap, tap, map }                 from 'rxjs/operators';
import Dexie, { Table }                                    from 'dexie';
import { TracingApiService }                               from './tracing-api.service';
import { SyncOperation }                                   from '../models/enums';

// Sync database schema
interface SyncChange {
    id?: number;
    entityName: string;
    entityId: string;
    operation: SyncOperation;
    payload: any;
    timestamp: Date;
    deviceId: string;
    synced: boolean;
    retryCount: number;
    lastError?: string;
}

interface SyncMeta {
    key: string;
    value: any;
    updatedAt: Date;
}

interface ShadowRecord {
    entityName: string;
    entityId: string;
    data: any;
    version: number;
    lastSync: Date;
}

class TracingSyncDatabase extends Dexie {
    drafts!: Table<any>;
    queue!: Table<SyncChange>;
    shadow!: Table<ShadowRecord>;
    meta!: Table<SyncMeta>;

    constructor() {
        super('TracingSyncDB');

        this.version(1).stores({
            drafts: '++id, entityName, entityId, createdAt',
            queue : '++id, entityName, entityId, timestamp, synced',
            shadow: '[entityName+entityId], version, lastSync',
            meta  : 'key, updatedAt'
        });
    }
}

@Injectable({
    providedIn: 'root'
})
export class SyncService {
    private readonly api = inject(TracingApiService);
    private readonly db = new TracingSyncDatabase();
    private readonly deviceId = this.generateDeviceId();

    // Sync status signals
    public readonly isOnline = signal(navigator.onLine);
    public readonly isSyncing = signal(false);
    public readonly lastSyncTime = signal<Date | null>(null);
    public readonly pendingChanges = signal(0);
    public readonly syncErrors = signal<string[]>([]);

    // Sync health metrics
    private readonly syncHealth$ = new BehaviorSubject({
        isHealthy          : true,
        lastSuccessfulSync : null as Date | null,
        consecutiveFailures: 0,
        totalSynced        : 0,
        totalErrors        : 0
    });

    constructor() {
        this.initializeSync();
        this.setupNetworkListeners();
        this.startPeriodicSync();
    }

    private initializeSync(): void {
        // Initialize device ID and sync metadata
        this.setMeta('deviceId', this.deviceId);
        this.setMeta('lastSyncTime', null);

        // Load initial state
        this.loadPendingChangesCount();
        this.loadLastSyncTime();
    }

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline.set(true);
            this.triggerSync();
        });

        window.addEventListener('offline', () => {
            this.isOnline.set(false);
        });
    }

    private startPeriodicSync(): void {
        // Sync every 30 seconds when online
        interval(30000).pipe(
            switchMap(() => this.isOnline() ? this.sync() : of(null))
        ).subscribe();
    }

    private generateDeviceId(): string {
        return `device_${ Date.now() }_${ Math.random().toString(36).substr(2, 9) }`;
    }

    // ========== PUBLIC API ==========

    /**
     * Queue a change for synchronization
     */
    queueChange(entityName: string, entityId: string, operation: SyncOperation, payload: any): Observable<void> {
        const change: SyncChange = {
            entityName,
            entityId,
            operation,
            payload,
            timestamp : new Date(),
            deviceId  : this.deviceId,
            synced    : false,
            retryCount: 0
        };

        return from(this.db.queue.add(change)).pipe(
            tap(() => this.loadPendingChangesCount()),
            map(() => void 0)
        );
    }

    /**
     * Save draft data locally
     */
    saveDraft(entityName: string, entityId: string, data: any): Observable<void> {
        const draft = {
            entityName,
            entityId,
            data,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        return from(this.db.drafts.put(draft, [ entityName, entityId ])).pipe(
            map(() => void 0)
        );
    }

    /**
     * Get draft data
     */
    getDraft(entityName: string, entityId: string): Observable<any | null> {
        return from(this.db.drafts.get([ entityName, entityId ])).pipe(
            map(draft => draft?.data || null)
        );
    }

    /**
     * Delete draft data
     */
    deleteDraft(entityName: string, entityId: string): Observable<void> {
        return from(this.db.drafts.delete([ entityName, entityId ])).pipe(
            map(() => void 0)
        );
    }

    /**
     * Trigger manual sync
     */
    triggerSync(): Observable<boolean> {
        if (!this.isOnline() || this.isSyncing()) {
            return of(false);
        }

        return this.sync();
    }

    /**
     * Get sync status
     */
    getSyncStatus(): Observable<any> {
        return this.syncHealth$.asObservable();
    }

    /**
     * Clear all sync data (for testing/reset)
     */
    clearSyncData(): Observable<void> {
        return from(Promise.all([
            this.db.queue.clear(),
            this.db.shadow.clear(),
            this.db.drafts.clear()
        ])).pipe(
            tap(() => {
                this.pendingChanges.set(0);
                this.syncErrors.set([]);
            }),
            map(() => void 0)
        );
    }

    // ========== PRIVATE SYNC LOGIC ==========

    private sync(): Observable<boolean> {
        if (this.isSyncing()) {
            return of(false);
        }

        this.isSyncing.set(true);
        this.syncErrors.set([]);

        return this.performSync().pipe(
            tap(success => {
                this.isSyncing.set(false);
                if (success) {
                    this.lastSyncTime.set(new Date());
                    this.setMeta('lastSyncTime', new Date());
                    this.updateSyncHealth(true);
                } else {
                    this.updateSyncHealth(false);
                }
            }),
            catchError(error => {
                this.isSyncing.set(false);
                this.syncErrors.set([ error.message || 'Sync failed' ]);
                this.updateSyncHealth(false);
                return of(false);
            })
        );
    }

    private performSync(): Observable<boolean> {
        return this.pullFromServer().pipe(
            switchMap(() => this.pushToServer()),
            map(() => true)
        );
    }

    private pullFromServer(): Observable<any> {
        const lastSync = this.lastSyncTime();

        return this.api.syncPull(this.deviceId, lastSync || undefined).pipe(
            switchMap(response => this.processPullResponse(response))
        );
    }

    private pushToServer(): Observable<any> {
        return from(this.db.queue.where('synced').equals(0).toArray()).pipe(
            switchMap(changes => {
                if (changes.length === 0) {
                    return of(null);
                }

                const lastSync = this.lastSyncTime();
                return this.api.syncPush(this.deviceId, changes, lastSync || undefined).pipe(
                    switchMap(response => this.processPushResponse(response, changes))
                );
            })
        );
    }

    private processPullResponse(response: any): Observable<void> {
        const {changes, serverTs} = response;

        if (!changes || changes.length === 0) {
            return of(void 0);
        }

        // Apply server changes to shadow store
        const shadowUpdates = changes.map((change: any) => ({
            entityName: change.entityName,
            entityId  : change.entityId,
            data      : change.payload,
            version   : change.version,
            lastSync  : new Date(serverTs)
        }));

        return from(this.db.shadow.bulkPut(shadowUpdates)).pipe(
            map(() => void 0)
        );
    }

    private processPushResponse(response: any, originalChanges: SyncChange[]): Observable<void> {
        const {applied, conflicts} = response;

        // Mark applied changes as synced
        const appliedIds = applied.map((change: any) => change.id);
        const syncedChanges = originalChanges.filter(change =>
            appliedIds.includes(change.id)
        );

        // Handle conflicts (server-wins strategy)
        if (conflicts && conflicts.length > 0) {
            this.handleConflicts(conflicts);
        }

        // Update queue
        return from(
            this.db.transaction('rw', this.db.queue, async () => {
                // Mark synced changes
                for (const change of syncedChanges) {
                    await this.db.queue.update(change.id!, {synced: true});
                }

                // Update retry count for failed changes
                const failedChanges = originalChanges.filter(change =>
                    !appliedIds.includes(change.id)
                );

                for (const change of failedChanges) {
                    await this.db.queue.update(change.id!, {
                        retryCount: change.retryCount + 1,
                        lastError : 'Server rejected change'
                    });
                }
            })
        ).pipe(
            tap(() => this.loadPendingChangesCount()),
            map(() => void 0)
        );
    }

    private handleConflicts(conflicts: any[]): void {
        // Server-wins strategy: update shadow with server data
        const shadowUpdates = conflicts.map(conflict => ({
            entityName: conflict.entityName,
            entityId  : conflict.entityId,
            data      : conflict.serverData,
            version   : conflict.serverVersion,
            lastSync  : new Date()
        }));

        this.db.shadow.bulkPut(shadowUpdates);

        // Log conflicts for user review
        const conflictMessages = conflicts.map(c =>
            `Conflict in ${ c.entityName }:${ c.entityId } - server version applied`
        );
        this.syncErrors.set([ ...this.syncErrors(), ...conflictMessages ]);
    }

    private updateSyncHealth(success: boolean): void {
        const current = this.syncHealth$.value;

        this.syncHealth$.next({
            isHealthy          : success && current.consecutiveFailures < 3,
            lastSuccessfulSync : success ? new Date() : current.lastSuccessfulSync,
            consecutiveFailures: success ? 0 : current.consecutiveFailures + 1,
            totalSynced        : success ? current.totalSynced + 1 : current.totalSynced,
            totalErrors        : success ? current.totalErrors : current.totalErrors + 1
        });
    }

    private loadPendingChangesCount(): void {
        from(this.db.queue.where('synced').equals(0).count()).subscribe(count => {
            this.pendingChanges.set(count);
        });
    }

    private loadLastSyncTime(): void {
        from(this.getMeta('lastSyncTime')).subscribe(lastSync => {
            if (lastSync) {
                this.lastSyncTime.set(new Date(lastSync));
            }
        });
    }

    private setMeta(key: string, value: any): Observable<void> {
        const meta: SyncMeta = {
            key,
            value,
            updatedAt: new Date()
        };

        return from(this.db.meta.put(meta)).pipe(
            map(() => void 0)
        );
    }

    private getMeta(key: string): Observable<any> {
        return from(this.db.meta.get(key)).pipe(
            map(meta => meta?.value || null)
        );
    }
}
