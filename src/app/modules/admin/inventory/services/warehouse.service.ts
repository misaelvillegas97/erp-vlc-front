import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { Warehouse }          from '../domain/models/warehouse.model';
import { Pagination }         from '@shared/domain/model/pagination';

@Injectable({providedIn: 'root'})
export class WarehouseService {
    private apiUrl = 'api/warehouses';
    private readonly http = inject(HttpClient);

    getWarehouses(params?: any): Observable<Pagination<Warehouse>> {
        return this.http.get<Pagination<Warehouse>>(this.apiUrl, {params});
    }

    getWarehouse(id: string): Observable<Warehouse> {
        return this.http.get<Warehouse>(`${ this.apiUrl }/${ id }`);
    }

    createWarehouse(warehouse: Warehouse): Observable<Warehouse> {
        return this.http.post<Warehouse>(this.apiUrl, warehouse);
    }

    updateWarehouse(id: string, warehouse: Warehouse): Observable<Warehouse> {
        return this.http.put<Warehouse>(`${ this.apiUrl }/${ id }`, warehouse);
    }

    deleteWarehouse(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.apiUrl }/${ id }`);
    }
}
