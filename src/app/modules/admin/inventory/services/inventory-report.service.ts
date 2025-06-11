import { Injectable, inject }        from '@angular/core';
import { HttpClient }                from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { InventoryService }          from './inventory.service';
import { InventoryItem }             from '../domain/models/inventory-item.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryReportService {
    private readonly http = inject(HttpClient);
    private readonly inventoryService = inject(InventoryService);

    getDashboardData(): Observable<any> {
        return forkJoin({
            lowStock: this.inventoryService.getLowStockItems(),
            expiring: this.inventoryService.getExpiringItems(30)
        }).pipe(
            map(results => {
                // Procesar datos para el dashboard
                return {
                    lowStockCount: results.lowStock.length,
                    expiringCount: results.expiring.length,
                    // Calcular estadísticas adicionales
                    totalItems        : results.lowStock.length + results.expiring.length,
                    lowStockPercentage: this.calculatePercentage(results.lowStock.length, results.lowStock.length + results.expiring.length),
                    expiringPercentage: this.calculatePercentage(results.expiring.length, results.lowStock.length + results.expiring.length),
                    // Datos para gráficos
                    lowStockItems: results.lowStock,
                    expiringItems: results.expiring
                };
            })
        );
    }

    getInventoryMovementReport(startDate?: Date, endDate?: Date): Observable<any> {
        // En una implementación real, esto llamaría a un endpoint específico para obtener
        // los movimientos de inventario en un rango de fechas
        // Por ahora, simulamos con datos estáticos
        return this.http.get<any>('api/inventory-movements', {
            params: {
                startDate: startDate ? startDate.toISOString() : '',
                endDate  : endDate ? endDate.toISOString() : ''
            }
        });
    }

    getInventoryValueReport(): Observable<any> {
        // En una implementación real, esto llamaría a un endpoint específico para obtener
        // el valor del inventario
        // Por ahora, simulamos con datos estáticos
        return this.http.get<any>('api/inventory-value');
    }

    getInventoryTurnoverReport(): Observable<any> {
        // En una implementación real, esto llamaría a un endpoint específico para obtener
        // la rotación del inventario
        // Por ahora, simulamos con datos estáticos
        return this.http.get<any>('api/inventory-turnover');
    }

    // Métodos auxiliares
    private calculatePercentage(value: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }
}
