import { inject, Injectable }                                          from '@angular/core';
import { HttpClient }                                                  from '@angular/common/http';
import { Observable, of }                                              from 'rxjs';
import { FuelConsumptionByPeriod, FuelConsumptionSummary, FuelRecord } from '@modules/admin/logistics/fuel-management/domain/model/fuel-record.model';

@Injectable({
    providedIn: 'root'
})
export class FuelRecordsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `api/v1/logistics/fuel-records`;

    // CRUD operations
    getFuelRecords(params?: any): Observable<{ items: FuelRecord[], total: number }> {
        // TODO: Replace with actual API call when backend is ready
        // For now, return mock data
        return of({
            items: this.getMockFuelRecords(),
            total: this.getMockFuelRecords().length
        });
    }

    getFuelRecord(id: string): Observable<FuelRecord> {
        // TODO: Replace with actual API call when backend is ready
        return of(this.getMockFuelRecords().find(record => record.id === id));
    }

    createFuelRecord(record: Omit<FuelRecord, 'id' | 'createdAt'>): Observable<FuelRecord> {
        // TODO: Replace with actual API call when backend is ready
        const newRecord: FuelRecord = {
            ...record,
            id       : this.generateMockId(),
            createdAt: new Date().toISOString()
        };
        return of(newRecord);
    }

    updateFuelRecord(id: string, record: Partial<FuelRecord>): Observable<FuelRecord> {
        // TODO: Replace with actual API call when backend is ready
        const existingRecord = this.getMockFuelRecords().find(r => r.id === id);
        const updatedRecord: FuelRecord = {
            ...existingRecord,
            ...record,
            updatedAt: new Date().toISOString()
        };
        return of(updatedRecord);
    }

    deleteFuelRecord(id: string): Observable<void> {
        // TODO: Replace with actual API call when backend is ready
        return of(undefined);
    }

    // Analysis operations
    getFuelConsumptionSummary(params?: any): Observable<FuelConsumptionSummary[]> {
        // TODO: Replace with actual API call when backend is ready
        return of(this.getMockConsumptionSummary());
    }

    getFuelConsumptionByPeriod(params?: any): Observable<FuelConsumptionByPeriod[]> {
        // TODO: Replace with actual API call when backend is ready
        return of(this.getMockConsumptionByPeriod());
    }

    getVehicleLastOdometer(vehicleId: string): Observable<number> {
        // TODO: Replace with actual API call when backend is ready
        const records = this.getMockFuelRecords()
            .filter(record => record.vehicleId === vehicleId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (records.length > 0) {
            return of(records[0].finalOdometer);
        }

        // If no records found, return 0 or fetch from vehicle service
        return of(0);
    }

    // Mock data generators
    private getMockFuelRecords(): FuelRecord[] {
        return [
            {
                id             : '1',
                vehicleId      : 'v1',
                vehicleInfo    : {
                    brand       : 'Toyota',
                    model       : 'Corolla',
                    licensePlate: 'ABC-123'
                },
                date           : '2023-05-01T10:00:00Z',
                initialOdometer: 10000,
                finalOdometer  : 10500,
                liters         : 40,
                cost           : 35000,
                efficiency     : 12.5,
                costPerKm      : 70,
                notes          : 'Carga regular',
                createdAt      : '2023-05-01T10:30:00Z'
            },
            {
                id             : '2',
                vehicleId      : 'v1',
                vehicleInfo    : {
                    brand       : 'Toyota',
                    model       : 'Corolla',
                    licensePlate: 'ABC-123'
                },
                date           : '2023-05-15T14:00:00Z',
                initialOdometer: 10500,
                finalOdometer  : 11000,
                liters         : 38,
                cost           : 33000,
                efficiency     : 13.16,
                costPerKm      : 66,
                notes          : 'Carga después de viaje largo',
                createdAt      : '2023-05-15T14:30:00Z'
            },
            {
                id             : '3',
                vehicleId      : 'v2',
                vehicleInfo    : {
                    brand       : 'Honda',
                    model       : 'Civic',
                    licensePlate: 'XYZ-789'
                },
                date           : '2023-05-10T09:00:00Z',
                initialOdometer: 5000,
                finalOdometer  : 5400,
                liters         : 30,
                cost           : 26000,
                efficiency     : 13.33,
                costPerKm      : 65,
                notes          : 'Carga regular',
                createdAt      : '2023-05-10T09:30:00Z'
            }
        ];
    }

    private getMockConsumptionSummary(): FuelConsumptionSummary[] {
        return [
            {
                vehicleId        : 'v1',
                vehicleInfo      : {
                    brand       : 'Toyota',
                    model       : 'Corolla',
                    licensePlate: 'ABC-123'
                },
                totalRecords     : 2,
                totalLiters      : 78,
                totalCost        : 68000,
                totalDistance    : 1000,
                averageEfficiency: 12.82,
                averageCostPerKm : 68
            },
            {
                vehicleId        : 'v2',
                vehicleInfo      : {
                    brand       : 'Honda',
                    model       : 'Civic',
                    licensePlate: 'XYZ-789'
                },
                totalRecords     : 1,
                totalLiters      : 30,
                totalCost        : 26000,
                totalDistance    : 400,
                averageEfficiency: 13.33,
                averageCostPerKm : 65
            }
        ];
    }

    private getMockConsumptionByPeriod(): FuelConsumptionByPeriod[] {
        return [
            {
                period           : '2023-05-01',
                totalLiters      : 40,
                totalCost        : 35000,
                totalDistance    : 500,
                averageEfficiency: 12.5
            },
            {
                period           : '2023-05-10',
                totalLiters      : 30,
                totalCost        : 26000,
                totalDistance    : 400,
                averageEfficiency: 13.33
            },
            {
                period           : '2023-05-15',
                totalLiters      : 38,
                totalCost        : 33000,
                totalDistance    : 500,
                averageEfficiency: 13.16
            }
        ];
    }

    private generateMockId(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}
