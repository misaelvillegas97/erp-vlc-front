import { Injectable }            from '@angular/core';
import { VehicleSession }        from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { from, Observable, of }  from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class OfflineCacheService {
    private readonly DB_NAME = 'fleet_management_cache';
    private readonly STORE_NAME = 'sessions';
    private readonly DB_VERSION = 1;
    private db: IDBDatabase | null = null;

    // Network status
    private isOnline = navigator.onLine;

    constructor() {
        // Initialize the database
        this.initDatabase();

        // Listen for online/offline events
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
    }

    /**
     * Initialize the IndexedDB database
     */
    private initDatabase(): Observable<IDBDatabase> {
        return from(new Promise<IDBDatabase>((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = (event) => {
                console.error('Error opening IndexedDB', event);
                reject('Error opening IndexedDB');
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store for sessions
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, {keyPath: 'id'});
                }
            };
        }));
    }

    /**
     * Get network status
     */
    public isNetworkOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Save a session to the cache
     */
    public cacheSession(session: VehicleSession): Observable<VehicleSession> {
        return this.initDatabase().pipe(
            switchMap(db => {
                return from(new Promise<VehicleSession>((resolve, reject) => {
                    const transaction = db.transaction([ this.STORE_NAME ], 'readwrite');
                    const store = transaction.objectStore(this.STORE_NAME);

                    // Add timestamp for cache management
                    const sessionWithTimestamp = {
                        ...session,
                        cachedAt: new Date().getTime()
                    };

                    const request = store.put(sessionWithTimestamp);

                    request.onsuccess = () => {
                        resolve(session);
                    };

                    request.onerror = (event) => {
                        console.error('Error caching session', event);
                        reject('Error caching session');
                    };
                }));
            }),
            catchError(error => {
                console.error('Failed to cache session', error);
                return of(session); // Return the original session even if caching fails
            })
        );
    }

    /**
     * Get a session from the cache by ID
     */
    public getCachedSession(id: string): Observable<VehicleSession | null> {
        return this.initDatabase().pipe(
            switchMap(db => {
                return from(new Promise<VehicleSession | null>((resolve, reject) => {
                    const transaction = db.transaction([ this.STORE_NAME ], 'readonly');
                    const store = transaction.objectStore(this.STORE_NAME);

                    const request = store.get(id);

                    request.onsuccess = () => {
                        resolve(request.result || null);
                    };

                    request.onerror = (event) => {
                        console.error('Error retrieving cached session', event);
                        reject('Error retrieving cached session');
                    };
                }));
            }),
            catchError(error => {
                console.error('Failed to get cached session', error);
                return of(null);
            })
        );
    }

    /**
     * Get all cached sessions
     */
    public getAllCachedSessions(): Observable<VehicleSession[]> {
        return this.initDatabase().pipe(
            switchMap(db => {
                return from(new Promise<VehicleSession[]>((resolve, reject) => {
                    const transaction = db.transaction([ this.STORE_NAME ], 'readonly');
                    const store = transaction.objectStore(this.STORE_NAME);

                    const request = store.getAll();

                    request.onsuccess = () => {
                        resolve(request.result || []);
                    };

                    request.onerror = (event) => {
                        console.error('Error retrieving all cached sessions', event);
                        reject('Error retrieving all cached sessions');
                    };
                }));
            }),
            catchError(error => {
                console.error('Failed to get all cached sessions', error);
                return of([]);
            })
        );
    }

    /**
     * Clear old cache entries (older than 7 days)
     */
    public clearOldCache(): Observable<void> {
        const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const cutoffTime = new Date().getTime() - CACHE_TTL;

        return this.initDatabase().pipe(
            switchMap(db => {
                return this.getAllCachedSessions().pipe(
                    switchMap(sessions => {
                        const oldSessions = sessions.filter(session =>
                            (session as any).cachedAt && (session as any).cachedAt < cutoffTime
                        );

                        if (oldSessions.length === 0) {
                            return of(void 0);
                        }

                        return from(new Promise<void>((resolve, reject) => {
                            const transaction = db.transaction([ this.STORE_NAME ], 'readwrite');
                            const store = transaction.objectStore(this.STORE_NAME);

                            let completed = 0;
                            let hasError = false;

                            oldSessions.forEach(session => {
                                const request = store.delete(session.id);

                                request.onsuccess = () => {
                                    completed++;
                                    if (completed === oldSessions.length && !hasError) {
                                        resolve();
                                    }
                                };

                                request.onerror = (event) => {
                                    if (!hasError) {
                                        hasError = true;
                                        console.error('Error clearing old cache', event);
                                        reject('Error clearing old cache');
                                    }
                                };
                            });

                            // If there are no old sessions to delete
                            if (oldSessions.length === 0) {
                                resolve();
                            }
                        }));
                    })
                );
            }),
            catchError(error => {
                console.error('Failed to clear old cache', error);
                return of(void 0);
            })
        );
    }
}
