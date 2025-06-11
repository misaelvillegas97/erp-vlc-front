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
import { InventoryItem }                                 from '@modules/admin/inventory/domain/models/inventory-item.model';
import { toSignal }                                      from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                  from 'rxjs';
import { NotyfService }                                  from '@shared/services/notyf.service';

@Component({
    selector   : 'app-products-stocks',
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
    templateUrl: './products-stocks.component.html'
})
export class ProductsStocksComponent {
    private readonly inventoryService = inject(InventoryService);
    private readonly notyf = inject(NotyfService);

    // Filters
    searchControl = new FormControl<string>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

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
            key    : 'upcCode',
            header : 'Código UPC',
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
            header : 'Cantidad',
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
                type : 'text',
                label: (value: number) => value.toString() || 'No definido'
            }
        },
        {
            key    : 'maximumStock',
            header : 'Stock Máximo',
            visible: true,
            display: {
                type : 'text',
                label: (value: number) => value.toString() || 'No definido'
            }
        },
        {
            key    : 'stockStatus',
            header : 'Estado',
            visible: true,
            display: {
                type : 'badge',
                color: (_, item: InventoryItem) => {
                    const status = this.getStockStatus(item);

                    switch (status) {
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
    productsResource = resource({
        request: () => ({
            search: this.searchControlSignal()
        }),
        loader : async ({request}) => {
            try {
                let params: any = {};

                if (request.search?.trim()) {
                    params.search = request.search.trim();
                }

                const items = await firstValueFrom(this.inventoryService.getInventoryItems(params));

                // Process items to add stockStatus
                return items.map(item => ({
                    ...item,
                    stockStatus: this.getStockStatus(item)
                }));
            } catch (error) {
                this.notyf.error('Error al cargar los productos');
                return [];
            }
        }
    });

    // Computed signals for summary stats
    totalProducts = computed(() => this.productsResource.value()?.length || 0);

    outOfStockProducts = computed(() =>
        this.productsResource.value()?.filter(item => item.quantity <= 0).length || 0
    );

    lowStockProducts = computed(() =>
        this.productsResource.value()?.filter(item =>
            item.minimumStock && item.quantity > 0 && item.quantity < item.minimumStock
        ).length || 0
    );

    excessStockProducts = computed(() =>
        this.productsResource.value()?.filter(item =>
            item.maximumStock && item.quantity > item.maximumStock
        ).length || 0
    );

    clearFilters(): void {
        this.searchControl.setValue('');
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
