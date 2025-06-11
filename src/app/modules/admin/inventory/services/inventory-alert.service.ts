import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { InventoryAlert }     from '../domain/models/inventory-alert.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryAlertService {
    private apiUrl = 'api/inventory-alerts'; // Asumiendo que existe este endpoint
    private readonly http = inject(HttpClient);

    getAlerts(query?: any): Observable<InventoryAlert[]> {
        return this.http.get<InventoryAlert[]>(this.apiUrl, {params: query});
    }

    acknowledgeAlert(id: string): Observable<InventoryAlert> {
        return this.http.post<InventoryAlert>(`${ this.apiUrl }/${ id }/acknowledge`, {});
    }

    resolveAlert(id: string): Observable<InventoryAlert> {
        return this.http.post<InventoryAlert>(`${ this.apiUrl }/${ id }/resolve`, {});
    }

    dismissAlert(id: string): Observable<InventoryAlert> {
        return this.http.post<InventoryAlert>(`${ this.apiUrl }/${ id }/dismiss`, {});
    }
}
