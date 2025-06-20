import { Component, computed, inject, resource }               from '@angular/core';
import { CommonModule }                                        from '@angular/common';
import { MatButtonModule }                                     from '@angular/material/button';
import { MatCardModule }                                       from '@angular/material/card';
import { MatIconModule }                                       from '@angular/material/icon';
import { MatProgressSpinnerModule }                            from '@angular/material/progress-spinner';
import { RouterLink }                                          from '@angular/router';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { ActiveSessionsDashboardData, VehicleSessionsService } from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { NotyfService }                                        from '@shared/services/notyf.service';
import { firstValueFrom }                                      from 'rxjs';
import { ApexOptions, NgApexchartsModule }                     from 'ng-apexcharts';

@Component({
    selector   : 'app-active-sessions-dashboard',
    standalone : true,
    imports    : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
        PageHeaderComponent,
        NgApexchartsModule
    ],
    templateUrl: './active-sessions-dashboard.component.html'
})
export class ActiveSessionsDashboardComponent {
    private readonly vehicleSessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);

    // Dashboard data resource
    dashboardResource = resource({
        loader: async () => {
            try {
                return await firstValueFrom<ActiveSessionsDashboardData>(this.vehicleSessionsService.getActiveSessionsDashboardData());
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    activeSessions         : {count: 0},
                    averageDuration        : {averageMinutes: 0},
                    totalDistance          : {totalKm: 0},
                    vehiclesInUsePercentage: {
                        percentage : 0,
                        activeCount: 0,
                        totalCount : 0
                    },
                    sessionDurationChart   : null,
                    averageSpeedChart      : null
                };
            }
        }
    });

    // Computed metrics from dashboard data
    activeSessions = computed(() => this.dashboardResource.value()?.activeSessions.count || 0);
    averageDuration = computed(() => this.dashboardResource.value()?.averageDuration.averageMinutes || 0);
    totalDistance = computed(() => this.dashboardResource.value()?.totalDistance.totalKm || 0);
    vehiclesInUsePercentage = computed(() => this.dashboardResource.value()?.vehiclesInUsePercentage.percentage || 0);

    // Chart data from dashboard data
    sessionDurationChart = computed(() => {
        const chartData = this.dashboardResource.value()?.sessionDurationChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Duración de Sesiones',
                data: chartData.sessions.map(s => ({
                    x: `${ s.driverName } (${ s.vehicleLicensePlate })`,
                    y: s.durationMinutes
                }))
            } ],
            chart      : {
                type   : 'bar',
                height : 350,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                zoom      : {enabled: false},
                toolbar   : {show: false}
            },
            plotOptions: {
                bar: {
                    horizontal  : false,
                    columnWidth : '55%',
                    borderRadius: 5
                }
            },
            dataLabels : {
                enabled: false
            },
            colors     : [ '#4F46E5' ],
            xaxis      : {
                categories: chartData.sessions.map(s => `${ s.driverName } (${ s.vehicleLicensePlate })`),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis      : {
                title: {
                    text: 'Minutos'
                }
            },
            tooltip    : {
                theme: 'dark',
                y: {
                    formatter: (val) => `${ val } minutos`
                }
            }
        } as ApexOptions;
    });

    averageSpeedChart = computed(() => {
        const chartData = this.dashboardResource.value()?.averageSpeedChart;
        if (!chartData) return null;

        return {
            series : [ {
                name: 'Velocidad Promedio',
                data: chartData.sessions.map(s => ({
                    x: `${ s.driverName } (${ s.vehicleLicensePlate })`,
                    y: s.averageSpeed
                }))
            } ],
            chart  : {
                type   : 'line',
                height : 350,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                zoom      : {enabled: false},
                toolbar: {
                    show: false
                }
            },
            stroke : {
                curve: 'smooth',
                width: 3
            },
            colors : [ '#10B981' ],
            markers: {
                size: 5
            },
            xaxis  : {
                categories: chartData.sessions.map(s => `${ s.driverName } (${ s.vehicleLicensePlate })`),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis  : {
                title: {
                    text: 'km/h'
                }
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: (val) => {
                        return `${ val } km/h`;
                    }
                }
            },
            grid   : {
                borderColor: '#e7e7e7',
                row        : {
                    colors: [ 'transparent' ],
                    opacity: 0.5
                }
            }
        } as ApexOptions;
    });

    reloadData(): void {
        this.dashboardResource.reload();
    }
}
