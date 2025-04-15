import { Injectable }                          from '@angular/core';
import { HttpClient }                          from '@angular/common/http';
import { Observable, of }                      from 'rxjs';
import { delay, map }                          from 'rxjs/operators';
import { Vehicle, VehicleStatus, VehicleType } from '../domain/model/vehicle.model';
import { environment }                         from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VehiclesService {

    // API URL base para vehículos
    private readonly apiUrl = `/api/logistics/vehicles`;

    // Datos mock para desarrollo
    private readonly mockVehicles: Vehicle[] = [
        {
            id                 : '1',
            brand              : 'Toyota',
            model              : 'Hilux',
            year               : 2023,
            licensePlate       : 'AB-1234',
            vin                : 'JT3HN86R0P0123456',
            type               : VehicleType.PICKUP,
            color              : 'Blanco',
            fuelType           : 'Diésel',
            lastKnownOdometer  : 12540,
            tankCapacity       : 80,
            photoUrl           : 'assets/images/ui/vehicle-hilux.jpg',
            status             : VehicleStatus.AVAILABLE,
            lastMaintenanceDate: '2025-03-01',
            nextMaintenanceDate: '2025-05-01'
        },
        {
            id                 : '2',
            brand              : 'Hyundai',
            model              : 'H1',
            year               : 2022,
            licensePlate       : 'BC-5678',
            vin                : 'KMJWA37HABU123456',
            type               : VehicleType.VAN,
            color              : 'Gris',
            fuelType           : 'Diésel',
            lastKnownOdometer  : 25680,
            tankCapacity       : 75,
            photoUrl           : 'assets/images/ui/vehicle-h1.jpg',
            status             : VehicleStatus.AVAILABLE,
            lastMaintenanceDate: '2025-01-15',
            nextMaintenanceDate: '2025-04-15'
        },
        {
            id                 : '3',
            brand              : 'Nissan',
            model              : 'Versa',
            year               : 2024,
            licensePlate       : 'CD-9012',
            vin                : '3N1CN7AP1FL123456',
            type               : VehicleType.SEDAN,
            color              : 'Azul',
            fuelType           : 'Gasolina',
            lastKnownOdometer  : 8200,
            tankCapacity       : 45,
            photoUrl           : 'assets/images/ui/vehicle-versa.jpg',
            status             : VehicleStatus.IN_USE,
            currentSessionId   : 'session-123',
            lastMaintenanceDate: '2025-02-10',
            nextMaintenanceDate: '2025-06-10'
        },
        {
            id                 : '4',
            brand              : 'Ford',
            model              : 'Ranger',
            year               : 2023,
            licensePlate       : 'DE-3456',
            vin                : '8AFDR13D1PJ123456',
            type               : VehicleType.PICKUP,
            color              : 'Negro',
            fuelType           : 'Diésel',
            lastKnownOdometer  : 15300,
            tankCapacity       : 80,
            photoUrl           : 'assets/images/ui/vehicle-ranger.jpg',
            status             : VehicleStatus.MAINTENANCE,
            lastMaintenanceDate: '2025-03-25',
            nextMaintenanceDate: '2025-05-25'
        }
        // Se pueden agregar más vehículos mock según sea necesario
    ];

    constructor(private http: HttpClient) { }

    /**
     * Obtiene la lista de todos los vehículos
     */
    public findAll(): Observable<Vehicle[]> {
        // Para desarrollo, usamos datos mock con un delay para simular latencia de red
        if (!environment.production) {
            return of([ ...this.mockVehicles ]).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<Vehicle[]>(this.apiUrl);
    }

    /**
     * Obtiene un vehículo por su ID
     * @param id ID del vehículo
     */
    public findById(id: string): Observable<Vehicle> {
        // Para desarrollo, usamos datos mock con un delay para simular latencia de red
        if (!environment.production) {
            const vehicle = this.mockVehicles.find(v => v.id === id);
            return of(vehicle ? {...vehicle} : null).pipe(delay(300));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.get<Vehicle>(`${ this.apiUrl }/${ id }`);
    }

    /**
     * Obtiene la lista de vehículos disponibles (filtrados por estado)
     */
    public findAvailable(): Observable<Vehicle[]> {
        // Para desarrollo, filtramos los datos mock
        if (!environment.production) {
            const availableVehicles = this.mockVehicles.filter(v => v.status === VehicleStatus.AVAILABLE);
            return of([ ...availableVehicles ]).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API con un filtro
        return this.http.get<Vehicle[]>(`${ this.apiUrl }/available`);
    }

    /**
     * Alias para findAvailable - mantiene compatibilidad con el código existente
     */
    public findAvailableVehicles(): Observable<Vehicle[]> {
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
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const vehicleIndex = this.mockVehicles.findIndex(v => v.id === id);
            if (vehicleIndex !== -1) {
                const updatedVehicle = {
                    ...this.mockVehicles[vehicleIndex],
                    status,
                    currentSessionId: sessionId
                };

                // Actualizar odómetro si se proporciona
                if (odometer !== undefined) {
                    updatedVehicle.lastKnownOdometer = odometer;
                }

                this.mockVehicles[vehicleIndex] = updatedVehicle;
                return of({...updatedVehicle}).pipe(delay(300));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
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
        // Para desarrollo, agregamos a los datos mock
        if (!environment.production) {
            const newVehicle: Vehicle = {
                ...vehicle,
                id: Math.random().toString(36).substring(2, 11)
            };
            this.mockVehicles.push(newVehicle);
            return of({...newVehicle}).pipe(delay(500));
        }

        // En producción, hacemos la llamada real a la API
        return this.http.post<Vehicle>(this.apiUrl, vehicle);
    }

    /**
     * Actualiza un vehículo existente
     * @param id ID del vehículo
     * @param vehicle Datos actualizados
     */
    public update(id: string, vehicle: Partial<Vehicle>): Observable<Vehicle> {
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const vehicleIndex = this.mockVehicles.findIndex(v => v.id === id);
            if (vehicleIndex !== -1) {
                const updatedVehicle = {
                    ...this.mockVehicles[vehicleIndex],
                    ...vehicle
                };
                this.mockVehicles[vehicleIndex] = updatedVehicle;
                return of({...updatedVehicle}).pipe(delay(300));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.put<Vehicle>(`${ this.apiUrl }/${ id }`, vehicle);
    }

    /**
     * Elimina un vehículo
     * @param id ID del vehículo
     */
    public delete(id: string): Observable<boolean> {
        // Para desarrollo, eliminamos de los datos mock
        if (!environment.production) {
            const initialLength = this.mockVehicles.length;
            const index = this.mockVehicles.findIndex(v => v.id === id);
            if (index !== -1) {
                this.mockVehicles.splice(index, 1);
            }
            return of(initialLength > this.mockVehicles.length).pipe(delay(300));
        }

        // En producción, hacemos la llamada real a la API
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
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const vehicleIndex = this.mockVehicles.findIndex(v => v.id === id);
            if (vehicleIndex !== -1) {
                const updatedVehicle = {
                    ...this.mockVehicles[vehicleIndex],
                    lastKnownOdometer: odometerValue
                };
                this.mockVehicles[vehicleIndex] = updatedVehicle;
                return of({...updatedVehicle}).pipe(delay(300));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
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
        // Para desarrollo, actualizamos los datos mock
        if (!environment.production) {
            const vehicleIndex = this.mockVehicles.findIndex(v => v.id === id);
            if (vehicleIndex !== -1) {
                const updatedVehicle = {
                    ...this.mockVehicles[vehicleIndex],
                    nextMaintenanceDate: date
                };
                this.mockVehicles[vehicleIndex] = updatedVehicle;
                return of({...updatedVehicle}).pipe(delay(300));
            }
            return of(null);
        }

        // En producción, hacemos la llamada real a la API
        return this.http.patch<Vehicle>(`${ this.apiUrl }/${ id }/maintenance`, {
            nextMaintenanceDate: date
        });
    }
}
