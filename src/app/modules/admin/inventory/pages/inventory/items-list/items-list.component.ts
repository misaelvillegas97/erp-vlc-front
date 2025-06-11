import { Component, inject, resource, Signal, signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { CommonModule }                                                                        from '@angular/common';
import { FormControl, ReactiveFormsModule }                                                    from '@angular/forms';
import { MatButtonModule }                                                                     from '@angular/material/button';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { MatIconModule }                                                                       from '@angular/material/icon';
import { MatInputModule }                                                                      from '@angular/material/input';
import { MatTooltipModule }                                                                    from '@angular/material/tooltip';
import { RouterLink }                                                                          from '@angular/router';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { TableBuilderComponent }                                                               from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                                                        from '@shared/components/table-builder/column.type';
import { InventoryService }                                                                    from '@modules/admin/inventory/services/inventory.service';
import { InventoryItem }                                                                       from '@modules/admin/inventory/domain/models/inventory-item.model';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { MatMenuModule }                                                                       from '@angular/material/menu';
import { MatDatepickerModule }                                                                 from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                 from '@angular/material/core';
import { MatSelectModule }                                                                     from '@angular/material/select';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import { FuseConfirmationService }                                                             from '@fuse/services/confirmation';
import { WarehouseService }                                                                    from '@modules/admin/inventory/services/warehouse.service';
import { Warehouse }                                                                           from '@modules/admin/inventory/domain/models/warehouse.model';

@Component({
    selector   : 'app-inventory-items',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTooltipModule,
        RouterLink,
        PageHeaderComponent,
        TableBuilderComponent,
        MatMenuModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule
    ],
    templateUrl: './items-list.component.html'
})
export class InventoryItemsComponent {
    readonly #inventoryService = inject(InventoryService);
    readonly #warehouseService = inject(WarehouseService);
    readonly #notyf = inject(NotyfService);
    readonly #confirmationService = inject(FuseConfirmationService);

    // Filters
    searchControl = new FormControl<string>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    warehouseControl = new FormControl<string>('');
    warehouseSignal = toSignal(this.warehouseControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    showAdvancedFilters = signal(false);

    // Table
    readonly actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell');
    columnsConfig: WritableSignal<ColumnConfig<InventoryItem>[]> = signal(undefined);

    // Data
    warehousesResource = resource({
        loader: async () => {
            try {
                const response = await firstValueFrom(this.#warehouseService.getWarehouses());
                return response.items;
            } catch (error) {
                this.#notyf.error('Error al cargar los almacenes');
                return [];
            }
        }
    });

    inventoryItemsResource = resource({
        request: () => ({
            search     : this.searchControlSignal(),
            warehouseId: this.warehouseSignal()
        }),
        loader : async ({request}) => {
            try {
                // Apply filters
                let params: any = {};

                if (request.search?.trim()) {
                    params.search = request.search.trim();
                }

                if (request.warehouseId?.trim()) {
                    params.warehouseId = request.warehouseId.trim();
                }

                return await firstValueFrom(this.#inventoryService.getInventoryItems(params));
            } catch (error) {
                this.#notyf.error('Error al cargar los elementos de inventario');
                return [];
            }
        }
    });

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    toggleAdvancedFilters(): void {
        this.showAdvancedFilters.update(value => !value);
    }

    clearFilters(): void {
        this.searchControl.setValue('');
        this.warehouseControl.setValue('');
    }

    deleteInventoryItem(item: InventoryItem): void {
        const dialog = this.#confirmationService.open({
            title  : 'Eliminar elemento de inventario',
            message: `¿Está seguro que desea eliminar el elemento "${ item.name }"?`,
            actions: {
                confirm: {label: 'Eliminar'},
                cancel : {label: 'Cancelar'}
            }
        });

        dialog.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.#inventoryService.deleteInventoryItem(item.id).subscribe({
                    next : () => {
                        this.#notyf.success('Elemento eliminado correctamente');
                        this.inventoryItemsResource.reload();
                    },
                    error: () => {
                        this.#notyf.error('Error al eliminar el elemento');
                    }
                });
            }
        });
    }

    buildColumnsConfig(): ColumnConfig<InventoryItem>[] {
        return [
            {
                key    : 'name',
                header : 'Nombre',
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
                    label: (value: Warehouse) => value ? value.name : 'N/A'
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
                key    : 'location',
                header : 'Ubicación',
                visible: true,
                display: {
                    type: 'text'
                }
            },
            {
                key    : 'isReserved',
                header : 'Reservado',
                visible: true,
                display: {
                    type : 'badge',
                    label: (value: boolean) => value ? 'Sí' : 'No',
                    color: (value: boolean) => value ? 'amber' : 'green'
                }
            },
            {
                key    : 'actions',
                header : 'Acciones',
                visible: true,
                display: {
                    type          : 'custom',
                    customTemplate: this.actionsCell()
                }
            }
        ];
    }
}
