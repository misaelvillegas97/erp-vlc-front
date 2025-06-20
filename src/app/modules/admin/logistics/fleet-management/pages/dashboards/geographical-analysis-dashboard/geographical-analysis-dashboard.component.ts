import { Component, computed, inject, resource }                     from '@angular/core';
import { CommonModule }                                              from '@angular/common';
import { MatButtonModule }                                           from '@angular/material/button';
import { MatCardModule }                                             from '@angular/material/card';
import { MatIconModule }                                             from '@angular/material/icon';
import { MatProgressSpinnerModule }                                  from '@angular/material/progress-spinner';
import { PageHeaderComponent }                                       from '@layout/components/page-header/page-header.component';
import { GeographicalAnalysisDashboardData, VehicleSessionsService } from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { NotyfService }                                              from '@shared/services/notyf.service';
import { firstValueFrom }                                            from 'rxjs';
import { NgApexchartsModule }                                        from 'ng-apexcharts';
import { FormControl, ReactiveFormsModule }                          from '@angular/forms';
import { MatDatepickerModule }                                       from '@angular/material/datepicker';
import { MatFormFieldModule }                                        from '@angular/material/form-field';
import { MatInputModule }                                            from '@angular/material/input';
import { MatNativeDateModule }                                       from '@angular/material/core';
import { MatSelectModule }                                           from '@angular/material/select';

interface GpsPoint {
    latitude: number;
    longitude: number;
    count: number;
}

interface RouteFrequency {
    startPoint: GpsPoint;
    endPoint: GpsPoint;
    count: number;
}

@Component({
    selector   : 'app-geographical-analysis-dashboard',
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
    templateUrl: './geographical-analysis-dashboard.component.html'
})
export class GeographicalAnalysisDashboardComponent {
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
                        metrics                          : {
                            totalGpsPoints : 0,
                            maxSpeed       : 0,
                            averageDistance: 0
                        },
                        mostVisitedAreas                 : [],
                        speedDistributionChart           : null,
                        sessionStartTimeDistributionChart: null,
                        sessionEndTimeDistributionChart  : null
                    };
                }

                return await firstValueFrom<GeographicalAnalysisDashboardData>(this.vehicleSessionsService.getGeographicalAnalysisDashboardData({
                    dateFrom: dateFrom.toISOString(),
                    dateTo  : dateTo.toISOString()
                }));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    metrics                          : {
                        totalGpsPoints : 0,
                        maxSpeed       : 0,
                        averageDistance: 0
                    },
                    mostVisitedAreas                 : [],
                    speedDistributionChart           : null,
                    sessionStartTimeDistributionChart: null,
                    sessionEndTimeDistributionChart  : null
                };
            }
        }
    });

    // Computed metrics from dashboard data
    totalGpsPoints = computed(() => this.dashboardResource.value()?.metrics.totalGpsPoints || 0);
    maxSpeed = computed(() => this.dashboardResource.value()?.metrics.maxSpeed || 0);
    averageDistance = computed(() => this.dashboardResource.value()?.metrics.averageDistance || 0);

    // Computed areas from dashboard data
    mostVisitedAreas = computed(() => this.dashboardResource.value()?.mostVisitedAreas || []);

    // Chart data from dashboard data
    speedDistributionChart = computed(() => this.dashboardResource.value()?.speedDistributionChart || null);
    sessionStartTimeDistributionChart = computed(() => this.dashboardResource.value()?.sessionStartTimeDistributionChart || null);
    sessionEndTimeDistributionChart = computed(() => this.dashboardResource.value()?.sessionEndTimeDistributionChart || null);

    clearFilters(): void {
        this.dateFromControl.setValue(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        this.dateToControl.setValue(new Date());
        this.dashboardResource.reload();
    }

    reloadData(): void {
        this.dashboardResource.reload();
    }
}
