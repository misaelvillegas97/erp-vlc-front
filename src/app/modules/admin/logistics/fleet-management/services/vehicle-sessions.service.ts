import { Injectable }                 from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { Observable, of }             from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import {
    FinishSessionDto,
    GeoLocation,
    VehicleSession
}                                     from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { Pagination }                 from '@shared/domain/model/pagination';
import {
    ActiveSessionsDashboardData,
    ComplianceSafetyDashboardData,
    DriverPerformanceDashboardData,
    GeographicalAnalysisDashboardData,
    HistoricalAnalysisDashboardData,
    VehicleUtilizationDashboardData
}                                     from '@modules/admin/logistics/fleet-management/domain/model/dashboard.model';
import { OfflineCacheService }        from './offline-cache.service';

@Injectable({
    providedIn: 'root'
})
export class VehicleSessionsService {

    // API URL base para sesiones de vehículos
    private readonly apiUrl = `/api/v1/logistics/sessions`;
    private readonly apiUrlDashboards = `/api/v1/logistics/dashboards`;

    constructor(
        private http: HttpClient,
        private offlineCache: OfflineCacheService
    ) {
        // Clear old cache entries on service initialization
        this.offlineCache.clearOldCache().subscribe();
    }

    /**
     * Obtiene todas las sesiones de vehículos
     */
    public findAll(query: any): Observable<VehicleSession[]> {
        return this.http.get<VehicleSession[]>(this.apiUrl, {params: query});
    }

    /**
     * Obtiene una sesión de vehículo por su ID
     * @param id ID de la sesión
     */
    public findById(id: string): Observable<VehicleSession> {
        // Check if we're offline
        if (!this.offlineCache.isNetworkOnline()) {
            console.log('Network is offline, trying to get session from cache');
            return this.offlineCache.getCachedSession(id).pipe(
                switchMap(cachedSession => {
                    if (cachedSession) {
                        console.log('Session found in cache', cachedSession);
                        return of(cachedSession);
                    } else {
                        console.error('Session not found in cache and network is offline');
                        throw new Error('No se puede obtener la sesión. No hay conexión a internet y la sesión no está en caché.');
                    }
                })
            );
        }

        // If we're online, try to get from API and cache the result
        return this.http.get<VehicleSession>(`${ this.apiUrl }/${ id }`).pipe(
            tap(session => {
                // Cache the session for offline use
                this.offlineCache.cacheSession(session).subscribe();
            }),
            catchError(error => {
                console.error('Error fetching session from API, trying cache', error);
                // If API call fails, try to get from cache
                return this.offlineCache.getCachedSession(id).pipe(
                    switchMap(cachedSession => {
                        if (cachedSession) {
                            console.log('Session found in cache after API error', cachedSession);
                            return of(cachedSession);
                        } else {
                            console.error('Session not found in cache after API error');
                            throw error;
                        }
                    })
                );
            })
        );
    }

    /**
     * Obtiene las sesiones activas
     */
    public findActive(): Observable<VehicleSession[]> {
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/active`);
    }

    public findMyActiveSession(): Observable<VehicleSession> {
        return this.http.get<VehicleSession>(`${ this.apiUrl }/my-active`);
    }

    /**
     * Busca sesiones por vehículo
     * @param vehicleId ID del vehículo
     */
    public findByVehicle(vehicleId: string): Observable<VehicleSession[]> {
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/vehicle/${ vehicleId }`);
    }

    /**
     * Busca sesiones por conductor
     * @param driverId ID del conductor
     */
    public findByDriver(driverId: string): Observable<VehicleSession[]> {
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/driver/${ driverId }`);
    }

    /**
     * Inicia una nueva sesión de vehículo
     * @param session Datos de la sesión a iniciar
     */
    public startSession(session: Omit<VehicleSession, 'id' | 'status' | 'startTime'>): Observable<VehicleSession> {
        return this.http.post<VehicleSession>(`${ this.apiUrl }`, session);
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
        return this.http.post<VehicleSession>(`${ this.apiUrl }/${ id }/location`, location);
    }

    /**
     * Cancela una sesión activa
     * @param id ID de la sesión
     * @param reason Motivo de la cancelación
     */
    public cancelSession(id: string, reason: string): Observable<VehicleSession> {
        return this.http.post<VehicleSession>(`${ this.apiUrl }/${ id }/cancel`, {reason});
    }

    /**
     * Obtiene las sesiones activas con detalles adicionales
     */
    public getActiveSessions(): Observable<VehicleSession[]> {
        return this.http.get<VehicleSession[]>(`${ this.apiUrl }/active/details`);
    }

    /**
     * Finaliza una sesión de vehículo (versión actualizada)
     */
    public finishSession(id: string, data: FinishSessionDto): Observable<VehicleSession> {
        return this.http.post<VehicleSession>(`${ this.apiUrl }/${ id }/finish`, data);
    }

    /**
     * Obtiene el historial de sesiones de vehículos
     */
    public getHistoricalSessions(params: any): Observable<Pagination<VehicleSession>> {
        return this.http.get<Pagination<VehicleSession>>(`${ this.apiUrl }/history`, {params});
    }

    /**
     * Obtiene los datos para el dashboard de sesiones activas
     */
    public getActiveSessionsDashboardData(): Observable<ActiveSessionsDashboardData> {
        return this.http.get<ActiveSessionsDashboardData>(`${ this.apiUrlDashboards }/active-sessions`);
    }

    /**
     * Obtiene los datos para el dashboard de análisis histórico
     */
    public getHistoricalAnalysisDashboardData(params: any): Observable<HistoricalAnalysisDashboardData> {
        return this.http.get<HistoricalAnalysisDashboardData>(`${ this.apiUrlDashboards }/historical-analysis`, {params});
    }

    /**
     * Obtiene los datos para el dashboard de rendimiento de conductores
     */
    public getDriverPerformanceDashboardData(params: any): Observable<DriverPerformanceDashboardData> {
        return this.http.get<DriverPerformanceDashboardData>(`${ this.apiUrlDashboards }/driver-performance`, {params});
    }

    /**
     * Obtiene los datos para el dashboard de utilización de vehículos
     */
    public getVehicleUtilizationDashboardData(params: any): Observable<VehicleUtilizationDashboardData> {
        return this.http.get<VehicleUtilizationDashboardData>(`${ this.apiUrlDashboards }/vehicle-utilization`, {params});
    }

    /**
     * Obtiene los datos para el dashboard de análisis geográfico
     */
    public getGeographicalAnalysisDashboardData(params: any): Observable<GeographicalAnalysisDashboardData> {
        return this.http.get<GeographicalAnalysisDashboardData>(`${ this.apiUrlDashboards }/geographical-analysis`, {params});
    }

    /**
     * Obtiene los datos para el dashboard de cumplimiento y seguridad
     */
    public getComplianceSafetyDashboardData(params: any): Observable<ComplianceSafetyDashboardData> {
        return this.http.get<ComplianceSafetyDashboardData>(`${ this.apiUrlDashboards }/compliance-safety`, {params});
    }
}
