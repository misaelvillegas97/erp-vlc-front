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
import { WarehouseService }                                                                    from '@modules/admin/inventory/services/warehouse.service';
import { Warehouse }                                                                           from '@modules/admin/inventory/domain/models/warehouse.model';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { MatMenuModule }                                                                       from '@angular/material/menu';
import { MatDatepickerModule }                                                                 from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                 from '@angular/material/core';
import { MatSelectModule }                                                                     from '@angular/material/select';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import { FuseConfirmationService }                                                             from '@fuse/services/confirmation';

@Component({
    selector   : 'app-warehouse-list',
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
    templateUrl: './list.component.html'
})
export class WarehouseListComponent {
    readonly #warehouseService = inject(WarehouseService);
    readonly #notyf = inject(NotyfService);
    readonly #confirmationService = inject(FuseConfirmationService);

    // Filters
    searchControl = new FormControl<string>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    showAdvancedFilters = signal(false);

    // Table
    readonly actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell');
    columnsConfig: WritableSignal<ColumnConfig<Warehouse>[]> = signal(undefined);

    // Data
    warehousesResource = resource({
        request: () => ({
            search: this.searchControlSignal()
        }),
        loader : async ({request}) => {
            try {
                // Apply filters
                let params: any = {};

                if (request.search?.trim()) {
                    params.search = request.search.trim();
                }

                return await firstValueFrom(this.#warehouseService.getWarehouses(params));
            } catch (error) {
                this.#notyf.error('Error al cargar los almacenes');
                return {items: [], total: 0};
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
    }

    deleteWarehouse(warehouse: Warehouse): void {
        const dialog = this.#confirmationService.open({
            title  : 'Eliminar almacén',
            message: `¿Está seguro que desea eliminar el almacén "${ warehouse.name }"?`,
            actions: {
                confirm: {label: 'Eliminar'},
                cancel : {label: 'Cancelar'}
            }
        });

        dialog.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.#warehouseService.deleteWarehouse(warehouse.id).subscribe({
                    next : () => {
                        this.#notyf.success('Almacén eliminado correctamente');
                        this.warehousesResource.reload();
                    },
                    error: () => {
                        this.#notyf.error('Error al eliminar el almacén');
                    }
                });
            }
        });
    }

    buildColumnsConfig(): ColumnConfig<Warehouse>[] {
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
                key    : 'description',
                header : 'Descripción',
                visible: true,
                display: {
                    type: 'text'
                }
            },
            {
                key    : 'address',
                header : 'Dirección',
                visible: true,
                display: {
                    type: 'text'
                }
            },
            {
                key    : 'contactPerson',
                header : 'Contacto',
                visible: true,
                display: {
                    type: 'text'
                }
            },
            {
                key    : 'isActive',
                header : 'Estado',
                visible: true,
                display: {
                    type : 'badge',
                    label: (value: boolean) => value ? 'Activo' : 'Inactivo',
                    color: (value: boolean) => value ? 'green' : 'warn'
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
