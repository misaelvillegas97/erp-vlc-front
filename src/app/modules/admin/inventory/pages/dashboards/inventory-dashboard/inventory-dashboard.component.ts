import { Component, computed, inject, resource } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { MatButtonModule }                       from '@angular/material/button';
import { MatCardModule }                         from '@angular/material/card';
import { MatIconModule }                         from '@angular/material/icon';
import { MatProgressSpinnerModule }              from '@angular/material/progress-spinner';
import { RouterLink }                            from '@angular/router';
import { PageHeaderComponent }                   from '@layout/components/page-header/page-header.component';
import { InventoryService }                      from '@modules/admin/inventory/services/inventory.service';
import { WarehouseService }                      from '@modules/admin/inventory/services/warehouse.service';
import { NotyfService }                          from '@shared/services/notyf.service';
import { firstValueFrom }                        from 'rxjs';

@Component({
    selector   : 'app-inventory-dashboard',
    standalone : true,
    imports    : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
        PageHeaderComponent
    ],
    templateUrl: './inventory-dashboard.component.html'
})
export class InventoryDashboardComponent {
    private readonly inventoryService = inject(InventoryService);
    private readonly warehouseService = inject(WarehouseService);
    private readonly notyf = inject(NotyfService);

    // Data resources
    inventoryResource = resource({
        loader: async () => {
            try {
                return await firstValueFrom(this.inventoryService.getInventoryItems());
            } catch (error) {
                this.notyf.error('Error al cargar los datos de inventario');
                return [];
            }
        }
    });

    warehousesResource = resource({
        loader: async () => {
            try {
                const response = await firstValueFrom(this.warehouseService.getWarehouses());
                return response.items;
            } catch (error) {
                this.notyf.error('Error al cargar los almacenes');
                return [];
            }
        }
    });

    // Computed metrics
    totalItems = computed(() => this.inventoryResource.value()?.length || 0);

    totalWarehouses = computed(() => this.warehousesResource.value()?.length || 0);

    totalQuantity = computed(() =>
        this.inventoryResource.value()?.reduce((sum, item) => sum + item.quantity, 0) || 0
    );

    lowStockItems = computed(() =>
        this.inventoryResource.value()?.filter(item =>
            item.minimumStock && item.quantity < item.minimumStock
        ).length || 0
    );

    outOfStockItems = computed(() =>
        this.inventoryResource.value()?.filter(item => item.quantity <= 0).length || 0
    );

    expiringItems = computed(() => {
        if (!this.inventoryResource.value()) return 0;

        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return this.inventoryResource.value().filter(item => {
            if (!item.expirationDate) return false;

            const expirationDate = new Date(item.expirationDate);
            return expirationDate <= thirtyDaysFromNow;
        }).length;
    });

    warehouseWithMostItems = computed(() => {
        if (!this.inventoryResource.value() || !this.warehousesResource.value()) return null;

        const warehouseCounts = new Map<string, { id: string, name: string, count: number }>();

        // Initialize counts for all warehouses
        this.warehousesResource.value().forEach(warehouse => {
            warehouseCounts.set(warehouse.id, {
                id   : warehouse.id,
                name : warehouse.name,
                count: 0
            });
        });

        // Count items per warehouse
        this.inventoryResource.value().forEach(item => {
            if (item.warehouseId && warehouseCounts.has(item.warehouseId)) {
                const current = warehouseCounts.get(item.warehouseId);
                current.count++;
                warehouseCounts.set(item.warehouseId, current);
            }
        });

        // Find warehouse with most items
        let maxWarehouse = {id: '', name: 'Ninguno', count: 0};
        warehouseCounts.forEach(warehouse => {
            if (warehouse.count > maxWarehouse.count) {
                maxWarehouse = warehouse;
            }
        });

        return maxWarehouse;
    });

    // Dashboard sections
    dashboardSections = [
        {
            title      : 'Inventario',
            icon       : 'inventory_2',
            color      : 'bg-blue-500',
            route: '/inventory/dashboard/inventory-items',
            description: 'Gestión de elementos de inventario'
        },
        {
            title      : 'Almacenes',
            icon       : 'home',
            color      : 'bg-green-500',
            route: '/inventory/dashboard/warehouse/list',
            description: 'Gestión de almacenes'
        },
        {
            title      : 'Stock por Producto',
            icon       : 'category',
            color      : 'bg-purple-500',
            route: '/inventory/dashboard/product-stock',
            description: 'Consulta el inventario por producto'
        },
        {
            title      : 'Stock por Almacén',
            icon       : 'store',
            color      : 'bg-indigo-500',
            route: '/inventory/dashboard/warehouse-stock',
            description: 'Consulta el inventario por almacén'
        },
        {
            title      : 'Bajo Stock',
            icon       : 'trending_down',
            color      : 'bg-amber-500',
            route: '/inventory/dashboard/low-stock',
            description: 'Productos con nivel de stock bajo'
        },
        {
            title      : 'Productos por Expirar',
            icon       : 'schedule',
            color      : 'bg-orange-500',
            route: '/inventory/dashboard/expiring-items',
            description: 'Productos próximos a expirar'
        },
        {
            title      : 'Alertas',
            icon       : 'notifications',
            color      : 'bg-red-500',
            route: '/inventory/dashboard/inventory-alerts',
            description: 'Alertas de inventario'
        },
        {
            title      : 'Movimientos',
            icon       : 'swap_horiz',
            color      : 'bg-teal-500',
            route: '/inventory/dashboard/inventory-movement-report',
            description: 'Reporte de movimientos de inventario'
        }
    ];

    reloadData(): void {
        this.inventoryResource.reload();
        this.warehousesResource.reload();
    }
}
