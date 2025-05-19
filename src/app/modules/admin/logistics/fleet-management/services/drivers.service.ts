import { Injectable }           from '@angular/core';
import { HttpClient }           from '@angular/common/http';
import { Observable }           from 'rxjs';
import { map }                  from 'rxjs/operators';
import { Driver, DriverStatus } from '@modules/admin/logistics/fleet-management/domain/model/driver.model';
import { FindCount }            from '@shared/domain/model/find-count';

@Injectable({
    providedIn: 'root'
})
export class DriversService {

    // API URL base para conductores
    private readonly apiUrl = `/api/v1/logistics/drivers`;

    constructor(private http: HttpClient) { }

    /**
     * Obtiene la lista de todos los conductores
     */
    public findAll(): Observable<FindCount<Driver>> {
        // En producción, hacemos la llamada real a la API
        return this.http.get<FindCount<Driver>>(this.apiUrl);
    }

    /**
     * Obtiene un conductor por su ID
     * @param id ID del conductor
     */
    public findById(id: string): Observable<Driver> {
        return this.http.get<Driver>(`${ this.apiUrl }/${ id }`);
    }

    /**
     * Obtiene la lista de conductores disponibles (filtrados por estado)
     */
    public findAvailable(): Observable<Driver[]> {
        return this.http.get<Driver[]>(`${ this.apiUrl }/available`);
    }

    /**
     * Actualiza el estado de un conductor
     * @param id ID del conductor
     * @param status Nuevo estado
     * @param sessionId ID de sesión (si aplica)
     */
    public updateStatus(id: string, status: DriverStatus, sessionId?: string): Observable<Driver> {
        return this.http.patch<Driver>(`${ this.apiUrl }/${ id }/status`, {status, sessionId});
    }

    /**
     * Crea un nuevo conductor
     * @param driver Datos del nuevo conductor
     */
    public create(driver: Omit<Driver, 'id'>): Observable<Driver> {
        return this.http.post<Driver>(this.apiUrl, driver);
    }

    /**
     * Actualiza un conductor existente
     * @param id ID del conductor
     * @param driver Datos actualizados
     */
    public update(id: string, driver: Partial<Driver>): Observable<Driver> {
        return this.http.put<Driver>(`${ this.apiUrl }/${ id }`, driver);
    }

    /**
     * Elimina un conductor
     * @param id ID del conductor
     */
    public delete(id: string): Observable<boolean> {
        return this.http.delete<void>(`${ this.apiUrl }/${ id }`).pipe(
            map(() => true)
        );
    }
}
