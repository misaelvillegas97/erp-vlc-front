import { Component, computed, inject, resource } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { MatButtonModule }                       from '@angular/material/button';
import { MatCardModule }                         from '@angular/material/card';
import { MatIconModule }                         from '@angular/material/icon';
import { MatProgressSpinnerModule }              from '@angular/material/progress-spinner';
import { RouterLink }                            from '@angular/router';
import { PageHeaderComponent }                   from '@layout/components/page-header/page-header.component';
import { VehicleSessionsService }                from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { NotyfService }                          from '@shared/services/notyf.service';
import { firstValueFrom }                        from 'rxjs';
import { ApexOptions, NgApexchartsModule }       from 'ng-apexcharts';
import { FormControl, ReactiveFormsModule }      from '@angular/forms';
import { MatDatepickerModule }                   from '@angular/material/datepicker';
import { MatFormFieldModule }                    from '@angular/material/form-field';
import { MatInputModule }                        from '@angular/material/input';
import { MatNativeDateModule }                   from '@angular/material/core';
import { HistoricalAnalysisDashboardData }       from '@modules/admin/logistics/fleet-management/domain/model/dashboard.model';

@Component({
    selector   : 'app-historical-analysis-dashboard',
    standalone : true,
    imports    : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
        PageHeaderComponent,
        NgApexchartsModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatNativeDateModule
    ],
    templateUrl: './historical-analysis-dashboard.component.html'
})
export class HistoricalAnalysisDashboardComponent {
    private readonly vehicleSessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);

    // Date filters
    dateFromControl = new FormControl<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    dateToControl = new FormControl<Date>(new Date());

    // Dashboard data resource
    dashboardResource = resource({
        loader: async () => {
            try {
                const dateFrom = this.dateFromControl.value;
                const dateTo = this.dateToControl.value;

                if (!dateFrom || !dateTo) {
                    return {
                        totalSessions                  : {count: 0},
                        totalDistance                  : {totalKm: 0},
                        totalTimeInRoute               : {totalMinutes: 0},
                        averageDistancePerSession      : {averageKm: 0},
                        sessionsPerDayChart            : {data: []},
                        averageDurationByDayOfWeekChart: {data: []},
                        sessionStatusDistributionChart : {data: []},
                        sessionDurationHistogramChart  : {data: []}
                    };
                }

                return await firstValueFrom<HistoricalAnalysisDashboardData>(this.vehicleSessionsService.getHistoricalAnalysisDashboardData({
                    dateFrom: dateFrom.toISOString(),
                    dateTo  : dateTo.toISOString()
                }));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    totalSessions                  : {count: 0},
                    totalDistance                  : {totalKm: 0},
                    totalTimeInRoute               : {totalMinutes: 0},
                    averageDistancePerSession      : {averageKm: 0},
                    sessionsPerDayChart            : null,
                    averageDurationByDayOfWeekChart: null,
                    sessionStatusDistributionChart : null,
                    sessionDurationHistogramChart  : null
                };
            }
        }
    });

    // Computed metrics from dashboard data
    totalSessions = computed(() => this.dashboardResource.value()?.totalSessions.count || 0);
    totalDistance = computed(() => this.dashboardResource.value()?.totalDistance.totalKm || 0);
    totalTimeInRoute = computed(() => this.dashboardResource.value()?.totalTimeInRoute.totalMinutes || 0);
    averageDistancePerSession = computed(() => this.dashboardResource.value()?.averageDistancePerSession.averageKm || 0);

    // Chart data from dashboard data
    sessionsPerDayChart = computed(() => {
        const chartData = this.dashboardResource.value()?.sessionsPerDayChart;
        if (!chartData) return null;

        return {
            series : [ {
                name: 'Sesiones',
                data: chartData.data.map(item => item.count)
            } ],
            noData : {text: 'No hay datos'},
            chart  : {
                type      : 'line',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : 350,
                width     : '100%',
                zoom      : {enabled: false},
                toolbar   : {show: false}
            },
            stroke : {
                curve: 'smooth',
                width: 3
            },
            colors : [ '#4F46E5' ],
            markers: {
                size: 5
            },
            xaxis  : {
                categories: chartData.data.map(item => item.date),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis  : {
                title: {
                    text: 'Número de sesiones'
                }
            },
            tooltip: {
                theme: 'dark',
                y    : {
                    formatter: (val) => {
                        return `${ val } sesiones`;
                    }
                }
            },
        } as ApexOptions;
    });

    averageDurationByDayOfWeekChart = computed(() => {
        const chartData = this.dashboardResource.value()?.averageDurationByDayOfWeekChart;
        if (!chartData) return null;

        // Sort by day number to ensure correct order (Monday to Sunday)
        const sortedData = [ ...chartData.data ].sort((a, b) => a.dayNumber - b.dayNumber);

        return {
            series     : [ {
                name: 'Duración promedio',
                data: sortedData.map(item => item.averageDurationMinutes)
            } ],
            noData     : {text: 'No hay datos'},
            chart      : {
                type      : 'bar',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                width     : '100%',
                height    : 350,
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
            colors     : [ '#10B981' ],
            xaxis      : {
                categories: sortedData.map(item => item.dayOfWeek),
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
                y    : {
                    formatter: (val) => {
                        return `${ val } minutos`;
                    }
                }
            }
        } as ApexOptions;
    });

    sessionStatusDistributionChart = computed(() => {
        const chartData = this.dashboardResource.value()?.sessionStatusDistributionChart;
        if (!chartData) return null;

        return {
            series : chartData.data.map(item => item.count),
            noData : {text: 'No hay datos'},
            chart  : {
                type      : 'pie',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                width     : '100%',
                height    : 350,
                zoom      : {enabled: false},
                toolbar   : {show: false}
            },
            labels : chartData.data.map(item => item.statusLabel),
            colors : [ '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6' ],
            legend : {
                position: 'bottom'
            },
            tooltip: {
                theme: 'dark',
                y    : {
                    formatter: (val) => {
                        return `${ val } sesiones`;
                    }
                }
            }
        } as ApexOptions;
    });

    sessionDurationHistogramChart = computed(() => {
        const chartData = this.dashboardResource.value()?.sessionDurationHistogramChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Sesiones',
                data: chartData.data.map(item => item.count)
            } ],
            noData     : {text: 'No hay datos'},
            chart      : {
                type      : 'bar',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                width     : '100%',
                height    : 350,
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
            colors     : [ '#8B5CF6' ],
            xaxis      : {
                categories: chartData.data.map(item => item.range),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis      : {
                title: {
                    text: 'Número de sesiones'
                }
            },
            tooltip    : {
                theme: 'dark',
                y    : {
                    formatter: (val) => {
                        return `${ val } sesiones`;
                    }
                }
            },
        } as ApexOptions;
    });

    clearFilters(): void {
        this.dateFromControl.setValue(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        this.dateToControl.setValue(new Date());
        this.dashboardResource.reload();
    }

    reloadData(): void {
        this.dashboardResource.reload();
    }
}
