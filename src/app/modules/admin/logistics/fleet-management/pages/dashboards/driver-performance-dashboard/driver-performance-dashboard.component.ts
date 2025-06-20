import { Component, computed, inject, resource }                  from '@angular/core';
import { CommonModule }                                           from '@angular/common';
import { MatButtonModule }                                        from '@angular/material/button';
import { MatCardModule }                                          from '@angular/material/card';
import { MatIconModule }                                          from '@angular/material/icon';
import { MatProgressSpinnerModule }                               from '@angular/material/progress-spinner';
import { PageHeaderComponent }                                    from '@layout/components/page-header/page-header.component';
import { DriverPerformanceDashboardData, VehicleSessionsService } from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { NotyfService }                                           from '@shared/services/notyf.service';
import { firstValueFrom }                                         from 'rxjs';
import { NgApexchartsModule }                                     from 'ng-apexcharts';
import { LicenseType }                                            from '@modules/admin/logistics/fleet-management/domain/model/driver.model';
import { FormControl, ReactiveFormsModule }                       from '@angular/forms';
import { MatDatepickerModule }                                    from '@angular/material/datepicker';
import { MatFormFieldModule }                                     from '@angular/material/form-field';
import { MatInputModule }                                         from '@angular/material/input';
import { MatNativeDateModule }                                    from '@angular/material/core';
import { MatSelectModule }                                        from '@angular/material/select';

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
                const dateFrom = this.dateFromControl.value;
                const dateTo = this.dateToControl.value;
                const licenseType = this.licenseTypeControl.value;

                if (!dateFrom || !dateTo) {
                    return {
                        metrics                   : {
                            totalActiveDrivers      : 0,
                            mostActiveDriver        : null,
                            averageSessionsPerDriver: 0,
                            averageDistancePerDriver: 0
                        },
                        driverStats               : [],
                        topDriversBySessionsChart : null,
                        topDriversByDistanceChart : null,
                        sessionsByLicenseTypeChart: null,
                        driverActivityTrendChart  : null
                    };
                }

                return await firstValueFrom<DriverPerformanceDashboardData>(this.vehicleSessionsService.getDriverPerformanceDashboardData({
                    dateFrom   : dateFrom.toISOString(),
                    dateTo     : dateTo.toISOString(),
                    licenseType: licenseType
                }));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    metrics                   : {
                        totalActiveDrivers      : 0,
                        mostActiveDriver        : null,
                        averageSessionsPerDriver: 0,
                        averageDistancePerDriver: 0
                    },
                    driverStats               : [],
                    topDriversBySessionsChart : null,
                    topDriversByDistanceChart : null,
                    sessionsByLicenseTypeChart: null,
                    driverActivityTrendChart  : null
                };
            }
        }
    });

    // Computed metrics from dashboard data
    totalActiveDrivers = computed(() => this.dashboardResource.value()?.metrics.totalActiveDrivers || 0);
    mostActiveDriver = computed(() => this.dashboardResource.value()?.metrics.mostActiveDriver || null);
    averageSessionsPerDriver = computed(() => this.dashboardResource.value()?.metrics.averageSessionsPerDriver || 0);
    averageDistancePerDriver = computed(() => this.dashboardResource.value()?.metrics.averageDistancePerDriver || 0);

    // Computed driver stats from dashboard data
    driverStats = computed(() => this.dashboardResource.value()?.driverStats || []);

    // Chart data from dashboard data
    topDriversBySessionsChart = computed(() => this.dashboardResource.value()?.topDriversBySessionsChart || null);
    topDriversByDistanceChart = computed(() => this.dashboardResource.value()?.topDriversByDistanceChart || null);
    sessionsByLicenseTypeChart = computed(() => this.dashboardResource.value()?.sessionsByLicenseTypeChart || null);
    driverActivityTrendChart = computed(() => this.dashboardResource.value()?.driverActivityTrendChart || null);

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
