import { Component, computed, inject, resource }                   from '@angular/core';
import { CommonModule }                                            from '@angular/common';
import { MatButtonModule }                                         from '@angular/material/button';
import { MatCardModule }                                           from '@angular/material/card';
import { MatIconModule }                                           from '@angular/material/icon';
import { MatProgressSpinnerModule }                                from '@angular/material/progress-spinner';
import { PageHeaderComponent }                                     from '@layout/components/page-header/page-header.component';
import { VehicleSessionsService, VehicleUtilizationDashboardData } from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { NotyfService }                                            from '@shared/services/notyf.service';
import { firstValueFrom }                                          from 'rxjs';
import { NgApexchartsModule }                                      from 'ng-apexcharts';
import { VehicleType }                                             from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';
import { FormControl, ReactiveFormsModule }                        from '@angular/forms';
import { MatDatepickerModule }                                     from '@angular/material/datepicker';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInputModule }                                          from '@angular/material/input';
import { MatNativeDateModule }                                     from '@angular/material/core';
import { MatSelectModule }                                         from '@angular/material/select';
import { VehiclesService }                                         from '@modules/admin/logistics/fleet-management/services/vehicles.service';

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
                const dateFrom = this.dateFromControl.value;
                const dateTo = this.dateToControl.value;
                const vehicleType = this.vehicleTypeControl.value;

                if (!dateFrom || !dateTo) {
                    return {
                        metrics                   : {
                            totalActiveVehicles      : 0,
                            mostUsedVehicle          : null,
                            averageSessionsPerVehicle: 0,
                            averageDistancePerVehicle: 0
                        },
                        vehicleStats              : [],
                        topVehiclesByUsageChart   : null,
                        topVehiclesByDistanceChart: null,
                        usageByVehicleTypeChart   : null,
                        costPerKmByVehicleChart   : null,
                        vehicleOdometerChart      : null
                    };
                }

                return await firstValueFrom<VehicleUtilizationDashboardData>(this.vehicleSessionsService.getVehicleUtilizationDashboardData({
                    dateFrom   : dateFrom.toISOString(),
                    dateTo     : dateTo.toISOString(),
                    vehicleType: vehicleType
                }));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    metrics                   : {
                        totalActiveVehicles      : 0,
                        mostUsedVehicle          : null,
                        averageSessionsPerVehicle: 0,
                        averageDistancePerVehicle: 0
                    },
                    vehicleStats              : [],
                    topVehiclesByUsageChart   : null,
                    topVehiclesByDistanceChart: null,
                    usageByVehicleTypeChart   : null,
                    costPerKmByVehicleChart   : null,
                    vehicleOdometerChart      : null
                };
            }
        }
    });

    // Computed metrics from dashboard data
    totalActiveVehicles = computed(() => this.dashboardResource.value()?.metrics.totalActiveVehicles || 0);
    mostUsedVehicle = computed(() => this.dashboardResource.value()?.metrics.mostUsedVehicle || null);
    averageSessionsPerVehicle = computed(() => this.dashboardResource.value()?.metrics.averageSessionsPerVehicle || 0);
    averageDistancePerVehicle = computed(() => this.dashboardResource.value()?.metrics.averageDistancePerVehicle || 0);

    // Computed vehicle stats from dashboard data
    vehicleStats = computed(() => this.dashboardResource.value()?.vehicleStats || []);

    // Chart data from dashboard data
    topVehiclesByUsageChart = computed(() => this.dashboardResource.value()?.topVehiclesByUsageChart || null);
    topVehiclesByDistanceChart = computed(() => this.dashboardResource.value()?.topVehiclesByDistanceChart || null);
    usageByVehicleTypeChart = computed(() => this.dashboardResource.value()?.usageByVehicleTypeChart || null);
    costPerKmByVehicleChart = computed(() => this.dashboardResource.value()?.costPerKmByVehicleChart || null);
    vehicleOdometerChart = computed(() => this.dashboardResource.value()?.vehicleOdometerChart || null);

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
