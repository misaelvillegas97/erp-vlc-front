import { Injectable }                        from '@angular/core';
import { HttpClient }                        from '@angular/common/http';
import { Observable, of }                    from 'rxjs';
import { delay, map }                        from 'rxjs/operators';
import { Driver, DriverStatus, LicenseType } from '../domain/model/driver.model';
import { environment }                       from 'environments/environment';
import { FindCount }                         from '@shared/domain/model/find-count';

@Injectable({
    providedIn: 'root'
})
export class DriversService {

    // API URL base para conductores
    private readonly apiUrl = `/api/v1/logistics/drivers`;

    // Datos mock para desarrollo
    private readonly mockDrivers: Driver[] = [
        {
            id               : '1',
            firstName: 'Juan',
            lastName         : 'Pérez',
            documentId       : '12345678-9',
            licenseNumber    : 'B-987654',
            licenseType      : LicenseType.B,
            licenseExpiryDate: '2026-08-15',
            photoUrl         : 'assets/images/avatars/male-01.jpg',
            status           : DriverStatus.AVAILABLE
        },
        {
            id               : '2',
            firstName: 'María',
            lastName         : 'González',
            documentId       : '98765432-1',
            licenseNumber    : 'A-123456',
            licenseType      : LicenseType.A,
            licenseExpiryDate: '2027-03-22',
            photoUrl         : 'assets/images/avatars/female-02.jpg',
            status           : DriverStatus.AVAILABLE
        },
        {
            id               : '3',
            firstName: 'Carlos',
            lastName         : 'Rodríguez',
            documentId       : '45678912-3',
            licenseNumber    : 'C-456789',
            licenseType      : LicenseType.C,
            licenseExpiryDate: '2025-11-10',
            photoUrl         : 'assets/images/avatars/male-03.jpg',
            status           : DriverStatus.UNAVAILABLE
        }
        // Se pueden agregar más conductores mock según sea necesario
    ];

    constructor(private http: HttpClient) { }

    /**
     * Obtiene la lista de todos los conductores
     */
    public findAll(): Observable<FindCount<Driver>> {
        // Para desarrollo, usamos datos mock con un delay para simular latencia de red
        if (!environment.production) {
            return of({items: [ ...this.mockDrivers ], total: this.mockDrivers.length}).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<FindCount<Driver>>(this.apiUrl);
    }

    /**
     * Obtiene un conductor por su ID
     * @param id ID del conductor
     */
    public findById(id: string): Observable<Driver> {
        // Para desarrollo, usamos datos mock con un delay para simular latencia de red
        if (!environment.production) {
            const driver = this.mockDrivers.find(d => d.id === id);
            return of(driver ? {...driver} : null).pipe(delay(300));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<Driver>(`${ this.apiUrl }/${ id }`);
    }

    /**
     * Obtiene la lista de conductores disponibles (filtrados por estado)
     */
    public findAvailable(): Observable<Driver[]> {
        // Para desarrollo, filtramos los datos mock
        if (!environment.production) {
            const availableDrivers = this.mockDrivers.filter(d => d.status === DriverStatus.AVAILABLE);
            return of([ ...availableDrivers ]).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API con un filtro
        return this.http.get<Driver[]>(`${ this.apiUrl }/available`);
    }

    /**
     * Actualiza el estado de un conductor
     * @param id ID del conductor
     * @param status Nuevo estado
     * @param sessionId ID de sesión (si aplica)
     */
    public updateStatus(id: string, status: DriverStatus, sessionId?: string): Observable<Driver> {
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const driverIndex = this.mockDrivers.findIndex(d => d.id === id);
            if (driverIndex !== -1) {
                const updatedDriver = {
                    ...this.mockDrivers[driverIndex],
                    status,
                    currentSessionId: sessionId
                };
                this.mockDrivers[driverIndex] = updatedDriver;
                return of({...updatedDriver}).pipe(delay(300));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.patch<Driver>(`${ this.apiUrl }/${ id }/status`, {status, sessionId});
    }

    /**
     * Crea un nuevo conductor
     * @param driver Datos del nuevo conductor
     */
    public create(driver: Omit<Driver, 'id'>): Observable<Driver> {
        // Para desarrollo, agregamos a los datos mock
        if (!environment.production) {
            const newDriver: Driver = {
                ...driver,
                id: Math.random().toString(36).substring(2, 11)
            };
            this.mockDrivers.push(newDriver);
            return of({...newDriver}).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.post<Driver>(this.apiUrl, driver);
    }

    /**
     * Actualiza un conductor existente
     * @param id ID del conductor
     * @param driver Datos actualizados
     */
    public update(id: string, driver: Partial<Driver>): Observable<Driver> {
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const driverIndex = this.mockDrivers.findIndex(d => d.id === id);
            if (driverIndex !== -1) {
                const updatedDriver = {
                    ...this.mockDrivers[driverIndex],
                    ...driver
                };
                this.mockDrivers[driverIndex] = updatedDriver;
                return of({...updatedDriver}).pipe(delay(300));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.put<Driver>(`${ this.apiUrl }/${ id }`, driver);
    }

    /**
     * Elimina un conductor
     * @param id ID del conductor
     */
    public delete(id: string): Observable<boolean> {
        // Para desarrollo, eliminamos de los datos mock
        if (!environment.production) {
            const initialLength = this.mockDrivers.length;
            const index = this.mockDrivers.findIndex(d => d.id === id);
            if (index !== -1) {
                this.mockDrivers.splice(index, 1);
            }
            return of(initialLength > this.mockDrivers.length).pipe(delay(300));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.delete<void>(`${ this.apiUrl }/${ id }`).pipe(
            map(() => true)
        );
    }
}
