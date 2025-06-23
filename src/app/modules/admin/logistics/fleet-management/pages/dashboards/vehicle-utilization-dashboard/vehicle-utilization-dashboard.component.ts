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
import { VehicleType }                           from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';
import { FormControl, ReactiveFormsModule }      from '@angular/forms';
import { MatDatepickerModule }                   from '@angular/material/datepicker';
import { MatFormFieldModule }                    from '@angular/material/form-field';
import { MatInputModule }                        from '@angular/material/input';
import { MatNativeDateModule }                   from '@angular/material/core';
import { MatSelectModule }                       from '@angular/material/select';
import { VehiclesService }                       from '@modules/admin/logistics/fleet-management/services/vehicles.service';
import { VehicleUtilizationDashboardData }       from '@modules/admin/logistics/fleet-management/domain/model/dashboard.model';

@Component({
    selector   : 'app-vehicle-utilization-dashboard',
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
    templateUrl: './vehicle-utilization-dashboard.component.html'
})
export class VehicleUtilizationDashboardComponent {
    private readonly vehicleSessionsService = inject(VehicleSessionsService);
    private readonly vehiclesService = inject(VehiclesService);
    private readonly notyf = inject(NotyfService);

    // Date filters
    dateFromControl = new FormControl<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    dateToControl = new FormControl<Date>(new Date());
    vehicleTypeControl = new FormControl<VehicleType | null>(null);

    // Vehicle type options
    vehicleTypes = Object.values(VehicleType);

    // Dashboard data resource
    dashboardResource = resource({
        loader: async () => {
            try {
                const query = {};

                const dateFrom = this.dateFromControl.value;
                if (dateFrom) query['dateFrom'] = dateFrom.toISOString();

                const dateTo = this.dateToControl.value;
                if (dateTo) query['dateTo'] = dateTo.toISOString();

                const vehicleType = this.vehicleTypeControl.value;
                if (vehicleType) query['vehicleType'] = vehicleType;

                if (!dateFrom || !dateTo) {
                    return {
                        totalActiveVehicles       : {count: 0},
                        mostUsedVehicle           : null,
                        averageSessionsPerVehicle : {average: 0},
                        averageDistancePerVehicle : {averageKm: 0},
                        topVehiclesByUsageChart   : {vehicles: []},
                        topVehiclesByDistanceChart: {vehicles: []},
                        usageByVehicleTypeChart   : {data: []},
                        costPerKmByVehicleChart   : {vehicles: []},
                        vehicleOdometerChart      : {vehicles: []}
                    };
                }

                return await firstValueFrom<VehicleUtilizationDashboardData>(this.vehicleSessionsService.getVehicleUtilizationDashboardData(query));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    totalActiveVehicles       : {count: 0},
                    mostUsedVehicle           : null,
                    averageSessionsPerVehicle : {average: 0},
                    averageDistancePerVehicle : {averageKm: 0},
                    topVehiclesByUsageChart   : {vehicles: []},
                    topVehiclesByDistanceChart: {vehicles: []},
                    usageByVehicleTypeChart   : {data: []},
                    costPerKmByVehicleChart   : {vehicles: []},
                    vehicleOdometerChart      : {vehicles: []}
                };
            }
        }
    });

    // Computed metrics from dashboard data
    totalActiveVehicles = computed(() => this.dashboardResource.value()?.totalActiveVehicles.count || 0);
    mostUsedVehicle = computed(() => this.dashboardResource.value()?.mostUsedVehicle || null);
    averageSessionsPerVehicle = computed(() => this.dashboardResource.value()?.averageSessionsPerVehicle.average || 0);
    averageDistancePerVehicle = computed(() => this.dashboardResource.value()?.averageDistancePerVehicle.averageKm || 0);


    // Chart data from dashboard data
    topVehiclesByUsageChart = computed(() => {
        const chartData = this.dashboardResource.value()?.topVehiclesByUsageChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Sesiones',
                data: chartData.vehicles.map(vehicle => vehicle.sessionCount)
            } ],
            chart      : {
                type      : 'bar',
                height    : 350,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                toolbar   : {show: false}
            },
            plotOptions: {
                bar: {
                    horizontal  : false,
                    columnWidth : '55%',
                    borderRadius: 5
                }
            },
            dataLabels : {enabled: false},
            colors     : [ '#4F46E5' ],
            xaxis      : {
                categories: chartData.vehicles.map(vehicle => `${ vehicle.displayName || vehicle.licensePlate }`),
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

    topVehiclesByDistanceChart = computed(() => {
        const chartData = this.dashboardResource.value()?.topVehiclesByDistanceChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Distancia',
                data: chartData.vehicles.map(vehicle => vehicle.totalDistance)
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
                categories: chartData.vehicles.map(vehicle => `${ vehicle.displayName || vehicle.licensePlate }`),
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

    usageByVehicleTypeChart = computed(() => {
        const chartData = this.dashboardResource.value()?.usageByVehicleTypeChart;
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
            labels : chartData.data.map(item => item.typeLabel),
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

    costPerKmByVehicleChart = computed(() => {
        const chartData = this.dashboardResource.value()?.costPerKmByVehicleChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Costo por km',
                data: chartData.vehicles.map(vehicle => vehicle.costPerKm)
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
            colors     : [ '#F59E0B' ],
            xaxis      : {
                categories: chartData.vehicles.map(vehicle => `${ vehicle.displayName || vehicle.licensePlate }`),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis      : {
                title: {
                    text: 'Costo por km ($)'
                }
            },
            tooltip    : {
                theme: 'dark',
                y    : {
                    formatter: (val) => {
                        return `$${ val.toFixed(2) }`;
                    }
                }
            }
        } as ApexOptions;
    });

    vehicleOdometerChart = computed(() => {
        const chartData = this.dashboardResource.value()?.vehicleOdometerChart;
        if (!chartData) return null;

        return {
            series     : [ {
                name: 'Odómetro',
                data: chartData.vehicles.map(vehicle => vehicle.odometerReading)
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
            colors     : [ '#8B5CF6' ],
            xaxis      : {
                categories: chartData.vehicles.map(vehicle => `${ vehicle.displayName || vehicle.licensePlate }`),
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
                        return `${ val.toLocaleString() } km`;
                    }
                }
            },
            grid       : {
                borderColor: '#e7e7e7',
                row        : {
                    colors : [ '#f3f3f3', 'transparent' ],
                    opacity: 0.5
                }
            }
        };
    });

    clearFilters(): void {
        this.dateFromControl.setValue(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        this.dateToControl.setValue(new Date());
        this.vehicleTypeControl.setValue(null);
        this.dashboardResource.reload();
    }

    reloadData(): void {
        this.dashboardResource.reload();
    }
}
