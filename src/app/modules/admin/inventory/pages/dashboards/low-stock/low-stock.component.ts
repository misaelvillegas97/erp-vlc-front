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
import { toSignal }                                      from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                  from 'rxjs';
import { NotyfService }                                  from '@shared/services/notyf.service';

@Component({
    selector   : 'app-low-stock',
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
        TableBuilderComponent,
    ],
    templateUrl: './low-stock.component.html'
})
export class LowStockComponent {
    private readonly inventoryService = inject(InventoryService);
    private readonly warehouseService = inject(WarehouseService);
    private readonly notyf = inject(NotyfService);

    // Filters
    warehouseControl = new FormControl<string>('');
    warehouseSignal = toSignal(this.warehouseControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    searchControl = new FormControl<string>('');
    searchSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    // Table
    columnsConfig = signal<ColumnConfig<InventoryItem>[]>([
        {
            key    : 'name',
            header : 'Producto',
            visible: true,
            display: {
                type: 'text'
            }
        },
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
            key    : 'quantity',
            header : 'Cantidad Actual',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'minimumStock',
            header : 'Stock Mínimo',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'stockPercentage',
            header : 'Porcentaje',
            visible: true,
            display: {
                type : 'text',
                label: (_, item: any) => {
                    if (!item.minimumStock) return 'N/A';
                    const percentage = (item.quantity / item.minimumStock) * 100;
                    return `${ percentage.toFixed(0) }%`;
                }
            }
        },
        {
            key    : 'actions',
            header : 'Acciones',
            visible: true,
            display: {
                type          : 'custom',
                customTemplate: null,
                label         : () => ''
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

    lowStockResource = resource({
        params: () => ({
            warehouseId: this.warehouseSignal(),
            search     : this.searchSignal()
        }),
        loader: async ({params}) => {
            try {
                // Get all inventory items
                let query: any = {};

                if (params.warehouseId) {
                    query.warehouseId = params.warehouseId;
                }

                if (params.search?.trim()) {
                    query.search = params.search.trim();
                }

                // Use the getLowStockItems method if available, otherwise filter manually
                let items: InventoryItem[];

                try {
                    // Try to use the specialized endpoint
                    items = await firstValueFrom(this.inventoryService.getLowStockItems());
                } catch (error) {
                    // Fallback to manual filtering
                    items = await firstValueFrom(this.inventoryService.getInventoryItems(query));
                    items = items.filter(item =>
                        item.minimumStock && item.quantity < item.minimumStock
                    );
                }

                // Apply additional filtering if needed
                if (params.search?.trim() || params.warehouseId) {
                    items = items.filter(item => {
                        let match = true;

                        if (params.warehouseId && item.warehouseId !== params.warehouseId) {
                            match = false;
                        }

                        if (params.search?.trim() && !item.name.toLowerCase().includes(params.search.trim().toLowerCase())) {
                            match = false;
                        }

                        return match;
                    });
                }

                // Sort by percentage of minimum stock (ascending)
                items.sort((a, b) => {
                    if (!a.minimumStock) return 1;
                    if (!b.minimumStock) return -1;

                    const percentA = a.quantity / a.minimumStock;
                    const percentB = b.quantity / b.minimumStock;

                    return percentA - percentB;
                });

                return items;
            } catch (error) {
                this.notyf.error('Error al cargar los productos con bajo stock');
                return [];
            }
        }
    });

    // Computed signals for summary stats
    totalLowStockItems = computed(() => this.lowStockResource.value()?.length || 0);

    criticalItems = computed(() =>
        this.lowStockResource.value()?.filter(item =>
            item.minimumStock && item.quantity <= (item.minimumStock * 0.25)
        ).length || 0
    );

    warningItems = computed(() =>
        this.lowStockResource.value()?.filter(item =>
            item.minimumStock &&
            item.quantity > (item.minimumStock * 0.25) &&
            item.quantity < item.minimumStock
        ).length || 0
    );

    outOfStockItems = computed(() =>
        this.lowStockResource.value()?.filter(item => item.quantity <= 0).length || 0
    );

    clearFilters(): void {
        this.warehouseControl.setValue('');
        this.searchControl.setValue('');
    }
}
