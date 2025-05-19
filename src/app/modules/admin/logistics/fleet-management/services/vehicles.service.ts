import { Injectable }             from '@angular/core';
import { HttpClient }             from '@angular/common/http';
import { Observable }             from 'rxjs';
import { map }                    from 'rxjs/operators';
import { Vehicle, VehicleStatus } from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';
import { FindCount }              from '@shared/domain/model/find-count';

@Injectable({
    providedIn: 'root'
})
export class VehiclesService {

    // API URL base para vehículos
    private readonly apiUrl = `/api/v1/logistics/vehicles`;

    constructor(private http: HttpClient) { }

    /**
     * Obtiene la lista de todos los vehículos
     */
    public findAll(): Observable<Vehicle[]> {
        return this.http.get<Vehicle[]>(this.apiUrl);
    }

    /**
     * Obtiene un vehículo por su ID
     * @param id ID del vehículo
     */
    public findById(id: string): Observable<Vehicle> {
        return this.http.get<Vehicle>(`${ this.apiUrl }/${ id }`);
    }

    /**
     * Obtiene la lista de vehículos disponibles (filtrados por estado)
     */
    public findAvailable(): Observable<FindCount<Vehicle>> {
        return this.http.get<FindCount<Vehicle>>(`${ this.apiUrl }/available`);
    }

    /**
     * Alias para findAvailable - mantiene compatibilidad con el código existente
     */
    public findAvailableVehicles(): Observable<FindCount<Vehicle>> {
        return this.findAvailable();
    }

    /**
     * Actualiza el estado de un vehículo
     * @param id ID del vehículo
     * @param status Nuevo estado
     * @param sessionId ID de sesión (si aplica)
     * @param odometer Lectura actual del odómetro
     */
    public updateStatus(
        id: string,
        status: VehicleStatus,
        sessionId?: string,
        odometer?: number
    ): Observable<Vehicle> {
        return this.http.patch<Vehicle>(`${ this.apiUrl }/${ id }/status`, {
            status,
            sessionId,
            odometer
        });
    }

    /**
     * Crea un nuevo vehículo
     * @param vehicle Datos del nuevo vehículo
     */
    public create(vehicle: Omit<Vehicle, 'id'>): Observable<Vehicle> {
        return this.http.post<Vehicle>(this.apiUrl, vehicle);
    }

    /**
     * Actualiza un vehículo existente
     * @param id ID del vehículo
     * @param vehicle Datos actualizados
     */
    public update(id: string, vehicle: Partial<Vehicle>): Observable<Vehicle> {
        return this.http.put<Vehicle>(`${ this.apiUrl }/${ id }`, vehicle);
    }

    /**
     * Elimina un vehículo
     * @param id ID del vehículo
     */
    public delete(id: string): Observable<boolean> {
        return this.http.delete<void>(`${ this.apiUrl }/${ id }`).pipe(
            map(() => true)
        );
    }

    /**
     * Actualiza la lectura del odómetro de un vehículo
     * @param id ID del vehículo
     * @param odometerValue Nuevo valor del odómetro
     */
    public updateOdometer(id: string, odometerValue: number): Observable<Vehicle> {
        return this.http.patch<Vehicle>(`${ this.apiUrl }/${ id }/odometer`, {
            odometer: odometerValue
        });
    }

    /**
     * Programa el próximo mantenimiento para un vehículo
     * @param id ID del vehículo
     * @param date Fecha del próximo mantenimiento
     */
    public scheduleNextMaintenance(id: string, date: string): Observable<Vehicle> {
        return this.http.patch<Vehicle>(`${ this.apiUrl }/${ id }/maintenance`, {
            nextMaintenanceDate: date
        });
    }
}
