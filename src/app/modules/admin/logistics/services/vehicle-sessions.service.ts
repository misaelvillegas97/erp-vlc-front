import { Injectable }                                                                      from '@angular/core';
import { HttpClient }                                                                      from '@angular/common/http';
import { Observable, of }                                                                  from 'rxjs';
import { delay, map }                                                                      from 'rxjs/operators';
import { ActiveSessionView, FinishSessionDto, GeoLocation, SessionStatus, VehicleSession } from '../domain/model/vehicle-session.model';
import { environment }                                                                     from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VehicleSessionsService {

    // API URL base para sesiones de vehículos
    private readonly apiUrl = `/api/logistics/sessions`;

    // Datos mock para desarrollo
    private readonly mockSessions: VehicleSession[] = [
        {
            id             : 'session-123',
            vehicleId      : '3',
            driverId       : '1',
            startTimestamp : '2025-04-14T08:30:00',
            endTimestamp   : null,
            status         : SessionStatus.ACTIVE,
            initialOdometer: 8000,
            finalOdometer  : null,
            purpose        : 'Entrega de productos',
            // authorizedBy   : 'Juan Pérez',
            initialLocation: {
                latitude : -33.4489,
                longitude: -70.6693,
                accuracy : 10,
                timestamp: Date.now() - 86400000  // 1 día atrás
            },
            locationHistory: [
                {
                    latitude : -33.4489,
                    longitude: -70.6693,
                    accuracy : 10,
                    timestamp: Date.now() - 86400000  // 1 día atrás
                },
                {
                    latitude : -33.4412,
                    longitude: -70.6500,
                    accuracy : 8,
                    timestamp: Date.now() - 43200000  // 12 horas atrás
                },
                {
                    latitude : -33.4356,
                    longitude: -70.6354,
                    accuracy : 5,
                    timestamp: Date.now() - 1800000  // 30 minutos atrás
                }
            ],
            notes          : 'Entrega programada para cliente XYZ'
        },
        {
            id             : 'session-456',
            vehicleId      : '2',
            driverId       : '3',
            startTimestamp : '2025-04-10T14:15:00',
            endTimestamp   : '2025-04-10T18:45:00',
            status         : SessionStatus.COMPLETED,
            initialOdometer: 25500,
            finalOdometer  : 25680,
            purpose        : 'Transporte de personal',
            // authorizedBy   : 'María González',
            initialLocation: {
                latitude : -33.4489,
                longitude: -70.6693,
                accuracy : 10,
                timestamp: Date.now() - 432000000  // 5 días atrás
            },
            finalLocation  : {
                latitude : -33.4489,
                longitude: -70.6693,
                accuracy : 10,
                timestamp: Date.now() - 432000000 + 16200000  // 5 días atrás + 4.5 horas
            },
            locationHistory: [
                {
                    latitude : -33.4489,
                    longitude: -70.6693,
                    accuracy : 10,
                    timestamp: Date.now() - 432000000
                },
                {
                    latitude : -33.3659,
                    longitude: -70.7751,
                    accuracy : 8,
                    timestamp: Date.now() - 432000000 + 7200000
                },
                {
                    latitude : -33.4489,
                    longitude: -70.6693,
                    accuracy : 10,
                    timestamp: Date.now() - 432000000 + 16200000
                }
            ],
            notes          : 'Traslado de personal a sucursal norte'
        }
        // Se pueden agregar más sesiones mock según sea necesario
    ];

    constructor(private http: HttpClient) { }

    /**
     * Obtiene todas las sesiones de vehículos
     */
    public findAll(): Observable<VehicleSession[]> {
        // Para desarrollo, usamos datos mock con un delay para simular latencia de red
        if (!environment.production) {
            return of([ ...this.mockSessions ]).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<VehicleSession[]>(this.apiUrl);
    }

    /**
     * Obtiene una sesión de vehículo por su ID
     * @param id ID de la sesión
     */
    public findById(id: string): Observable<VehicleSession> {
        // Para desarrollo, usamos datos mock con un delay para simular latencia de red
        if (!environment.production) {
            const session = this.mockSessions.find(s => s.id === id);
            return of(session ? {...session} : null).pipe(delay(300));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<VehicleSession>(`${ this.apiUrl }/${ id }`);
    }

    /**
     * Obtiene las sesiones activas
     */
    public findActive(): Observable<VehicleSession[]> {
        // Para desarrollo, filtramos los datos mock
        if (!environment.production) {
            const activeSessions = this.mockSessions.filter(s => s.status === SessionStatus.ACTIVE);
            return of([ ...activeSessions ]).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/active`);
    }

    /**
     * Busca sesiones por vehículo
     * @param vehicleId ID del vehículo
     */
    public findByVehicle(vehicleId: string): Observable<VehicleSession[]> {
        // Para desarrollo, filtramos los datos mock
        if (!environment.production) {
            const vehicleSessions = this.mockSessions.filter(s => s.vehicleId === vehicleId);
            return of([ ...vehicleSessions ]).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/vehicle/${ vehicleId }`);
    }

    /**
     * Busca sesiones por conductor
     * @param driverId ID del conductor
     */
    public findByDriver(driverId: string): Observable<VehicleSession[]> {
        // Para desarrollo, filtramos los datos mock
        if (!environment.production) {
            const driverSessions = this.mockSessions.filter(s => s.driverId === driverId);
            return of([ ...driverSessions ]).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/driver/${ driverId }`);
    }

    /**
     * Inicia una nueva sesión de vehículo
     * @param session Datos de la sesión a iniciar
     */
    public startSession(session: Omit<VehicleSession, 'id' | 'status' | 'startTimestamp'>): Observable<VehicleSession> {
        // Para desarrollo, agregamos a los datos mock
        if (!environment.production) {
            const newSession: VehicleSession = {
                ...session,
                id            : `session-${ Math.random().toString(36).substring(2, 7) }`,
                status        : SessionStatus.ACTIVE,
                startTimestamp: new Date().toISOString(),
                endTimestamp  : null,
                finalOdometer : null,
                finalLocation : null
            };
            this.mockSessions.push(newSession);
            return of({...newSession}).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.post<VehicleSession>(`${ this.apiUrl }/start`, session);
    }

    /**
     * Finaliza una sesión de vehículo
     * @param id ID de la sesión
     * @param finalOdometer Lectura final del odómetro
     * @param endLocation Ubicación final
     * @param notes Notas adicionales
     */
    public endSession(
        id: string,
        finalOdometer: number,
        endLocation: GeoLocation,
        notes?: string
    ): Observable<VehicleSession> {
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const sessionIndex = this.mockSessions.findIndex(s => s.id === id);
            if (sessionIndex !== -1) {
                const updatedSession = {
                    ...this.mockSessions[sessionIndex],
                    status : SessionStatus.COMPLETED,
                    endTime: new Date().toISOString(),
                    finalOdometer,
                    endLocation
                };

                if (notes) {
                    updatedSession.notes = this.mockSessions[sessionIndex].notes
                        ? `${ this.mockSessions[sessionIndex].notes }\n${ notes }`
                        : notes;
                }

                this.mockSessions[sessionIndex] = updatedSession;
                return of({...updatedSession}).pipe(delay(500));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.post<VehicleSession>(`${ this.apiUrl }/${ id }/end`, {
            finalOdometer,
            endLocation,
            notes
        });
    }

    /**
     * Actualiza la ubicación actual de una sesión
     * @param id ID de la sesión
     * @param location Nueva ubicación
     */
    public updateLocation(id: string, location: GeoLocation): Observable<VehicleSession> {
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const sessionIndex = this.mockSessions.findIndex(s => s.id === id);
            if (sessionIndex !== -1 && this.mockSessions[sessionIndex].status === SessionStatus.ACTIVE) {
                const updatedSession = {
                    ...this.mockSessions[sessionIndex],
                    currentLocation: location
                };

                // Agregar la ubicación al historial
                if (!updatedSession.locationHistory) {
                    updatedSession.locationHistory = [];
                }
                updatedSession.locationHistory.push(location);

                this.mockSessions[sessionIndex] = updatedSession;
                return of({...updatedSession}).pipe(delay(300));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.post<VehicleSession>(`${ this.apiUrl }/${ id }/location`, location);
    }

    /**
     * Cancela una sesión activa
     * @param id ID de la sesión
     * @param reason Motivo de la cancelación
     */
    public cancelSession(id: string, reason: string): Observable<VehicleSession> {
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const sessionIndex = this.mockSessions.findIndex(s => s.id === id);
            if (sessionIndex !== -1 && this.mockSessions[sessionIndex].status === SessionStatus.ACTIVE) {
                const updatedSession = {
                    ...this.mockSessions[sessionIndex],
                    status : SessionStatus.CANCELLED,
                    endTime: new Date().toISOString(),
                    notes  : this.mockSessions[sessionIndex].notes
                        ? `${ this.mockSessions[sessionIndex].notes }\nCancelado: ${ reason }`
                        : `Cancelado: ${ reason }`
                };

                this.mockSessions[sessionIndex] = updatedSession;
                return of({...updatedSession}).pipe(delay(500));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.post<VehicleSession>(`${ this.apiUrl }/${ id }/cancel`, {reason});
    }

    /**
     * Obtiene las sesiones activas con detalles adicionales
     */
    public getActiveSessions(): Observable<ActiveSessionView[]> {
        if (!environment.production) {
            // Filtramos sesiones activas
            return this.findActive().pipe(
                delay(500),
                map(sessions => {
                    // Transformar a vista ampliada con datos ficticios para desarrollo
                    return sessions.map(session => {
                        // Calcular duración en minutos desde el inicio hasta ahora
                        const startTime = new Date(session.startTimestamp).getTime();
                        const now = new Date().getTime();
                        const durationMinutes = Math.floor((now - startTime) / (60 * 1000));

                        // Determinar estado basado en duración
                        let status: 'normal' | 'warning' | 'alert' = 'normal';
                        if (durationMinutes > 480) { // Más de 8 horas
                            status = 'alert';
                        } else if (durationMinutes > 240) { // Más de 4 horas
                            status = 'warning';
                        }

                        return {
                            id             : session.id,
                            startTimestamp : session.startTimestamp,
                            duration       : durationMinutes,
                            initialOdometer: session.initialOdometer,
                            driver         : {
                                id        : session.driverId,
                                firstName: 'Nombre', // En producción, estos datos vendrían del backend
                                lastName  : 'Apellido',
                                documentId: '12345678-9',
                                photoUrl  : '/images/avatars/male-01.jpg'
                            },
                            vehicle        : {
                                id          : session.vehicleId,
                                brand       : 'Toyota',
                                model       : 'Hilux',
                                licensePlate: 'AB-1234',
                                photoUrl    : null
                            },
                            currentLocation: session.currentLocation || session.initialLocation,
                            status
                        };
                    });
                })
            );
        }

        // En producción, llamada real al API
        return this.http.get<ActiveSessionView[]>(`${ this.apiUrl }/active/details`);
    }

    /**
     * Finaliza una sesión de vehículo (versión actualizada)
     */
    public finishSession(id: string, data: FinishSessionDto): Observable<VehicleSession> {
        if (!environment.production) {
            const sessionIndex = this.mockSessions.findIndex(s => s.id === id);
            if (sessionIndex !== -1) {
                const updatedSession = {
                    ...this.mockSessions[sessionIndex],
                    status       : SessionStatus.COMPLETED,
                    endTimestamp : new Date().toISOString(),
                    endTime      : new Date().toISOString(),
                    finalOdometer: data.finalOdometer,
                    finalLocation: data.finalLocation,
                    incidents    : data.incidents
                };

                this.mockSessions[sessionIndex] = updatedSession;
                return of({...updatedSession}).pipe(delay(500));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.post<VehicleSession>(`${ this.apiUrl }/${ id }/finish`, data);
    }

    /**
     * Obtiene el historial de sesiones de vehículos
     */
    public getHistoricalSessions(): Observable<VehicleSession[]> {
        if (!environment.production) {
            // En desarrollo, devolver todas las sesiones que no estén activas
            const historicalSessions = this.mockSessions.filter(s =>
                s.status === SessionStatus.COMPLETED ||
                s.status === SessionStatus.CANCELLED ||
                s.status === SessionStatus.EXPIRED
            );

            return of([ ...historicalSessions ]).pipe(delay(500));
        }

        // En producción, llamada real al API
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/history`);
    }
}
