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
import { FuelRecordsService }                                                                  from '@modules/admin/logistics/fuel-management/services/fuel-records.service';
import { FuelRecord }                                                                          from '@modules/admin/logistics/fuel-management/domain/model/fuel-record.model';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { MatMenuModule }                                                                       from '@angular/material/menu';
import { MatDatepickerModule }                                                                 from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                 from '@angular/material/core';
import { MatSelectModule }                                                                     from '@angular/material/select';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import BigNumber                                                                               from 'bignumber.js';
import { FuseConfirmationService }                                                             from '@fuse/services/confirmation';
import { VehiclesService }                                                                     from '@modules/admin/logistics/fleet-management/services/vehicles.service';
import { VehicleSelectorComponent }                                                            from '@shared/controls/components/vehicle-selector/vehicle-selector.component';

@Component({
    selector   : 'app-list',
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
        MatSelectModule,
        VehicleSelectorComponent
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #fuelRecordsService = inject(FuelRecordsService);
    readonly #vehiclesService = inject(VehiclesService);
    readonly #notyf = inject(NotyfService);
    readonly #confirmationService = inject(FuseConfirmationService);

    // Filters
    searchControl = new FormControl<string>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    dateFromControl = new FormControl<Date>(null);
    dateFromSignal = toSignal(this.dateFromControl.valueChanges.pipe(debounceTime(300)), {initialValue: null});

    dateToControl = new FormControl<Date>(null);
    dateToSignal = toSignal(this.dateToControl.valueChanges.pipe(debounceTime(300)), {initialValue: null});

    vehicleControl = new FormControl<string>('');
    vehicleSignal = toSignal(this.vehicleControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    showAdvancedFilters = signal(false);

    // Table
    readonly actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell');
    columnsConfig: WritableSignal<ColumnConfig<FuelRecord>[]> = signal(undefined);

    vehiclesResource = resource({
        params: () => ({}),
        loader : async () => {
            try {
                const vehicles = await firstValueFrom(this.#vehiclesService.findAll({sortBy: 'licensePlate', sortOrder: 'ASC'}));
                return vehicles.items;
            } catch (error) {
                this.#notyf.error('Error al cargar los vehículos');
                return [];
            }
        }
    });

    // Data
    fuelRecordsResource = resource({
        params: () => ({
            search  : this.searchControlSignal(),
            startDate: this.dateFromSignal(),
            endDate  : this.dateToSignal(),
            vehicle : this.vehicleSignal()
        }),
        loader: async ({params}) => {
            try {
                // Apply filters
                let params: any = {};

                if (params.search?.trim()) {
                    params.search = params.search.trim();
                }

                if (params.startDate) {
                    params.startDate = params.startDate.toISOString();
                }

                if (params.endDate) {
                    params.endDate = params.endDate.toISOString();
                }

                if (params.vehicle?.trim()) {
                    params.vehicleId = params.vehicle.trim();
                }

                return await firstValueFrom(this.#fuelRecordsService.getFuelRecords(params));
            } catch (error) {
                this.#notyf.error('Error al cargar los registros de combustible');
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
        this.dateFromControl.setValue(null);
        this.dateToControl.setValue(null);
        this.vehicleControl.setValue('');
    }

    calculateEfficiency(record: FuelRecord): string {
        return record.efficiency ? `${ record.efficiency.toFixed(2) } km/l` : 'N/A';
    }

    calculateDistance(record: FuelRecord): string {
        return new BigNumber(record.finalOdometer).minus(record.initialOdometer).toFixed(1);
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(value);
    }

    deleteFuelRecord(record: FuelRecord): void {
        const dialog = this.#confirmationService.open({
            title  : 'Eliminar registro',
            message: '¿Está seguro que desea eliminar este registro de combustible?',
            actions: {
                confirm: {label: 'Eliminar'},
                cancel : {label: 'Cancelar'}
            }
        });

        dialog.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.#fuelRecordsService.deleteFuelRecord(record.id).subscribe({
                    next : () => {
                        this.#notyf.success('Registro eliminado correctamente');
                        this.fuelRecordsResource.reload();
                    },
                    error: () => {
                        this.#notyf.error('Error al eliminar el registro');
                    }
                });
            }
        });
    }

    buildColumnsConfig(): ColumnConfig<FuelRecord>[] {
        return [
            {
                key    : 'date',
                header : 'Fecha',
                visible: true,
                display: {
                    type       : 'date',
                    pipeOptions: {format: 'dd-MM-yyyy'}
                }
            },
            {
                key    : 'vehicle',
                header : 'Vehículo',
                visible: true,
                display: {
                    type     : 'text',
                    label: (value: FuelRecord['vehicle']) => value ? value.displayName : 'N/A'
                }
            },
            {
                key    : 'odometer',
                header : 'Kilometraje',
                visible: true,
                display: {
                    type     : 'text',
                    label: (_, record: FuelRecord) =>
                        `${ record.initialOdometer } → ${ record.finalOdometer } km`
                }
            },
            {
                key    : 'distance',
                header : 'Distancia',
                visible: true,
                display: {
                    type     : 'text',
                    label: (_, record: FuelRecord) =>
                        `${ this.calculateDistance(record) } km`
                }
            },
            {
                key    : 'liters',
                header : 'Litros',
                visible: true,
                display: {
                    type     : 'text',
                    label: (value: number) => `${ value } L`
                }
            },
            {
                key    : 'cost',
                header : 'Costo',
                visible: true,
                display: {
                    type     : 'text',
                    label: (value: number) => this.formatCurrency(value)
                }
            },
            {
                key    : 'efficiency',
                header : 'Rendimiento',
                visible: true,
                display: {
                    type     : 'text',
                    label: (_, record: FuelRecord) => this.calculateEfficiency(record)
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
