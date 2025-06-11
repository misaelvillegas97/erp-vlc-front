import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { InventoryItem }      from '../domain/models/inventory-item.model';
import { InventoryMovement }  from '../domain/models/inventory-movement.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private apiUrl = 'api/inventory';
    private readonly http = inject(HttpClient);

    // Métodos básicos CRUD
    getInventoryItems(query?: any): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(this.apiUrl, {params: query});
    }

    getInventoryItem(id: string): Observable<InventoryItem> {
        return this.http.get<InventoryItem>(`${ this.apiUrl }/item/${ id }`);
    }

    createInventoryItem(item: any): Observable<InventoryItem> {
        return this.http.post<InventoryItem>(this.apiUrl, item);
    }

    updateInventoryItem(id: string, item: any): Observable<InventoryItem> {
        return this.http.patch<InventoryItem>(`${ this.apiUrl }/item/${ id }`, item);
    }

    deleteInventoryItem(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.apiUrl }/item/${ id }`);
    }

    // Métodos para operaciones de stock
    addStock(id: string, data: any): Observable<InventoryMovement> {
        return this.http.post<InventoryMovement>(`${ this.apiUrl }/item/${ id }/add-stock`, data);
    }

    removeStock(id: string, data: any): Observable<InventoryMovement> {
        return this.http.post<InventoryMovement>(`${ this.apiUrl }/item/${ id }/remove-stock`, data);
    }

    adjustStock(id: string, data: any): Observable<InventoryMovement> {
        return this.http.post<InventoryMovement>(`${ this.apiUrl }/item/${ id }/adjust-stock`, data);
    }

    transferStock(data: any): Observable<InventoryMovement[]> {
        return this.http.post<InventoryMovement[]>(`${ this.apiUrl }/transfer`, data);
    }

    // Métodos para consultas especializadas (Fase 4)
    getStockByProduct(productId: string): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${ this.apiUrl }/product/${ productId }`);
    }

    getStockByProductInfo(nameOrUpc: string): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${ this.apiUrl }/product-info/${ nameOrUpc }`);
    }

    getStockByWarehouse(warehouseId: string): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${ this.apiUrl }/warehouse/${ warehouseId }`);
    }

    getLowStockItems(): Observable<InventoryItem[]> {
        return this.http.get<InventoryItem[]>(`${ this.apiUrl }/low-stock`);
    }

    getExpiringItems(days?: number): Observable<InventoryItem[]> {
        let params = {};
        if (days) {
            params = {days};
        }
        return this.http.get<InventoryItem[]>(`${ this.apiUrl }/expiring`, {params});
    }

    // Métodos para gestión de reservas (Fase 5)
    reserveStock(id: string, data: any): Observable<InventoryMovement> {
        return this.http.post<InventoryMovement>(`${ this.apiUrl }/${ id }/reserve`, data);
    }

    releaseReservedStock(id: string, data: any): Observable<InventoryMovement> {
        return this.http.post<InventoryMovement>(`${ this.apiUrl }/${ id }/release`, data);
    }
}
