import { Component, computed, inject, linkedSignal, OnDestroy, OnInit, resource, Signal, signal, TemplateRef, viewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { CommonModule }                                                                                                                                     from '@angular/common';
import { Router }                                                                                                                                           from '@angular/router';
import { HttpClient }                                                                                                                                       from '@angular/common/http';
import { PageHeaderComponent }                                                                                                                              from '@layout/components/page-header/page-header.component';
import { MatButtonModule, MatIconButton }                                                                                                                   from '@angular/material/button';
import { MatIconModule }                                                                                                                                    from '@angular/material/icon';
import { MatFormFieldModule }                                                                                                                               from '@angular/material/form-field';
import { MatInputModule }                                                                                                                                   from '@angular/material/input';
import { MatSelectModule }                                                                                                                                  from '@angular/material/select';
import { MatDatepickerModule }                                                                                                                              from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                                                                              from '@angular/material/core';
import { FormControl, FormsModule, ReactiveFormsModule }                                                                                                    from '@angular/forms';
import { TableBuilderComponent }                                                                                                                            from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                                                                                                                     from '@shared/components/table-builder/column.type';
import { MatChipsModule }                                                                                                                                   from '@angular/material/chips';
import { MatTooltipModule }                                                                                                                                 from '@angular/material/tooltip';
import { MatMenuModule }                                                                                                                                    from '@angular/material/menu';
import { MatCardModule }                                                                                                                                    from '@angular/material/card';
import { MatSlideToggle }                                                                                                                                   from '@angular/material/slide-toggle';
import { debounceTime, firstValueFrom }                                                                                                                     from 'rxjs';
import { toSignal }                                                                                                                                         from '@angular/core/rxjs-interop';
import { Overlay, OverlayRef }                                                                                                                              from '@angular/cdk/overlay';
import { openOverlay }                                                                                                                                      from '@shared/utils/overlay.util';
import { VehicleDocumentType }                                                                                                                              from '@modules/admin/maintainers/vehicles/domain/model/vehicle';
import { DateTime }                                                                                                                                         from 'luxon';

interface Vehicle {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    nextMaintenanceDate?: string;
    insuranceExpiry?: string;
    technicalInspectionExpiry?: string;
    documents?: VehicleDocument[];
}

interface VehicleDocument {
    id: string;
    key: string;
    type: VehicleDocumentType;
    file: string;
    expirationDate?: string;
    createdAt: string;
}

interface DocumentExpiry {
    vehicleId: string;
    documentType: VehicleDocumentType;
    expiryDate: string;
    daysRemaining: number;
    status: 'expired' | 'warning' | 'ok';
}

@Component({
    selector   : 'app-vehicle-documents',
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
        MatCardModule,
        MatSlideToggle
    ],
    templateUrl: './vehicle-documents.component.html'
})
export class VehicleDocumentsComponent implements OnInit, OnDestroy {
    readonly #http = inject(HttpClient);
    readonly #overlay = inject(Overlay);
    readonly #vcr = inject(ViewContainerRef);
    readonly router = inject(Router);
    #overlayRef: OverlayRef;

    // Signals para los datos
    vehicles = signal<Vehicle[]>([]);
    loading = signal(true);
    documentExpiryMap = signal<Map<string, DocumentExpiry[]>>(new Map());

    // Form controls para filtros
    searchFormControl = new FormControl<string>(undefined);
    brandFormControl = new FormControl<string>(undefined);
    modelFormControl = new FormControl<string>(undefined);
    expiryDateFormControl = new FormControl<DateTime>(undefined);

