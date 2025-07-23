import { Component, computed, inject, linkedSignal, OnDestroy, OnInit, resource, Signal, signal, TemplateRef, viewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { CommonModule }                                                                                                                                     from '@angular/common';
import { Router }                                                                                                                                           from '@angular/router';
import { MaintenanceRecordService }                                                                                                                         from '../../services/maintenance-record.service';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType }                                                                                            from '../../domain/model/maintenance-record.model';
import { PageHeaderComponent }                                                                                                                              from '@layout/components/page-header/page-header.component';
import { MatButtonModule, MatIconButton }                                                                                                                   from '@angular/material/button';
import { MatIconModule }                                                                                                                                    from '@angular/material/icon';
import { MatFormFieldModule }                                                                                                                               from '@angular/material/form-field';
import { MatInputModule }                                                                                                                                   from '@angular/material/input';
import { MatSelectModule }                                                                                                                                  from '@angular/material/select';
import { MatDatepickerModule }                                                                                                                              from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                                                                              from '@angular/material/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule }                                                                                         from '@angular/forms';
import { TableBuilderComponent }                                                                                                                            from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                                                                                                                     from '@shared/components/table-builder/column.type';
import { MatChipsModule }                                                                                                                                   from '@angular/material/chips';
import { MatTooltipModule }                                                                                                                                 from '@angular/material/tooltip';
import { MatMenuModule }                                                                                                                                    from '@angular/material/menu';
import { debounceTime, firstValueFrom }                                                                                                                     from 'rxjs';
import { toSignal }                                                                                                                                         from '@angular/core/rxjs-interop';
import { Overlay, OverlayRef }                                                                                                                              from '@angular/cdk/overlay';
import { MatSlideToggle }                                                                                                                                   from '@angular/material/slide-toggle';
import { openOverlay }                                                                                                                                      from '@shared/utils/overlay.util';
import { DateTime }                                                                                                                                         from 'luxon';

@Component({
    selector   : 'app-maintenance-records',
    standalone : true,
    imports    : [
        CommonModule,
        PageHeaderComponent,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule,
        FormsModule,
        TableBuilderComponent,
        MatChipsModule,
        MatTooltipModule,
        MatMenuModule,
        MatSlideToggle
    ],
    templateUrl: './maintenance-records.component.html'
})
export class MaintenanceRecordsComponent implements OnInit, OnDestroy {
    readonly #maintenanceService = inject(MaintenanceRecordService);
    readonly #overlay = inject(Overlay);
    readonly #vcr = inject(ViewContainerRef);
    readonly router = inject(Router);
    #overlayRef: OverlayRef;

    // Signals para los datos
    loading = signal(true);

    // Enums para los selects
    maintenanceTypes = Object.values(MaintenanceType);
    maintenanceStatuses = Object.values(MaintenanceStatus);

    // Form controls para filtros
    searchFormControl = new FormControl<string>(undefined);
    typeFormControl = new FormControl<MaintenanceType[]>(undefined);
    statusFormControl = new FormControl<MaintenanceStatus[]>(undefined);
    dateFormControl = new FormGroup({
        from: new FormControl<DateTime>(undefined),
        to  : new FormControl<DateTime>(undefined),
    });
    odometerFormControl = new FormGroup({
        from: new FormControl<number>(undefined),
        to  : new FormControl<number>(undefined),
    });
    costFormControl = new FormGroup({
        from: new FormControl<number>(undefined),
        to  : new FormControl<number>(undefined),
    });

