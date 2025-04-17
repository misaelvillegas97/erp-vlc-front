import { Component, inject, resource, Signal, signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators }                                        from '@angular/forms';
import { ColumnConfig }                                                                        from '@shared/components/table-builder/column.type';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                 from '@ngneat/transloco';
import { Notyf }                                                                               from 'notyf';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { MatTooltip }                                                                          from '@angular/material/tooltip';
import { RouterLink }                                                                          from '@angular/router';
import { MatIconAnchor, MatIconButton }                                                        from '@angular/material/button';
import { MatIcon }                                                                             from '@angular/material/icon';
import { TableBuilderComponent }                                                               from '@shared/components/table-builder/table-builder.component';
import { MatInput }                                                                            from '@angular/material/input';
import { firstValueFrom }                                                                      from 'rxjs';
import { VehiclesService }                                                                     from '@modules/admin/maintainers/vehicles/vehicles.service';
import { MatDialog }                                                                           from '@angular/material/dialog';
import { Vehicle, VehicleStatus }                                                              from '../../domain/model/vehicle';
import { CommonModule }                                                                        from '@angular/common';

@Component({
    selector   : 'app-list',
    standalone : true,
    imports    : [
        MatFormFieldModule,
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIconAnchor,
        MatIcon,
        ReactiveFormsModule,
        TableBuilderComponent,
        MatInput,
        TranslocoPipe,
        MatIconButton,
        CommonModule
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #ts = inject(TranslocoService);
    readonly #service = inject(VehiclesService);
    readonly #notyf = new Notyf();
    readonly #dialog = inject(MatDialog);

    searchControl = new FormControl('', [ Validators.minLength(3), Validators.maxLength(100) ]);
    actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell', {read: TemplateRef});
    statusCell: Signal<TemplateRef<any>> = viewChild('statusCell', {read: TemplateRef});
    photoCell: Signal<TemplateRef<any>> = viewChild('photoCell', {read: TemplateRef});

    // Recurso para cargar los vehículos
    vehiclesResource = resource({
        request: () => this.searchControl.value || '',
        loader : ({request}) => firstValueFrom(this.#service.findAll())
    });

    // Configuración de columnas para el table-builder
    columnsConfig: WritableSignal<ColumnConfig<any>[]> = signal(undefined);

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    viewDocuments(vehicle: Vehicle): void {
        // This would open a dialog to display and manage the vehicle documents
        // For now, we'll just show a notification
        this.#notyf.success({message: `Documentos del vehículo ${ vehicle.brand } ${ vehicle.model }`});

        // In a real implementation, you would open a dialog like this:
        // this.#dialog.open(DocumentsDialogComponent, {
        //    width: '600px',
        //    data: { vehicle }
        // });
    }

    getStatusColor(status: VehicleStatus): string {
        switch (status) {
            case VehicleStatus.AVAILABLE:
                return 'bg-green-500';
            case VehicleStatus.IN_USE:
                return 'bg-blue-500';
            case VehicleStatus.IN_MAINTENANCE:
                return 'bg-amber-500';
            case VehicleStatus.OUT_OF_SERVICE:
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    }

    getStatusText(status: VehicleStatus): string {
        switch (status) {
            case VehicleStatus.AVAILABLE:
                return 'Disponible';
            case VehicleStatus.IN_USE:
                return 'En uso';
            case VehicleStatus.IN_MAINTENANCE:
                return 'En mantenimiento';
            case VehicleStatus.OUT_OF_SERVICE:
                return 'Fuera de servicio';
            default:
                return 'Desconocido';
        }
    }

    buildColumnsConfig = (): ColumnConfig<any>[] => [
        {
            key    : 'photo',
            header : '',
            display: {
                type          : 'custom',
                customTemplate: this.photoCell()
            },
            visible: true,
        },
        {
            key    : 'brand',
            header : this.#ts.translate('maintainers.vehicles.fields.brand'),
            display: {type: 'text'},
            visible: true
        },
        {
            key    : 'model',
            header : this.#ts.translate('maintainers.vehicles.fields.model'),
            display: {type: 'text'},
            visible: true
        },
        {
            key    : 'year',
            header : this.#ts.translate('maintainers.vehicles.fields.year'),
            display: {type: 'text'},
            visible: true,
        },
        {
            key    : 'licensePlate',
            header : this.#ts.translate('maintainers.vehicles.fields.license-plate'),
            display: {type: 'text'},
            visible: true,
        },
        {
            key    : 'type',
            header : 'Tipo',
            display: {
                type     : 'custom',
                formatter: (value: string) => {
                    switch (value) {
                        case 'SEDAN':
                            return 'Sedán';
                        case 'SUV':
                            return 'SUV';
                        case 'TRUCK':
                            return 'Camión';
                        case 'VAN':
                            return 'Furgón';
                        case 'PICKUP':
                            return 'Camioneta';
                        case 'MOTORCYCLE':
                            return 'Motocicleta';
                        case 'BUS':
                            return 'Bus';
                        default:
                            return 'Otro';
                    }
                }
            },
            visible: true
        },
        {
            key    : 'lastKnownOdometer',
            header : 'Odómetro',
            display: {
                type     : 'custom',
                formatter: (value: number) => {
                    return value ? `${ value.toLocaleString() } km` : 'N/A';
                }
            },
            visible: true,
        },
        {
            key    : 'status',
            header : 'Estado',
            display: {
                type          : 'custom',
                customTemplate: this.statusCell()
            },
            visible: true,
        },
        {
            key    : 'purchaseDate',
            header : this.#ts.translate('maintainers.vehicles.fields.purchase-date'),
            display: {
                type     : 'custom',
                formatter: (value: string) => {
                    if (!value) return 'N/A';
                    const date = new Date(value);
                    return date.toLocaleDateString('es-CL');
                }
            },
            visible: true,
        },
        {
            key    : 'actions',
            header : '',
            visible: true,
            display: {
                type          : 'custom',
                customTemplate: this.actionsCell()
            }
        }
    ];
}
