import { Component, inject, OnInit, resource, signal, WritableSignal } from '@angular/core';
import { CommonModule }                                                from '@angular/common';
import { MaintenanceRecordService }                                    from '../../services/maintenance-record.service';
import { MaintenanceAlertService }                                     from '../../services/maintenance-alert.service';
import { MaintenanceStatus, MaintenanceType }                          from '../../domain/model/maintenance-record.model';
import { MaintenanceAlert }                                            from '../../domain/model/maintenance-alert.model';
import { MaintenanceStatisticsDto }                                    from '../../domain/model/maintenance-statistics.model';
import { PageDetailHeaderComponent }                                   from '@shared/components/page-detail-header/page-detail-header.component';
import { MatCardModule }                                               from '@angular/material/card';
import { MatIconModule }                                               from '@angular/material/icon';
import { MatButtonModule }                                             from '@angular/material/button';
import { MatDividerModule }                                            from '@angular/material/divider';
import { MatBadgeModule }                                              from '@angular/material/badge';
import { Router }                                                      from '@angular/router';
import { ApexOptions, ChartComponent }                                 from 'ng-apexcharts';
import { firstValueFrom }                                              from 'rxjs';

@Component({
    selector   : 'app-dashboard',
    standalone : true,
    imports    : [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatBadgeModule,
        ChartComponent,
        PageDetailHeaderComponent
    ],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    private maintenanceService = inject(MaintenanceRecordService);
    private alertService = inject(MaintenanceAlertService);
    private router = inject(Router);

    // Signals para los datos
    activeAlerts = signal<MaintenanceAlert[]>([]);
    statistics = signal<MaintenanceStatisticsDto | null>(null);

    // Estadísticas
    pendingMaintenanceCount = signal(0);
    completedMaintenanceCount = signal(0);
    activeAlertsCount = signal(0);
    upcomingMaintenanceCount = signal(0);

    // Charts
    chartMaintenanceByStatus: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartMaintenanceByMonth: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartMaintenanceByType: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartUpcomingMaintenance: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);

    dashboardResource = resource({
        loader: async () => {
            const statistics = await firstValueFrom(this.maintenanceService.getMaintenanceStatistics());
            this.statistics.set(statistics);

            // Actualizar señales con los datos de las estadísticas
            this.pendingMaintenanceCount.set(statistics.pendingMaintenanceCount);
            this.completedMaintenanceCount.set(statistics.completedMaintenanceCount);
            this.activeAlertsCount.set(statistics.activeAlertsCount);
            this.upcomingMaintenanceCount.set(statistics.upcomingMaintenanceCount);
            this.activeAlerts.set(statistics.activeAlerts);

            // Configurar gráficos con los datos de las estadísticas
            this.setupChartsFromStatistics(statistics);
        }
    });

    ngOnInit(): void {
        // Resource will handle data loading
    }

    /**
     * Configura los gráficos para el dashboard usando las estadísticas
     */
    setupChartsFromStatistics(statistics: MaintenanceStatisticsDto): void {
        this.setupMaintenanceByStatusChartFromStatistics(statistics.maintenanceByStatus);
        this.setupMaintenanceByMonthChartFromStatistics(statistics.maintenanceByMonth);
        this.setupMaintenanceByTypeChartFromStatistics(statistics.maintenanceByType);
        this.setupUpcomingMaintenanceChartFromStatistics(statistics.upcomingMaintenanceByVehicle);
    }

    /**
     * Configura el gráfico de mantenimientos por estado usando las estadísticas
     */
    setupMaintenanceByStatusChartFromStatistics(maintenanceByStatus: { status: MaintenanceStatus; count: number }[]): void {
        const labels = maintenanceByStatus.map(item => item.status);
        const series = maintenanceByStatus.map(item => item.count);

        this.chartMaintenanceByStatus.set({
            chart  : {
                type      : 'donut',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors : [ '#FBBF24', '#60A5FA', '#34D399', '#F87171' ],
            labels : labels.map(label => this.getStatusLabel(label)),
            legend : {position: 'bottom'},
            noData : {text: 'No hay datos'},
            series : series,
            tooltip: {theme: 'dark'}
        });

        console.log('Maintenance by status chart configured:', this.chartMaintenanceByStatus());
    }

    /**
     * Configura el gráfico de mantenimientos por mes usando las estadísticas
     */
    setupMaintenanceByMonthChartFromStatistics(maintenanceByMonth: { month: string; count: number }[]): void {
        const labels = maintenanceByMonth.map(item => item.month);
        const series = [ {
            name: 'Mantenimientos',
            data: maintenanceByMonth.map(item => item.count)
        } ];

        this.chartMaintenanceByMonth.set({
            chart  : {
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : '100%',
                width     : '100%',
                type      : 'line',
                zoom      : {enabled: false}
            },
            colors : [ '#34D399' ],
            grid   : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            markers: {
                size        : 4,
                colors      : [ '#34D399' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {size: 7, sizeOffset: 3}
            },
            noData : {text: 'No hay datos'},
            series : series,
            stroke : {
                width: 2,
                curve: 'smooth'
            },
            tooltip: {theme: 'dark'},
            xaxis  : {
                type      : 'category',
                categories: labels
            },
            yaxis  : {
                title : {text: 'Cantidad de mantenimientos'},
                labels: {
                    formatter(val: number): string {
                        return val.toString();
                    }
                }
            }
        });
    }

    /**
     * Configura el gráfico de mantenimientos por tipo usando las estadísticas
     */
    setupMaintenanceByTypeChartFromStatistics(maintenanceByType: { type: MaintenanceType; count: number }[]): void {
        const labels = maintenanceByType.map(item => item.type);
        const series = maintenanceByType.map(item => item.count);

        this.chartMaintenanceByType.set({
            chart  : {
                type      : 'pie',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors : [ '#4ADE80', '#60A5FA', '#F59E0B', '#F87171', '#A78BFA' ],
            labels : labels.map(label => this.getTypeLabel(label)),
            legend : {position: 'bottom'},
            noData : {text: 'No hay datos'},
            series : series,
            tooltip: {theme: 'dark'}
        });
    }

    /**
     * Configura el gráfico de mantenimientos próximos usando las estadísticas
     */
    setupUpcomingMaintenanceChartFromStatistics(upcomingMaintenanceByVehicle: { month: string; vehicleCount: number }[]): void {
        const labels = upcomingMaintenanceByVehicle.map(item => item.month);
        const series = [ {
            name: 'Vehículos con mantenimientos próximos',
            data: upcomingMaintenanceByVehicle.map(item => item.vehicleCount)
        } ];

        this.chartUpcomingMaintenance.set({
            chart      : {
                type      : 'bar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#60A5FA' ],
            dataLabels : {enabled: true},
            grid       : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {
                    lines: {
                        show: true
                    }
                }
            },
            noData     : {text: 'No hay datos'},
            plotOptions: {
                bar: {horizontal: false}
            },
            series     : series,
            tooltip    : {theme: 'dark'},
            xaxis      : {categories: labels},
        });
    }


    /**
     * Obtiene la etiqueta para un estado
     */
    getStatusLabel(status: string): string {
        switch (status) {
            case MaintenanceStatus.PENDING:
                return 'Pendiente';
            case MaintenanceStatus.IN_PROGRESS:
                return 'En progreso';
            case MaintenanceStatus.COMPLETED:
                return 'Completado';
            case MaintenanceStatus.CANCELED:
                return 'Cancelado';
            default:
                return status;
        }
    }

    getTypeLabel(type: MaintenanceType): string {
        switch (type) {
            case MaintenanceType.PREVENTIVE:
                return 'Preventivo';
            case MaintenanceType.CORRECTIVE:
                return 'Correctivo';
            case MaintenanceType.SCHEDULED:
                return 'Programado';
            case MaintenanceType.EMERGENCY:
                return 'Emergencia';
            default:
                return type;
        }
    }

    /**
     * Navega a la página de registros de mantenimiento
     */
    goToMaintenanceRecords(): void {
        this.router.navigate([ '/logistics/preventive-maintenance/list' ]);
    }

    /**
     * Navega a la página de documentos de vehículos
     */
    goToVehicleDocuments(): void {
        this.router.navigate([ '/logistics/preventive-maintenance/documents' ]);
    }

    /**
     * Navega a la página de creación de nuevo registro de mantenimiento
     */
    createNewMaintenanceRecord(): void {
        this.router.navigate([ '/logistics/preventive-maintenance/register' ]);
    }
}
