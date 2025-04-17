import { Injectable, OnDestroy }                            from '@angular/core';
import { BehaviorSubject, interval, Subject, Subscription } from 'rxjs';
import { finalize, switchMap, takeUntil }                   from 'rxjs/operators';
import { GeolocationService }                               from './geolocation.service';
import { GeoLocation }                                      from '../domain/model/vehicle-session.model';
import { VehicleSessionsService }                           from './vehicle-sessions.service';

// Interface para el almacenamiento de ubicaciones
export interface StoredLocationPoint {
    sessionId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class LocationTrackingService implements OnDestroy {
    private readonly DB_NAME = 'fleet_tracking_db';
    private readonly STORE_NAME = 'location_points';
    private readonly DB_VERSION = 1;

    // Subject para notificar cuando se debe detener el tracking
    private destroy$ = new Subject<void>();

    // Fuente de datos para notificar el estado del tracking
    private isTrackingSubject = new BehaviorSubject<boolean>(false);
    public isTracking$ = this.isTrackingSubject.asObservable();

    // El ID de la sesión actualmente en seguimiento
    private activeSessionId: string | null = null;

    // Suscripciones para limpiar al destruir el servicio
    private subscriptions: Subscription[] = [];

    // Contador de puntos almacenados para la sesión actual
    private _storedPointsCount = new BehaviorSubject<number>(0);
    public storedPointsCount$ = this._storedPointsCount.asObservable();

    constructor(
        private geolocationService: GeolocationService,
        private sessionsService: VehicleSessionsService
    ) {
        this.initDatabase();
    }

    ngOnDestroy(): void {
        this.stopTracking();
        this.destroy$.next();
        this.destroy$.complete();
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    /**
     * Inicializa la base de datos IndexedDB
     */
    private async initDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Comprobar si IndexedDB está disponible
            if (!window.indexedDB) {
                console.error('IndexedDB no está disponible en este navegador.');
                resolve();
                return;
            }

            const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = (event) => {
                console.error('Error al abrir IndexedDB:', event);
                reject(new Error('Error al abrir IndexedDB'));
            };

            request.onsuccess = () => {
                console.log('IndexedDB inicializada correctamente');
                resolve();
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    // Crear el almacén de objetos para los puntos de ubicación
                    const store = db.createObjectStore(this.STORE_NAME, {
                        keyPath      : 'id',
                        autoIncrement: true
                    });

                    // Crear índices para búsquedas eficientes
                    store.createIndex('sessionId', 'sessionId', {unique: false});
                    store.createIndex('timestamp', 'timestamp', {unique: false});
                }
            };
        });
    }

    /**
     * Inicia el rastreo de ubicación para una sesión específica
     */
    public startTracking(sessionId: string): void {
        console.log(`Iniciando rastreo de ubicación para la sesión ${ sessionId }`);

        // Si ya estamos rastreando, detener primero
        if (this.isTrackingSubject.value) {
            this.stopTracking();
        }

        this.activeSessionId = sessionId;
        this.isTrackingSubject.next(true);

        // Obtener la ubicación cada 30 segundos
        const sub = interval(30000)
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.geolocationService.getCurrentPosition()),
                finalize(() => this.isTrackingSubject.next(false))
            )
            .subscribe(location => {
                if (location) {
                    this.storeLocation(sessionId, location);

                    // También actualizar la ubicación en el servicio de sesiones (para la API)
                    this.sessionsService.updateLocation(sessionId, location).subscribe();
                }
            });

        this.subscriptions.push(sub);

        // Inicializar contador de puntos para esta sesión
        this.loadStoredPointsCount(sessionId);
    }

    /**
     * Detiene el rastreo de ubicación
     */
    public stopTracking(): void {
        console.log('Deteniendo rastreo de ubicación');
        this.destroy$.next();
        this.isTrackingSubject.next(false);
        this.activeSessionId = null;
    }

    /**
     * Almacena un punto de ubicación en IndexedDB
     */
    private async storeLocation(sessionId: string, location: GeoLocation): Promise<void> {
        const point: StoredLocationPoint = {
            sessionId,
            latitude : location.latitude,
            longitude: location.longitude,
            accuracy : location.accuracy,
            timestamp: Date.now()
        };

        try {
            await this.addToDatabase(point);
            // Incrementar el contador de puntos almacenados
            const currentCount = this._storedPointsCount.value;
            this._storedPointsCount.next(currentCount + 1);
            console.log(`Punto de ubicación almacenado. Total: ${ currentCount + 1 }`);
        } catch (error) {
            console.error('Error al almacenar ubicación:', error);
        }
    }

    /**
     * Añade un punto de ubicación a la base de datos
     */
    private addToDatabase(point: StoredLocationPoint): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.DB_NAME);

            request.onerror = (event) => reject(new Error('Error al abrir la base de datos'));

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = db.transaction([ this.STORE_NAME ], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);

                const addRequest = store.add(point);

                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(new Error('Error al añadir punto de ubicación'));

                transaction.oncomplete = () => db.close();
            };
        });
    }

    /**
     * Obtiene todos los puntos de ubicación para una sesión específica
     */
    public getLocationPoints(sessionId: string): Promise<StoredLocationPoint[]> {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.DB_NAME);

            request.onerror = () => reject(new Error('Error al abrir la base de datos'));

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = db.transaction([ this.STORE_NAME ], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('sessionId');

                const query = index.getAll(IDBKeyRange.only(sessionId));

                query.onsuccess = () => {
                    resolve(query.result);
                };

                query.onerror = () => reject(new Error('Error al recuperar puntos de ubicación'));

                transaction.oncomplete = () => db.close();
            };
        });
    }

    /**
     * Carga el contador de puntos almacenados para una sesión
     */
    private async loadStoredPointsCount(sessionId: string): Promise<void> {
        try {
            const points = await this.getLocationPoints(sessionId);
            this._storedPointsCount.next(points.length);
        } catch (error) {
            console.error('Error al cargar el contador de puntos:', error);
            this._storedPointsCount.next(0);
        }
    }

    /**
     * Elimina todos los puntos de ubicación para una sesión
     */
    public clearLocationPoints(sessionId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.DB_NAME);

            request.onerror = () => reject(new Error('Error al abrir la base de datos'));

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = db.transaction([ this.STORE_NAME ], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('sessionId');

                // Primero obtenemos las keys de los registros a eliminar
                const keysRequest = index.getAllKeys(IDBKeyRange.only(sessionId));

                keysRequest.onsuccess = () => {
                    // Luego eliminamos cada registro usando su clave
                    const keys = keysRequest.result;
                    let deletedCount = 0;

                    if (keys.length === 0) {
                        resolve();
                        return;
                    }

                    keys.forEach((key) => {
                        const deleteRequest = store.delete(key);
                        deleteRequest.onsuccess = () => {
                            deletedCount++;
                            if (deletedCount === keys.length) {
                                this._storedPointsCount.next(0);
                                resolve();
                            }
                        };
                        deleteRequest.onerror = () => reject(new Error('Error al eliminar punto de ubicación'));
                    });
                };

                keysRequest.onerror = () => reject(new Error('Error al obtener claves de puntos de ubicación'));

                transaction.oncomplete = () => db.close();
            };
        });
    }

    /**
     * Verifica si el dispositivo es móvil o tablet
     */
    public isMobileOrTablet(): boolean {
        // Detecta si es un dispositivo móvil o tablet mediante user agent
        const userAgent = navigator.userAgent || navigator.vendor;
        const regex1 = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
        const regex2 = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;

        return regex1.test(userAgent) || regex2.test(userAgent.substr(0, 4));
    }
}
