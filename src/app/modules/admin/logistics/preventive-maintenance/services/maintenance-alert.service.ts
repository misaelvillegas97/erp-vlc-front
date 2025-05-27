import { inject, Injectable }            from '@angular/core';
import { HttpClient }                    from '@angular/common/http';
import { Observable }                    from 'rxjs';
import { AlertStatus, MaintenanceAlert } from '../domain/model/maintenance-alert.model';

@Injectable({providedIn: 'root'})
export class MaintenanceAlertService {
    private http = inject(HttpClient);
    private baseUrl = `api/v1/logistics/maintenance/alerts`;

    /**
     * Obtiene todas las alertas de mantenimiento
     */
    getAlerts(): Observable<MaintenanceAlert[]> {
        return this.http.get<MaintenanceAlert[]>(this.baseUrl);
    }

    /**
     * Obtiene las alertas activas
     */
    getActiveAlerts(): Observable<MaintenanceAlert[]> {
        return this.http.get<MaintenanceAlert[]>(`${ this.baseUrl }/active`);
    }

    /**
     * Obtiene las alertas de un vehículo específico
     * @param vehicleId ID del vehículo
     */
    getVehicleAlerts(vehicleId: string): Observable<MaintenanceAlert[]> {
        return this.http.get<MaintenanceAlert[]>(`${ this.baseUrl }/vehicle/${ vehicleId }`);
    }

    /**
     * Obtiene una alerta específica por su ID
     * @param id ID de la alerta
     */
    getAlert(id: string): Observable<MaintenanceAlert> {
        return this.http.get<MaintenanceAlert>(`${ this.baseUrl }/${ id }`);
    }

    /**
     * Actualiza el estado de una alerta
     * @param id ID de la alerta
     * @param status Nuevo estado de la alerta
     */
    updateAlertStatus(id: string, status: AlertStatus): Observable<MaintenanceAlert> {
        return this.http.patch<MaintenanceAlert>(`${ this.baseUrl }/${ id }/status`, {status});
    }

    /**
     * Marca una alerta como reconocida
     * @param id ID de la alerta
     */
    acknowledgeAlert(id: string): Observable<MaintenanceAlert> {
        return this.updateAlertStatus(id, AlertStatus.ACKNOWLEDGED);
    }

    /**
     * Marca una alerta como resuelta
     * @param id ID de la alerta
     */
    resolveAlert(id: string): Observable<MaintenanceAlert> {
        return this.updateAlertStatus(id, AlertStatus.RESOLVED);
    }

    /**
     * Descarta una alerta
     * @param id ID de la alerta
     */
    dismissAlert(id: string): Observable<MaintenanceAlert> {
        return this.updateAlertStatus(id, AlertStatus.DISMISSED);
    }
}
