import { Component, inject, resource, Signal, signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { CommonModule }                                                                        from '@angular/common';
import { FormControl, ReactiveFormsModule }                                                    from '@angular/forms';
import { MatButtonModule }                                                                     from '@angular/material/button';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { MatIconModule }                                                                       from '@angular/material/icon';
import { MatInputModule }                                                                      from '@angular/material/input';
import { MatTooltipModule }                                                                    from '@angular/material/tooltip';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { TableBuilderComponent }                                                               from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                                                        from '@shared/components/table-builder/column.type';
import { InventoryService }                                                                    from '@modules/admin/inventory/services/inventory.service';
import { WarehouseService }                                                                    from '@modules/admin/inventory/services/warehouse.service';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { MatMenuModule }                                                                       from '@angular/material/menu';
import { MatDatepickerModule }                                                                 from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                 from '@angular/material/core';
import { MatSelectModule }                                                                     from '@angular/material/select';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import { InventoryMovement, MovementType }                                                     from '@modules/admin/inventory/domain/models/inventory-movement.model';
import { Color }                                                                               from '@shared/components/badge/domain/model/badge.type';
import { MatProgressSpinner }                                                                  from '@angular/material/progress-spinner';

@Component({
    selector   : 'app-inventory-movements',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTooltipModule,
        PageHeaderComponent,
        TableBuilderComponent,
        MatMenuModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatProgressSpinner
    ],
    templateUrl: './inventory-movements.component.html'
})
export class InventoryMovementsComponent {
    readonly #inventoryService = inject(InventoryService);
    readonly #warehouseService = inject(WarehouseService);
    readonly #notyf = inject(NotyfService);

    // Movement types for filter
    movementTypes = Object.values(MovementType);

    // Filters
    searchControl = new FormControl<string>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    dateFromControl = new FormControl<Date>(null);
    dateFromSignal = toSignal(this.dateFromControl.valueChanges.pipe(debounceTime(300)), {initialValue: null});

    dateToControl = new FormControl<Date>(null);
    dateToSignal = toSignal(this.dateToControl.valueChanges.pipe(debounceTime(300)), {initialValue: null});

    warehouseControl = new FormControl<string>('');
    warehouseSignal = toSignal(this.warehouseControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    movementTypeControl = new FormControl<string>('');
    movementTypeSignal = toSignal(this.movementTypeControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    showAdvancedFilters = signal(false);

    // Table
    readonly detailsCell: Signal<TemplateRef<any>> = viewChild('detailsCell');
    columnsConfig: WritableSignal<ColumnConfig<InventoryMovement>[]> = signal(undefined);

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

    movementsResource = resource({
        request: () => ({
            search     : this.searchControlSignal(),
            startDate  : this.dateFromSignal(),
            endDate    : this.dateToSignal(),
            warehouseId: this.warehouseSignal(),
            type       : this.movementTypeSignal()
        }),
        loader : async ({request}) => {
            try {
                // In a real application, we would call an API endpoint to get the movements
                // For now, we'll return a mock response
                return this.getMockMovements();
            } catch (error) {
                this.#notyf.error('Error al cargar los movimientos de inventario');
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
        this.dateFromControl.setValue(null);
        this.dateToControl.setValue(null);
        this.warehouseControl.setValue('');
        this.movementTypeControl.setValue('');
    }

    buildColumnsConfig(): ColumnConfig<InventoryMovement>[] {
        return [
            {
                key    : 'createdAt',
                header : 'Fecha',
                visible: true,
                display: {
                    type       : 'date',
                    pipeOptions: {format: 'dd/MM/yyyy HH:mm'}
                }
            },
            {
                key    : 'type',
                header : 'Tipo',
                visible: true,
                display: {
                    type : 'badge',
                    label: (value: MovementType) => this.getMovementTypeLabel(value),
                    color: (value: MovementType) => this.getMovementTypeColor(value)
                }
            },
            {
                key    : 'inventoryItemId',
                header : 'Elemento',
                visible: true,
                display: {
                    type : 'text',
                    label: (value: string) => 'Elemento ' + value.substring(0, 8) // In a real app, we would fetch the item name
                }
            },
            {
                key    : 'quantity',
                header : 'Cantidad',
                visible: true,
                display: {
                    type : 'text',
                    label: (value: number) => value.toString()
                }
            },
            {
                key    : 'reference',
                header : 'Referencia',
                visible: true,
                display: {
                    type: 'text'
                }
            },
            {
                key    : 'createdById',
                header : 'Usuario',
                visible: true,
                display: {
                    type : 'text',
                    label: (value: string) => 'Usuario ' + value.substring(0, 8) // In a real app, we would fetch the user name
                }
            },
            {
                key    : 'details',
                header : 'Detalles',
                visible: true,
                display: {
                    type          : 'custom',
                    customTemplate: this.detailsCell()
                }
            }
        ];
    }

    getMovementTypeLabel(type: MovementType): string {
        const labels = {
            [MovementType.RECEIPT]    : 'Entrada',
            [MovementType.SHIPMENT]   : 'Salida',
            [MovementType.ADJUSTMENT] : 'Ajuste',
            [MovementType.TRANSFER]   : 'Transferencia',
            [MovementType.RETURN]     : 'Devolución',
            [MovementType.RESERVATION]: 'Reserva',
            [MovementType.RELEASE]    : 'Liberación'
        };
        return labels[type] || type;
    }

    getMovementTypeColor(type: MovementType): Color {
        const colors: Record<MovementType, Color> = {
            [MovementType.RECEIPT]    : 'green',
            [MovementType.SHIPMENT]   : 'red',
            [MovementType.ADJUSTMENT] : 'blue',
            [MovementType.TRANSFER]   : 'purple',
            [MovementType.RETURN]     : 'amber',
            [MovementType.RESERVATION]: 'orange',
            [MovementType.RELEASE]    : 'teal'
        };
        return colors[type] || 'gray';
    }

    // Mock data for demonstration purposes
    private getMockMovements(): InventoryMovement[] {
        const movements: InventoryMovement[] = [];
        const types = Object.values(MovementType);

        for (let i = 0; i < 20; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            movements.push({
                id             : 'mov-' + i,
                inventoryItemId: 'item-' + Math.floor(Math.random() * 10),
                type           : types[Math.floor(Math.random() * types.length)],
                quantity       : Math.floor(Math.random() * 100) - 50,
                reference      : 'REF-' + Math.floor(Math.random() * 1000),
                metadata       : {note: 'Movimiento de prueba'},
                createdById    : 'user-' + Math.floor(Math.random() * 5),
                createdAt      : date
            });
        }

        return movements;
    }
}