    // Signals para filtros
    searchFilter = toSignal(this.searchFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: undefined});
    typeFilter = toSignal(this.typeFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: []});
    statusFilter = toSignal(this.statusFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: []});
    dateFilter = toSignal(this.dateFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: {from: undefined, to: undefined}});
    odometerFilter = toSignal(this.odometerFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: {from: undefined, to: undefined}});
    costFilter = toSignal(this.costFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: {from: undefined, to: undefined}});

    // Additional signals
    columnsOverlay: Signal<TemplateRef<any>> = viewChild('columnsOverlay');
    columnsOverlayButton: Signal<MatIconButton> = viewChild('columnsOverlayButton');
    showColumnsOverlay = signal(false);

    // Pagination
    pagination = signal({page: 1, limit: 10, totalElements: 0, totalPages: 0, disabled: true});

    filters = computed(() => {
        const filter = {};

        if (this.searchFilter()?.toString().length > 0) filter['search'] = this.searchFilter();
        if (this.typeFilter()?.length > 0) filter['type'] = this.typeFilter();
        if (this.statusFilter()?.length > 0) filter['status'] = this.statusFilter();
        if (this.dateFilter()?.to || this.dateFilter()?.from) filter['date'] = JSON.stringify({
            from: this.dateFilter()?.from && this.dateFilter()?.from.toISODate(),
            to  : this.dateFilter()?.to && this.dateFilter()?.to.toISODate()
        });
        if (this.odometerFilter()?.from || this.odometerFilter()?.to) filter['odometer'] = JSON.stringify(this.odometerFilter());
        if (this.costFilter()?.from || this.costFilter()?.to) filter['cost'] = JSON.stringify(this.costFilter());

        return filter;
    });

    // Columnas para la tabla
    columnsConfig: WritableSignal<ColumnConfig<MaintenanceRecord>[]> = linkedSignal(() => {
        const persistedColumns: string[] = localStorage.getItem('maintenanceRecordsColumnsConfig') && JSON.parse(localStorage.getItem('maintenanceRecordsColumnsConfig'));

        const columns: ColumnConfig<MaintenanceRecord>[] = [
            {
                key    : 'date',
                header : 'Fecha',
                display: {
                    type       : 'date',
                    pipeOptions: {format: 'dd-MM-yyyy'},
                    classes    : 'text-sm'
                },
                filter : {
                    group: this.dateFormControl,
                    type : 'date-range'
                },
                visible: true
            },
            {
                key    : 'vehicleId',
                header : 'Vehículo',
                display: {
                    type   : 'text',
                    classes: 'text-sm'
                },
                filter : {
                    control       : this.searchFormControl,
                    type          : 'vehicle',
                    controlClasses: 'fuse-mat-dense',
                    hideLabel     : true
                },
                visible: true
            },
            {
                key    : 'type',
                header : 'Tipo',
                display: {
                    type       : 'badge',
                    label      : (element: MaintenanceRecord) => {
                        const typeMap = {
                            [MaintenanceType.PREVENTIVE]: {text: 'Preventivo', class: 'bg-blue-100 text-blue-800'},
                            [MaintenanceType.CORRECTIVE]: {text: 'Correctivo', class: 'bg-amber-100 text-amber-800'},
                            [MaintenanceType.SCHEDULED] : {text: 'Programado', class: 'bg-green-100 text-green-800'},
                            [MaintenanceType.EMERGENCY] : {text: 'Emergencia', class: 'bg-red-100 text-red-800'}
                        };
                        const type = typeMap[element.type] || {text: element.type, class: ''};
                        return type.text;
                    },
                    pipeOptions: {
                        color: (element: MaintenanceRecord) => {
                            const typeMap = {
                                [MaintenanceType.PREVENTIVE]: 'blue',
                                [MaintenanceType.CORRECTIVE]: 'amber',
                                [MaintenanceType.SCHEDULED] : 'green',
                                [MaintenanceType.EMERGENCY] : 'red'
                            };
                            return typeMap[element.type] || 'gray';
                        }
                    }
                },
                filter : {
                    control : this.typeFormControl,
                    type    : 'select',
                    options : Object.values(MaintenanceType).map((type) => ({
                        value    : type,
                        viewValue: type === 'PREVENTIVE' ? 'Preventivo' :
                            type === 'CORRECTIVE' ? 'Correctivo' :
                                type === 'SCHEDULED' ? 'Programado' :
                                    type === 'EMERGENCY' ? 'Emergencia' : type
                    })),
                    multiple: true
                },
                visible: true
            },
            {
                key    : 'status',
                header : 'Estado',
                display: {
                    type       : 'badge',
                    label      : (element: MaintenanceRecord) => {
                        const statusMap = {
                            [MaintenanceStatus.PENDING]    : {text: 'Pendiente', class: 'bg-amber-100 text-amber-800'},
                            [MaintenanceStatus.IN_PROGRESS]: {text: 'En Progreso', class: 'bg-blue-100 text-blue-800'},
                            [MaintenanceStatus.COMPLETED]  : {text: 'Completado', class: 'bg-green-100 text-green-800'},
                            [MaintenanceStatus.CANCELED]   : {text: 'Cancelado', class: 'bg-gray-100 text-gray-800'}
                        };
                        const status = statusMap[element.status] || {text: element.status, class: ''};
                        return status.text;
                    },
                    pipeOptions: {
                        color: (element: MaintenanceRecord) => {
                            const statusMap = {
                                [MaintenanceStatus.PENDING]    : 'amber',
                                [MaintenanceStatus.IN_PROGRESS]: 'blue',
                                [MaintenanceStatus.COMPLETED]  : 'green',
                                [MaintenanceStatus.CANCELED]   : 'gray'
                            };
                            return statusMap[element.status] || 'gray';
                        }
                    }
                },
                filter : {
                    control : this.statusFormControl,
                    type    : 'select',
                    options : Object.values(MaintenanceStatus).map((status) => ({
                        value    : status,
                        viewValue: status === 'PENDING' ? 'Pendiente' :
                            status === 'IN_PROGRESS' ? 'En Progreso' :
                                status === 'COMPLETED' ? 'Completado' :
                                    status === 'CANCELED' ? 'Cancelado' : status
                    })),
                    multiple: true
                },
                visible: true
            },
            {
                key    : 'odometer',
                header : 'Odómetro',
                display: {
                    type   : 'text',
                    label  : (element: MaintenanceRecord) => `${ element.odometer.toLocaleString() } km`,
                    classes: 'text-sm'
                },
                filter : {
                    group: this.odometerFormControl,
                    type : 'number-range'
                },
                visible: true
            },
            {
                key    : 'cost',
                header : 'Costo',
                display: {
                    type       : 'currency',
                    pipeOptions: {currency: 'CLP', symbolDisplay: 'symbol-narrow'},
                    classes    : 'text-sm'
                },
                filter : {
                    group: this.costFormControl,
                    type : 'number-range'
                },
                visible: true
            },
            {
                key    : 'actions',
                header : 'Acciones',
                display: {
                    type   : 'actions',
                    actions: [
                        {icon: 'edit', tooltip: 'Editar', action: 'edit'},
                        {icon: 'delete', tooltip: 'Eliminar', action: 'delete'}
                    ]
                },
                visible: true
            }
        ];

        return persistedColumns ? columns.map((column) => {
            const foundColumn = persistedColumns.find((col) => col === column.key);
            return foundColumn ? column : {...column, visible: false};
        }) : columns;
    });

    columns = computed(() => this.columnsConfig().filter(col => col.visible).map((column) => column.key));

    // Resource para cargar los datos
    maintenanceResource = resource({
        params: () => ({filters: this.filters(), pagination: this.pagination()}),
        loader: async ({params}) => {
            const paginationRecords = await firstValueFrom(this.#maintenanceService.getMaintenanceRecords(params.filters, {
                page : params.pagination.page,
                limit: params.pagination.limit
            }));

            // this.pagination.set({
            //     page         : paginationRecords.page,
            //     limit        : paginationRecords.limit,
            //     totalElements: paginationRecords.totalElements,
            //     totalPages   : paginationRecords.totalPages,
            //     disabled     : false
            // });

            return paginationRecords.items;
        }
    });

    ngOnInit(): void {
        // Resource will handle data loading
    }

    ngOnDestroy(): void {
        if (this.#overlayRef) this.#overlayRef.detach();
    }

    toggleColumn = (columnKey: string) => {
        const currentConfig = this.columnsConfig();
        const index = currentConfig.findIndex((col) => col.key === columnKey);

        if (index !== -1) {
            const updatedColumn = {
                ...currentConfig[index],
                visible: !currentConfig[index].visible
            };

            const newConfig = [ ...currentConfig ];
            newConfig[index] = updatedColumn;

            this.columnsConfig.set(newConfig);
        }

        this.persistColumnsConfiguration();
    };

    clearFilters = () => {
        this.searchFormControl.setValue(undefined);
        this.typeFormControl.setValue(undefined);
        this.statusFormControl.setValue(undefined);
        this.dateFormControl.setValue({from: undefined, to: undefined});
        this.odometerFormControl.setValue(undefined);
        this.costFormControl.setValue(undefined);
    };

    openColumnsOverlay = (event: MouseEvent) => {
        this.#overlayRef = openOverlay(
            this.#overlay,
            this.#vcr,
            this.columnsOverlayButton()._elementRef.nativeElement,
            this.columnsOverlay()
        );
    };

    persistColumnsConfiguration = (): void => localStorage.setItem('maintenanceRecordsColumnsConfig', JSON.stringify(this.columns()));

    handlePagination = (event) => {
        this.pagination.update((value) => ({
            ...value,
            page    : event.pageIndex + 1,
            limit   : event.pageSize,
            disabled: true
        }));
    };

    /**
     * Maneja las acciones de la tabla
     */
    handleTableAction(event: { action: string; row: MaintenanceRecord }): void {
        if (event.action === 'edit') {
            this.router.navigate([ `/logistics/preventive-maintenance/edit/${ event.row.id }` ]);
        } else if (event.action === 'delete') {
            if (confirm('¿Está seguro de que desea eliminar este registro de mantenimiento?')) {
                this.#maintenanceService.deleteMaintenanceRecord(event.row.id).subscribe({
                    next: () => {
                        this.maintenanceResource.reload();
                    }
                });
            }
        }
    }

    /**
     * Navega a la página de creación de nuevo registro de mantenimiento
     */
    createNewMaintenanceRecord(): void {
        this.router.navigate([ '/logistics/preventive-maintenance/register' ]);
    }
}
