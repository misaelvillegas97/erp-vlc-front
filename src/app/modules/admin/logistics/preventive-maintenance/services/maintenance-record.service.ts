import { inject, Injectable }       from '@angular/core';
import { HttpClient }               from '@angular/common/http';
import { Observable }               from 'rxjs';
import { MaintenanceRecord }        from '../domain/model/maintenance-record.model';
import { MaintenanceStatisticsDto } from '../domain/model/maintenance-statistics.model';
import { FindCount }                from '@shared/domain/model/find-count';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceRecordService {
    private http = inject(HttpClient);
    private baseUrl = `api/v1/logistics/maintenance/records`;
    private statisticsUrl = `api/v1/logistics/maintenance/statistics`;

    /**
     * Obtiene todos los registros de mantenimiento
     * @param filters Filtros para la búsqueda
     * @param pagination Parámetros de paginación
     */
    getMaintenanceRecords(
        filters: any = {},
        pagination: { page: number, limit: number } = {page: 1, limit: 10}
    ): Observable<FindCount<MaintenanceRecord>> {
        let params = new URLSearchParams();

        // Añadir parámetros de paginación
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());

        // Añadir filtros
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null) {
                    if (Array.isArray(filters[key])) {
                        filters[key].forEach(value => {
                            params.append(key, value);
                        });
                    } else {
                        params.append(key, filters[key]);
                    }
                }
            });
        }

        return this.http.get<FindCount<MaintenanceRecord>>(`${ this.baseUrl }?${ params.toString() }`);
    }

    /**
     * Obtiene los registros de mantenimiento de un vehículo específico
     * @param vehicleId ID del vehículo
     */
    getVehicleMaintenanceRecords(vehicleId: string): Observable<MaintenanceRecord[]> {
        return this.http.get<MaintenanceRecord[]>(`${ this.baseUrl }/vehicle/${ vehicleId }`);
    }

    /**
     * Obtiene un registro de mantenimiento por su ID
     * @param id ID del registro de mantenimiento
     */
    getMaintenanceRecord(id: string): Observable<MaintenanceRecord> {
        return this.http.get<MaintenanceRecord>(`${ this.baseUrl }/${ id }`);
    }

    /**
     * Crea un nuevo registro de mantenimiento
     * @param record Datos del registro de mantenimiento
     */
    createMaintenanceRecord(record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Observable<MaintenanceRecord> {
        return this.http.post<MaintenanceRecord>(this.baseUrl, record);
    }

    /**
     * Actualiza un registro de mantenimiento existente
     * @param id ID del registro de mantenimiento
     * @param record Datos actualizados del registro de mantenimiento
     */
    updateMaintenanceRecord(id: string, record: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
        return this.http.patch<MaintenanceRecord>(`${ this.baseUrl }/${ id }`, record);
    }

    /**
     * Elimina un registro de mantenimiento
     * @param id ID del registro de mantenimiento
     */
    deleteMaintenanceRecord(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.baseUrl }/${ id }`);
    }

    /**
     * Obtiene las estadísticas de mantenimiento
     */
    getMaintenanceStatistics(): Observable<MaintenanceStatisticsDto> {
        return this.http.get<MaintenanceStatisticsDto>(this.statisticsUrl);
    }
}
