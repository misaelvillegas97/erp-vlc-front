import { Component, computed, inject, resource } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { MatButtonModule }                       from '@angular/material/button';
import { MatCardModule }                         from '@angular/material/card';
import { MatIconModule }                         from '@angular/material/icon';
import { MatProgressSpinnerModule }              from '@angular/material/progress-spinner';
import { PageHeaderComponent }                   from '@layout/components/page-header/page-header.component';
import { VehicleSessionsService }                from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { NotyfService }                          from '@shared/services/notyf.service';
import { firstValueFrom }                        from 'rxjs';
import { ApexOptions, NgApexchartsModule }       from 'ng-apexcharts';
import { LicenseType }                           from '@modules/admin/logistics/fleet-management/domain/model/driver.model';
import { FormControl, ReactiveFormsModule }      from '@angular/forms';
import { MatDatepickerModule }                   from '@angular/material/datepicker';
import { MatFormFieldModule }                    from '@angular/material/form-field';
import { MatInputModule }                        from '@angular/material/input';
import { MatNativeDateModule }                   from '@angular/material/core';
import { MatSelectModule }                       from '@angular/material/select';
import { DriverPerformanceDashboardData }        from '@modules/admin/logistics/fleet-management/domain/model/dashboard.model';

@Component({
    selector   : 'app-driver-performance-dashboard',
    standalone : true,
    imports    : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        PageHeaderComponent,
        NgApexchartsModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatNativeDateModule,
        MatSelectModule
    ],
    templateUrl: './driver-performance-dashboard.component.html'
})
export class DriverPerformanceDashboardComponent {
    private readonly vehicleSessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);

    // Date filters
    dateFromControl = new FormControl<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    dateToControl = new FormControl<Date>(new Date());
    licenseTypeControl = new FormControl<LicenseType | null>(null);

    // License type options
    licenseTypes = Object.values(LicenseType);

    // Dashboard data resource
    dashboardResource = resource({
        loader: async () => {
            try {
                const filter = {};

                const dateFrom = this.dateFromControl.value;
                if (dateFrom) filter['dateFrom'] = dateFrom.toISOString();
                const dateTo = this.dateToControl.value;
                if (dateTo) filter['dateTo'] = dateTo.toISOString();
                const licenseType = this.licenseTypeControl.value;
                if (licenseType) filter['licenseType'] = licenseType;

                if (!dateFrom || !dateTo) {
                    return {
                        totalActiveDrivers      : {count: 0},
                        mostActiveDriver        : null,
                        averageSessionsPerDriver: {average: 0},
                        averageDistancePerDriver: {averageKm: 0},
                        driverStats               : [],
                        topDriversBySessionsChart : {drivers: []},
                        topDriversByDistanceChart : {drivers: []},
                        sessionsByLicenseTypeChart: {data: []},
                        driverActivityTrendChart  : {weeks: [], drivers: []}
                    } as DriverPerformanceDashboardData;
                }

                return await firstValueFrom<DriverPerformanceDashboardData>(this.vehicleSessionsService.getDriverPerformanceDashboardData(filter));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    totalActiveDrivers      : {count: 0},
                    mostActiveDriver        : null,
                    averageSessionsPerDriver: {average: 0},
                    averageDistancePerDriver: {averageKm: 0},
                    driverStats               : [],
                    topDriversBySessionsChart : {drivers: []},
                    topDriversByDistanceChart : {drivers: []},
                    sessionsByLicenseTypeChart: {data: []},
                    driverActivityTrendChart  : {weeks: [], drivers: []}
                } as DriverPerformanceDashboardData;
            }
        }
    });

    // Computed metrics from dashboard data
    totalActiveDrivers = computed(() => this.dashboardResource.value()?.totalActiveDrivers.count || 0);
    mostActiveDriver = computed(() => this.dashboardResource.value()?.mostActiveDriver || null);
    averageSessionsPerDriver = computed(() => this.dashboardResource.value()?.averageSessionsPerDriver.average || 0);
    averageDistancePerDriver = computed(() => this.dashboardResource.value()?.averageDistancePerDriver.averageKm || 0);

    // Chart data from dashboard data
    topDriversBySessionsChart = computed(() => {
        const chartData = this.dashboardResource.value()?.topDriversBySessionsChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Sesiones',
                data: chartData.drivers.map(driver => driver.sessionCount)
            } ],
            chart      : {
                type      : 'bar',
                height    : 350,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                toolbar   : {
                    show: false
                }
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
                categories: chartData.drivers.map(driver => `${ driver.firstName } ${ driver.lastName }`),
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
            }
        } as ApexOptions;
    });

    topDriversByDistanceChart = computed(() => {
        const chartData = this.dashboardResource.value()?.topDriversByDistanceChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Distancia',
                data: chartData.drivers.map(driver => driver.totalDistance)
            } ],
            chart      : {
                type      : 'bar',
                height    : 350,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                toolbar   : {
                    show: false
                }
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
                categories: chartData.drivers.map(driver => `${ driver.firstName } ${ driver.lastName }`),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis      : {
                title: {
                    text: 'Kilómetros'
                }
            },
            tooltip    : {
                theme: 'dark',
                y    : {
                    formatter: (val) => {
                        return `${ val } km`;
                    }
                }
            }
        } as ApexOptions;
    });

    sessionsByLicenseTypeChart = computed(() => {
        const chartData = this.dashboardResource.value()?.sessionsByLicenseTypeChart;
        if (!chartData) return null;

        return {
            series : chartData.data.map(item => item.sessionCount),
            chart  : {
                type      : 'pie',
                height    : 350,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                toolbar   : {
                    show: false
                }
            },
            labels : chartData.data.map(item => item.licenseLabel),
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

    driverActivityTrendChart = computed(() => {
        const chartData = this.dashboardResource.value()?.driverActivityTrendChart;
        if (!chartData) return null;

        return {
            series : chartData.drivers.map(driver => ({
                name: `${ driver.firstName } ${ driver.lastName }`,
                data: driver.sessionsByWeek
            })),
            chart  : {
                type      : 'line',
                height    : 350,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                zoom      : {
                    enabled: false
                },
                toolbar   : {
                    show: false
                }
            },
            stroke : {
                curve: 'smooth',
                width: 3
            },
            colors : [ '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6' ],
            markers: {
                size: 5
            },
            xaxis  : {
                categories: chartData.weeks,
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis  : {
                title: {
                    text: 'Sesiones'
                }
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

    clearFilters(): void {
        this.dateFromControl.setValue(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        this.dateToControl.setValue(new Date());
        this.licenseTypeControl.setValue(null);
        this.dashboardResource.reload();
    }

    reloadData(): void {
        this.dashboardResource.reload();
    }
}
