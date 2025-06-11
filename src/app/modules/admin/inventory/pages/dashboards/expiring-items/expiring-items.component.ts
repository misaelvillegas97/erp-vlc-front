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
import { RouterLink }                                    from '@angular/router';

@Component({
    selector   : 'app-expiring-items',
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
    templateUrl: './expiring-items.component.html'
})
export class ExpiringItemsComponent {
    private readonly inventoryService = inject(InventoryService);
    private readonly warehouseService = inject(WarehouseService);
    private readonly notyf = inject(NotyfService);

    // Filters
    warehouseControl = new FormControl<string>('');
    warehouseSignal = toSignal(this.warehouseControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    searchControl = new FormControl<string>('');
    searchSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    daysControl = new FormControl<number>(30);
    daysSignal = toSignal(this.daysControl.valueChanges.pipe(debounceTime(300)), {initialValue: 30});

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
            header : 'Cantidad',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'batchNumber',
            header : 'Lote',
            visible: true,
            display: {
                type : 'text',
                label: (value: string) => value || 'N/A'
            }
        },
        {
            key    : 'expirationDate',
            header : 'Fecha de Expiración',
            visible: true,
            display: {
                type       : 'date',
                pipeOptions: {format: 'dd/MM/yyyy'}
            }
        },
        {
            key    : 'daysUntilExpiration',
            header : 'Días Restantes',
            visible: true,
            display: {
                type : 'text',
                label: (_, item: any) => {
                    if (!item.expirationDate) return 'N/A';

                    const today = new Date();
                    const expirationDate = new Date(item.expirationDate);
                    const diffTime = expirationDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        return `Expirado (${ Math.abs(diffDays) } días)`;
                    }

                    return `${ diffDays } días`;
                }
            }
        },
        {
            key    : 'expirationStatus',
            header : 'Estado',
            visible: true,
            display: {
                type : 'badge',
                color: (_, item: InventoryItem) => {
                    const status = this.getExpirationStatus(item);
                    switch (status) {
                        case 'expired':
                            return 'red';
                        case 'critical':
                            return 'red';
                        case 'warning':
                            return 'amber';
                        default:
                            return 'green';
                    }
                },
                label: (_, item: any) => this.getExpirationStatus(item)
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

    expiringItemsResource = resource({
        request: () => ({
            warehouseId: this.warehouseSignal(),
            search     : this.searchSignal(),
            days       : this.daysSignal()
        }),
        loader : async ({request}) => {
            try {
                // Use the getExpiringItems method if available, otherwise filter manually
                let items: InventoryItem[];

                try {
                    // Try to use the specialized endpoint
                    items = await firstValueFrom(this.inventoryService.getExpiringItems(request.days));
                } catch (error) {
                    // Fallback to manual filtering
                    let params: any = {};

                    if (request.warehouseId) {
                        params.warehouseId = request.warehouseId;
                    }

                    if (request.search?.trim()) {
                        params.search = request.search.trim();
                    }

                    items = await firstValueFrom(this.inventoryService.getInventoryItems(params));

                    // Filter items with expiration date within the specified days
                    const today = new Date();
                    const futureDate = new Date();
                    futureDate.setDate(today.getDate() + request.days);

                    items = items.filter(item => {
                        if (!item.expirationDate) return false;

                        const expirationDate = new Date(item.expirationDate);
                        return expirationDate <= futureDate;
                    });
                }

                // Apply additional filtering if needed
                if (request.search?.trim() || request.warehouseId) {
                    items = items.filter(item => {
                        let match = true;

                        if (request.warehouseId && item.warehouseId !== request.warehouseId) {
                            match = false;
                        }

                        if (request.search?.trim() && !item.name.toLowerCase().includes(request.search.trim().toLowerCase())) {
                            match = false;
                        }

                        return match;
                    });
                }

                // Sort by expiration date (ascending)
                items.sort((a, b) => {
                    if (!a.expirationDate) return 1;
                    if (!b.expirationDate) return -1;

                    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
                });

                // Add expiration status
                items = items.map(item => ({
                    ...item,
                    expirationStatus: this.getExpirationStatus(item)
                }));

                return items;
            } catch (error) {
                this.notyf.error('Error al cargar los productos próximos a expirar');
                return [];
            }
        }
    });

    // Computed signals for summary stats
    totalExpiringItems = computed(() => this.expiringItemsResource.value()?.length || 0);

    expiredItems = computed(() =>
        this.expiringItemsResource.value()?.filter(item =>
            this.getExpirationStatus(item) === 'expired'
        ).length || 0
    );

    criticalItems = computed(() =>
        this.expiringItemsResource.value()?.filter(item =>
            this.getExpirationStatus(item) === 'critical'
        ).length || 0
    );

    warningItems = computed(() =>
        this.expiringItemsResource.value()?.filter(item =>
            this.getExpirationStatus(item) === 'warning'
        ).length || 0
    );

    clearFilters(): void {
        this.warehouseControl.setValue('');
        this.searchControl.setValue('');
        this.daysControl.setValue(30);
    }

    getExpirationStatus(item: InventoryItem): string {
        if (!item.expirationDate) return 'ok';

        const today = new Date();
        const expirationDate = new Date(item.expirationDate);
        const diffTime = expirationDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return 'expired';
        }

        if (diffDays <= 7) {
            return 'critical';
        }

        if (diffDays <= 30) {
            return 'warning';
        }

        return 'ok';
    }
}
