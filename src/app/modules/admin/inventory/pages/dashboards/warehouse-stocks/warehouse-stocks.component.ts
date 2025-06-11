import { Component, computed, inject, resource, signal } from '@angular/core';
import { CommonModule }                                  from '@angular/common';
import { FormControl, ReactiveFormsModule }              from '@angular/forms';
import { MatButtonModule }                               from '@angular/material/button';
import { MatFormFieldModule }                            from '@angular/material/form-field';
import { MatIconModule }                                 from '@angular/material/icon';
import { MatInputModule }                                from '@angular/material/input';
import { MatSelectModule }                               from '@angular/material/select';
import { MatTooltipModule }                              from '@angular/material/tooltip';
import { MatCardModule }                                 from '@angular/material/card';
import { MatProgressSpinnerModule }                      from '@angular/material/progress-spinner';
import { PageHeaderComponent }                           from '@layout/components/page-header/page-header.component';
import { TableBuilderComponent }                         from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                  from '@shared/components/table-builder/column.type';
import { InventoryService }                              from '@modules/admin/inventory/services/inventory.service';
import { WarehouseService }                              from '@modules/admin/inventory/services/warehouse.service';
import { InventoryItem }                                 from '@modules/admin/inventory/domain/models/inventory-item.model';
import { Warehouse }                                     from '@modules/admin/inventory/domain/models/warehouse.model';
import { toSignal }                                      from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                  from 'rxjs';
import { NotyfService }                                  from '@shared/services/notyf.service';

@Component({
    selector   : 'app-warehouse-stocks',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        MatCardModule,
        MatProgressSpinnerModule,
        PageHeaderComponent,
        TableBuilderComponent
    ],
    templateUrl: './warehouse-stocks.component.html'
})
export class WarehouseStocksComponent {
    private readonly inventoryService = inject(InventoryService);
    private readonly warehouseService = inject(WarehouseService);
    private readonly notyf = inject(NotyfService);

    // Filters
    warehouseControl = new FormControl<string>('');
    warehouseSignal = toSignal(this.warehouseControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    // Table
    columnsConfig = signal<ColumnConfig<InventoryItem>[]>([
        {
            key    : 'warehouse',
            header : 'Almacén',
            visible: true,
            display: {
                type : 'text',
                label: (value: any) => value?.name || 'N/A'
            }
        },
        {
            key    : 'name',
            header : 'Producto',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'upcCode',
            header : 'Código UPC',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'location',
            header : 'Ubicación',
            visible: true,
            display: {
                type : 'text',
                label: (value: string) => value || 'No especificada'
            }
        },
        {
            key    : 'quantity',
            header : 'Cantidad',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'stockStatus',
            header : 'Estado',
            visible: true,
            display: {
                type : 'badge',
                color: (value: string) => {
                    switch (value) {
                        case 'low':
                            return 'amber';
                        case 'normal':
                            return 'green';
                        case 'high':
                            return 'blue';
                        case 'out':
                            return 'red';
                        default:
                            return 'gray';
                    }
                },
                label: (_, item: InventoryItem) => this.getStockStatus(item)
            }
        }
    ]);

    // Data
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

    inventoryResource = resource({
        request: () => ({
            warehouseId: this.warehouseSignal()
        }),
        loader : async ({request}) => {
            try {
                let params: any = {};

                if (request.warehouseId) {
                    params.warehouseId = request.warehouseId;
                }

                const items = await firstValueFrom(this.inventoryService.getInventoryItems(params));

                // Process items to add stockStatus
                return items.map(item => ({
                    ...item,
                    stockStatus: this.getStockStatus(item)
                }));
            } catch (error) {
                this.notyf.error('Error al cargar el inventario');
                return [];
            }
        }
    });

    // Computed signals for summary stats
    totalItems = computed(() => this.inventoryResource.value()?.length || 0);

    totalWarehouses = computed(() => {
        if (!this.inventoryResource.value()) return 0;

        // Get unique warehouse IDs
        const warehouseIds = new Set(
            this.inventoryResource.value()
                .filter(item => item.warehouseId)
                .map(item => item.warehouseId)
        );

        return warehouseIds.size;
    });

    totalQuantity = computed(() => {
        if (!this.inventoryResource.value()) return 0;

        return this.inventoryResource.value().reduce((sum, item) => sum + item.quantity, 0);
    });

    lowStockItems = computed(() =>
        this.inventoryResource.value()?.filter(item =>
            item.minimumStock && item.quantity > 0 && item.quantity < item.minimumStock
        ).length || 0
    );

    clearFilters(): void {
        this.warehouseControl.setValue('');
    }

    getStockStatus(item: InventoryItem): string {
        if (item.quantity <= 0) {
            return 'out';
        }

        if (item.minimumStock && item.quantity < item.minimumStock) {
            return 'low';
        }

        if (item.maximumStock && item.quantity > item.maximumStock) {
            return 'high';
        }

        return 'normal';
    }
}
