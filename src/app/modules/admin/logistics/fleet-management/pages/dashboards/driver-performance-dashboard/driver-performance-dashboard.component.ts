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
import { NgApexchartsModule }                    from 'ng-apexcharts';
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
                        topDriversBySessionsChart : null,
                        topDriversByDistanceChart : null,
                        sessionsByLicenseTypeChart: null,
                        driverActivityTrendChart  : null
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
                    topDriversBySessionsChart : null,
                    topDriversByDistanceChart : null,
                    sessionsByLicenseTypeChart: null,
                    driverActivityTrendChart  : null
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
