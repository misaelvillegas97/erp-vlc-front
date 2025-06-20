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
import { NgApexchartsModule }                    from 'ng-apexcharts';
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
                        sessionsPerDayChart            : null,
                        averageDurationByDayOfWeekChart: null,
                        sessionStatusDistributionChart : null,
                        sessionDurationHistogramChart  : null
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
    sessionsPerDayChart = computed(() => this.dashboardResource.value()?.sessionsPerDayChart || null);
    averageDurationByDayOfWeekChart = computed(() => this.dashboardResource.value()?.averageDurationByDayOfWeekChart || null);
    sessionStatusDistributionChart = computed(() => this.dashboardResource.value()?.sessionStatusDistributionChart || null);
    sessionDurationHistogramChart = computed(() => this.dashboardResource.value()?.sessionDurationHistogramChart || null);

    clearFilters(): void {
        this.dateFromControl.setValue(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        this.dateToControl.setValue(new Date());
        this.dashboardResource.reload();
    }

    reloadData(): void {
        this.dashboardResource.reload();
    }
}