    // Signals para filtros
    searchFilter = toSignal(this.searchFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: undefined});
    brandFilter = toSignal(this.brandFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: undefined});
    modelFilter = toSignal(this.modelFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: undefined});
    expiryDateFilter = toSignal(this.expiryDateFormControl.valueChanges.pipe(debounceTime(1000)), {initialValue: undefined});

    // Additional signals
    columnsOverlay: Signal<TemplateRef<any>> = viewChild('columnsOverlay');
    columnsOverlayButton: Signal<MatIconButton> = viewChild('columnsOverlayButton');
    showColumnsOverlay = signal(false);

    // Pagination
    pagination = signal({page: 1, limit: 10, totalElements: 0, totalPages: 0, disabled: true});

    filters = computed(() => {
        const filter = {};

        if (this.searchFilter()?.toString().length > 0) filter['search'] = this.searchFilter();
        if (this.brandFilter()?.toString().length > 0) filter['brand'] = this.brandFilter();
        if (this.modelFilter()?.toString().length > 0) filter['model'] = this.modelFilter();
        if (this.expiryDateFilter()) filter['expiryDate'] = this.expiryDateFilter();

        return filter;
    });

    // Columnas para la tabla
    columnsConfig: WritableSignal<ColumnConfig<Vehicle>[]> = linkedSignal(() => {
        const persistedColumns: string[] = localStorage.getItem('vehicleDocumentsColumnsConfig') && JSON.parse(localStorage.getItem('vehicleDocumentsColumnsConfig'));

        const columns: ColumnConfig<Vehicle>[] = [
            {
                key    : 'licensePlate',
                header : 'Placa',
                display: {
                    type   : 'text',
                    classes: 'text-sm font-medium'
                },
                filter : {
                    control: this.searchFormControl,
                    type   : 'text'
                },
                visible: true
            },
            {
                key    : 'brand',
                header : 'Marca',
                display: {
                    type   : 'text',
                    classes: 'text-sm'
                },
                filter : {
                    control: this.brandFormControl,
                    type   : 'text'
                },
                visible: true
            },
            {
                key    : 'model',
                header : 'Modelo',
                display: {
                    type   : 'text',
                    classes: 'text-sm'
                },
                filter : {
                    control: this.modelFormControl,
                    type   : 'text'
                },
                visible: true
            },
            {
                key    : 'nextMaintenanceDate',
                header : 'Próximo Mantenimiento',
                display: {
                    type       : 'date',
                    pipeOptions: {format: 'dd-MM-yyyy'},
                    classes    : (element: Vehicle) => {
                        const daysRemaining = this.calculateDaysRemaining(element.nextMaintenanceDate);
                        const status = this.getExpiryStatus(daysRemaining);
                        return status === 'expired' ? 'text-sm text-red-500' :
                            status === 'warning' ? 'text-sm text-amber-500' :
                                'text-sm text-green-500';
                    }
                },
                filter : {
                    control: this.expiryDateFormControl,
                    type   : 'date'
                },
                visible: true
            },
            {
                key    : 'insuranceExpiry',
                header : 'Vencimiento Seguro',
                display: {
                    type       : 'date',
                    pipeOptions: {format: 'dd-MM-yyyy'},
                    classes    : (element: Vehicle) => {
                        const daysRemaining = this.calculateDaysRemaining(element.insuranceExpiry);
                        const status = this.getExpiryStatus(daysRemaining);
                        return status === 'expired' ? 'text-sm text-red-500' :
                            status === 'warning' ? 'text-sm text-amber-500' :
                                'text-sm text-green-500';
                    }
                },
                filter : {
                    control: this.expiryDateFormControl,
                    type   : 'date'
                },
                visible: true
            },
            {
                key    : 'technicalInspectionExpiry',
                header : 'Vencimiento Rev. Técnica',
                display: {
                    type       : 'date',
                    pipeOptions: {format: 'dd-MM-yyyy'},
                    classes    : (element: Vehicle) => {
                        const daysRemaining = this.calculateDaysRemaining(element.technicalInspectionExpiry);
                        const status = this.getExpiryStatus(daysRemaining);
                        return status === 'expired' ? 'text-sm text-red-500' :
                            status === 'warning' ? 'text-sm text-amber-500' :
                                'text-sm text-green-500';
                    }
                },
                filter : {
                    control: this.expiryDateFormControl,
                    type   : 'date'
                },
                visible: true
            },
            {
                key    : 'documents',
                header : 'Documentos',
                display: {
                    type : 'badge',
                    label: (element: Vehicle) => {
                        const expiryDocs = this.documentExpiryMap().get(element.id) || [];
                        const expiredCount = expiryDocs.filter(doc => doc.status === 'expired').length;
                        const warningCount = expiryDocs.filter(doc => doc.status === 'warning').length;

                        if (expiredCount > 0) {
                            return `${ expiredCount }`;
                        } else if (warningCount > 0) {
                            return `${ warningCount }`;
                        } else {
                            return `${ expiryDocs.length }`;
                        }
                    },
                    color: (element: Vehicle) => {
                        const expiryDocs = this.documentExpiryMap().get(element.id) || [];
                        const expiredCount = expiryDocs.filter(doc => doc.status === 'expired').length;
                        const warningCount = expiryDocs.filter(doc => doc.status === 'warning').length;

                        if (expiredCount > 0) {
                            return 'red';
                        } else if (warningCount > 0) {
                            return 'yellow';
                        } else {
                            return 'green';
                        }
                    }

                },
                visible: true
            },
            {
                key    : 'actions',
                header : 'Acciones',
                display: {
                    type   : 'actions',
                    actions: [
                        {icon: 'visibility', tooltip: 'Ver documentos', action: 'view'}
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
    vehiclesResource = resource({
        loader: async () => {
            this.loading.set(true);
            try {
                const vehicles = await firstValueFrom(this.#http.get<Vehicle[]>('api/v1/vehicles'));
                this.vehicles.set(vehicles);
                this.processDocumentExpiry(vehicles);
                this.loading.set(false);
                return vehicles;
            } catch (error) {
                this.loading.set(false);
                return [];
            }
        }
    });

    ngOnInit(): void {
        // Resource will handle data loading
    }

    ngOnDestroy(): void {
        if (this.#overlayRef) this.#overlayRef.detach();
    }

    /**
     * Procesa las fechas de vencimiento de los documentos
     */
    processDocumentExpiry(vehicles: Vehicle[]): void {
        const expiryMap = new Map<string, DocumentExpiry[]>();

        vehicles.forEach(vehicle => {
            const expiryDocs: DocumentExpiry[] = [];

            // Procesar documentos adjuntos
            if (vehicle.documents && vehicle.documents.length > 0) {
                vehicle.documents.forEach(doc => {
                    if (doc.expirationDate) {
                        const daysRemaining = this.calculateDaysRemaining(doc.expirationDate);
                        expiryDocs.push({
                            vehicleId   : vehicle.id,
                            documentType: doc.type,
                            expiryDate  : doc.expirationDate,
                            daysRemaining,
                            status      : this.getExpiryStatus(daysRemaining)
                        });
                    }
                });
            }

            // Procesar fechas de vencimiento del vehículo
            if (vehicle.insuranceExpiry) {
                const daysRemaining = this.calculateDaysRemaining(vehicle.insuranceExpiry);
                expiryDocs.push({
                    vehicleId   : vehicle.id,
                    documentType: VehicleDocumentType.INSURANCE,
                    expiryDate  : vehicle.insuranceExpiry,
                    daysRemaining,
                    status      : this.getExpiryStatus(daysRemaining)
                });
            }

            if (vehicle.technicalInspectionExpiry) {
                const daysRemaining = this.calculateDaysRemaining(vehicle.technicalInspectionExpiry);
                expiryDocs.push({
                    vehicleId   : vehicle.id,
                    documentType: VehicleDocumentType.TECHNICAL_REVISION,
                    expiryDate  : vehicle.technicalInspectionExpiry,
                    daysRemaining,
                    status      : this.getExpiryStatus(daysRemaining)
                });
            }

            expiryMap.set(vehicle.id, expiryDocs);
        });

        this.documentExpiryMap.set(expiryMap);
    }

    /**
     * Calcula los días restantes hasta la fecha de vencimiento
     */
    calculateDaysRemaining(expiryDate: string): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Determina el estado de vencimiento basado en los días restantes
     */
    getExpiryStatus(daysRemaining: number): 'expired' | 'warning' | 'ok' {
        if (daysRemaining < 0) {
            return 'expired';
        } else if (daysRemaining <= 30) {
            return 'warning';
        } else {
            return 'ok';
        }
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
        this.brandFormControl.setValue(undefined);
        this.modelFormControl.setValue(undefined);
        this.expiryDateFormControl.setValue(undefined);
    };

    openColumnsOverlay = (event: MouseEvent) => {
        this.#overlayRef = openOverlay(
            this.#overlay,
            this.#vcr,
            this.columnsOverlayButton()._elementRef.nativeElement,
            this.columnsOverlay()
        );
    };

    persistColumnsConfiguration = (): void => localStorage.setItem('vehicleDocumentsColumnsConfig', JSON.stringify(this.columns()));

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
    handleTableAction(event: { action: string; row: Vehicle }): void {
        if (event.action === 'view') {
            this.viewVehicleDocuments(event.row);
        }
    }

    /**
     * Muestra un diálogo con los documentos del vehículo
     */
    viewVehicleDocuments(vehicle: Vehicle): void {
        // Aquí se implementaría la lógica para mostrar un diálogo con los documentos
        // Por simplicidad, solo mostramos un mensaje en la consola
        console.log('Ver documentos del vehículo', vehicle);
    }

    /**
     * Obtiene los documentos vencidos
     */
    getExpiredDocuments(expiryEntries: any[]): DocumentExpiry[] {
        const allDocs: DocumentExpiry[] = [];
        expiryEntries.forEach(entry => {
            const docs = entry.value.filter(doc => doc.status === 'expired');
            allDocs.push(...docs);
        });
        return allDocs;
    }

    /**
     * Obtiene los documentos por vencer
     */
    getWarningDocuments(expiryEntries: any[]): DocumentExpiry[] {
        const allDocs: DocumentExpiry[] = [];
        expiryEntries.forEach(entry => {
            const docs = entry.value.filter(doc => doc.status === 'warning');
            allDocs.push(...docs);
        });
        return allDocs;
    }

    /**
     * Obtiene un vehículo por su ID
     */
    getVehicleById(vehicleId: string): Vehicle | undefined {
        return this.vehicles().find(v => v.id === vehicleId);
    }

    /**
     * Obtiene el nombre del tipo de documento
     */
    getDocumentTypeName(documentType: VehicleDocumentType): string {
        switch (documentType) {
            case VehicleDocumentType.INSURANCE:
                return 'Seguro';
            case VehicleDocumentType.TECHNICAL_REVISION:
                return 'Revisión Técnica';
            default:
                return 'Documento';
        }
    }

    /**
     * Obtiene los vehículos con mantenimientos próximos
     */
    getUpcomingMaintenances(): Vehicle[] {
        return this.vehicles().filter(vehicle => {
            if (!vehicle.nextMaintenanceDate) return false;
            const daysRemaining = this.calculateDaysRemaining(vehicle.nextMaintenanceDate);
            return daysRemaining >= -30 && daysRemaining <= 30; // Incluye mantenimientos recientes y próximos
        });
    }
}
