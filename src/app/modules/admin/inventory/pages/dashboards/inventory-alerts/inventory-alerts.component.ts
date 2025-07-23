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
import { Warehouse }                                     from '@modules/admin/inventory/domain/models/warehouse.model';
import { toSignal }                                      from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                  from 'rxjs';
import { NotyfService }                                  from '@shared/services/notyf.service';
import { Color }                                         from '@shared/components/badge/domain/model/badge.type';

interface AlertItem {
    id: string;
    type: 'low-stock' | 'expiring' | 'out-of-stock';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    itemId: string;
    itemName: string;
    warehouseId: string;
    warehouseName: string;
    value: number;
    threshold: number;
    date?: Date;
}

@Component({
    selector   : 'app-inventory-alerts',
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
    templateUrl: './inventory-alerts.component.html'
})
export class InventoryAlertsComponent {
    private readonly inventoryService = inject(InventoryService);
    private readonly warehouseService = inject(WarehouseService);
    private readonly notyf = inject(NotyfService);

    // Filters
    warehouseControl = new FormControl<string>('');
    warehouseSignal = toSignal(this.warehouseControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    typeControl = new FormControl<string>('');
    typeSignal = toSignal(this.typeControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    severityControl = new FormControl<string>('');
    severitySignal = toSignal(this.severityControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    // Alert types and severities for filters
    alertTypes = [
        {value: 'low-stock', label: 'Bajo Stock'},
        {value: 'expiring', label: 'Por Expirar'},
        {value: 'out-of-stock', label: 'Sin Stock'}
    ];

    alertSeverities = [
        {value: 'critical', label: 'Crítico'},
        {value: 'warning', label: 'Advertencia'},
        {value: 'info', label: 'Información'}
    ];

    // Table
    columnsConfig = signal<ColumnConfig<AlertItem>[]>([
        {
            key    : 'severity',
            header : 'Severidad',
            visible: true,
            display: {
                type : 'badge',
                label: (value: string) => {
                    return this.alertSeverities.find(severity => severity.value === value)?.label || 'Desconocido';
                },
                color: (value: string): Color => {
                    const severity = this.alertSeverities.find(s => s.value === value);
                    switch (severity?.value) {
                        case 'critical':
                            return 'red';
                        case 'warning':
                            return 'amber';
                        case 'info':
                            return 'blue';
                        default:
                            return 'gray';
                    }
                }
            }
        },
        {
            key    : 'type',
            header : 'Tipo',
            visible: true,
            display: {
                type : 'badge',
                label: (value: string) => this.alertTypes.find(type => type.value === value)?.label || 'Desconocido',
                color: (value: string): Color => {
                    switch (value) {
                        case 'low-stock':
                            return 'amber';
                        case 'expiring':
                            return 'purple';
                        case 'out-of-stock':
                            return 'red';
                        default:
                            return 'gray';
                    }
                },
            }
        },
        {
            key    : 'message',
            header : 'Mensaje',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'itemName',
            header : 'Producto',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'warehouseName',
            header : 'Almacén',
            visible: true,
            display: {
                type: 'text'
            }
        },
        {
            key    : 'date',
            header : 'Fecha',
            visible: true,
            display: {
                type       : 'date',
                pipeOptions: {format: 'dd/MM/yyyy'}
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

    alertsResource = resource({
        params: () => ({
            warehouseId: this.warehouseSignal(),
            type       : this.typeSignal(),
            severity   : this.severitySignal()
        }),
        loader: async ({params}) => {
            try {
                // Since there's no specific API for alerts, we'll generate them from inventory data
                const alerts: AlertItem[] = [];

                // Get inventory items
                let query: any = {};
                if (params.warehouseId) {
                    query.warehouseId = params.warehouseId;
                }

                const items = await firstValueFrom(this.inventoryService.getInventoryItems(query));
                const warehouses = await firstValueFrom(this.warehouseService.getWarehouses());
                const warehouseMap = new Map<string, Warehouse>();

                warehouses.items.forEach(warehouse => {
                    warehouseMap.set(warehouse.id, warehouse);
                });

                // Generate alerts for low stock
                items.forEach(item => {
                    const warehouse = warehouseMap.get(item.warehouseId);
                    const warehouseName = warehouse ? warehouse.name : 'Desconocido';

                    // Low stock alerts
                    if (item.minimumStock && item.quantity > 0 && item.quantity < item.minimumStock) {
                        const percentage = (item.quantity / item.minimumStock) * 100;
                        let severity: 'critical' | 'warning' | 'info' = 'warning';

                        if (percentage <= 25) {
                            severity = 'critical';
                        } else if (percentage <= 50) {
                            severity = 'warning';
                        } else {
                            severity = 'info';
                        }

                        if (params.type && params.type !== 'low-stock') {
                            // Skip if filtering by a different type
                        } else if (params.severity && params.severity !== severity) {
                            // Skip if filtering by a different severity
                        } else {
                            alerts.push({
                                id         : `low-stock-${ item.id }`,
                                type       : 'low-stock',
                                severity,
                                message    : `Bajo stock: ${ item.quantity } de ${ item.minimumStock } unidades (${ percentage.toFixed(0) }%)`,
                                itemId     : item.id,
                                itemName   : item.name,
                                warehouseId: item.warehouseId,
                                warehouseName,
                                value      : item.quantity,
                                threshold  : item.minimumStock,
                                date       : new Date()
                            });
                        }
                    }

                    // Out of stock alerts
                    if (item.quantity <= 0) {
                        if (params.type && params.type !== 'out-of-stock') {
                            // Skip if filtering by a different type
                        } else if (params.severity && params.severity !== 'critical') {
                            // Skip if filtering by a different severity
                        } else {
                            alerts.push({
                                id         : `out-of-stock-${ item.id }`,
                                type       : 'out-of-stock',
                                severity   : 'critical',
                                message    : `Sin stock: El producto está agotado`,
                                itemId     : item.id,
                                itemName   : item.name,
                                warehouseId: item.warehouseId,
                                warehouseName,
                                value      : 0,
                                threshold  : item.minimumStock || 0,
                                date       : new Date()
                            });
                        }
                    }

                    // Expiring items alerts
                    if (item.expirationDate) {
                        const today = new Date();
                        const expirationDate = new Date(item.expirationDate);
                        const diffTime = expirationDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        let severity: 'critical' | 'warning' | 'info' = 'info';

                        if (diffDays < 0) {
                            severity = 'critical';
                        } else if (diffDays <= 7) {
                            severity = 'critical';
                        } else if (diffDays <= 30) {
                            severity = 'warning';
                        } else {
                            // Skip items that are not expiring soon
                            return;
                        }

                        if (params.type && params.type !== 'expiring') {
                            // Skip if filtering by a different type
                        } else if (params.severity && params.severity !== severity) {
                            // Skip if filtering by a different severity
                        } else {
                            let message = '';
                            if (diffDays < 0) {
                                message = `Expirado: Hace ${ Math.abs(diffDays) } días`;
                            } else {
                                message = `Por expirar: En ${ diffDays } días`;
                            }

                            alerts.push({
                                id         : `expiring-${ item.id }`,
                                type       : 'expiring',
                                severity,
                                message,
                                itemId     : item.id,
                                itemName   : item.name,
                                warehouseId: item.warehouseId,
                                warehouseName,
                                value      : diffDays,
                                threshold  : 0,
                                date       : expirationDate
                            });
                        }
                    }
                });

                return alerts;
            } catch (error) {
                this.notyf.error('Error al cargar las alertas de inventario');
                return [];
            }
        }
    });

    // Computed signals for summary stats
    totalAlerts = computed(() => this.alertsResource.value()?.length || 0);

    criticalAlerts = computed(() =>
        this.alertsResource.value()?.filter(alert => alert.severity === 'critical').length || 0
    );

    warningAlerts = computed(() =>
        this.alertsResource.value()?.filter(alert => alert.severity === 'warning').length || 0
    );

    infoAlerts = computed(() =>
        this.alertsResource.value()?.filter(alert => alert.severity === 'info').length || 0
    );

    clearFilters(): void {
        this.warehouseControl.setValue('');
        this.typeControl.setValue('');
        this.severityControl.setValue('');
    }
}
