import { inject, Injectable }                                          from '@angular/core';
import { HttpClient }                                                  from '@angular/common/http';
import { Observable, of }                                              from 'rxjs';
import { FuelConsumptionByPeriod, FuelConsumptionSummary, FuelRecord } from '@modules/admin/logistics/fuel-management/domain/model/fuel-record.model';

@Injectable({
    providedIn: 'root'
})
export class FuelRecordsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `api/v1/logistics/fuel`;

    // CRUD operations
    getFuelRecords(params?: any): Observable<{ items: FuelRecord[], total: number }> {
        return this.http.get<{ items: FuelRecord[], total: number }>(this.baseUrl, {params});

        // TODO: Replace with actual API call when backend is ready
        // For now, return mock data
        // return of({
        //     items: this.getMockFuelRecords(),
        //     total: this.getMockFuelRecords().length
        // });
    }

    getFuelRecord(id: string): Observable<FuelRecord> {
        return this.http.get<FuelRecord>(`${ this.baseUrl }/${ id }`);

        // TODO: Replace with actual API call when backend is ready
        // return of(this.getMockFuelRecords().find(record => record.id === id));
    }

    createFuelRecord(record: Omit<FuelRecord, 'id' | 'createdAt'>): Observable<FuelRecord> {
        return this.http.post<FuelRecord>(this.baseUrl, record);

        // TODO: Replace with actual API call when backend is ready
        // const newRecord: FuelRecord = {
        //     ...record,
        //     id       : this.generateMockId(),
        //     createdAt: new Date().toISOString()
        // };
        // return of(newRecord);
    }

    updateFuelRecord(id: string, record: Partial<FuelRecord>): Observable<FuelRecord> {
        return this.http.patch<FuelRecord>(`${ this.baseUrl }/${ id }`, record);

        // TODO: Replace with actual API call when backend is ready
        // const existingRecord = this.getMockFuelRecords().find(r => r.id === id);
        // const updatedRecord: FuelRecord = {
        //     ...existingRecord,
        //     ...record,
        //     updatedAt: new Date().toISOString()
        // };
        // return of(updatedRecord);
    }

    deleteFuelRecord(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.baseUrl }/${ id }`);

        // TODO: Replace with actual API call when backend is ready
        // return of(undefined);
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

        // If no records found, return 0 or fetch from vehicle service
        return of(0);
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
