import { Component, computed, inject, resource } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { MatButtonModule }                       from '@angular/material/button';
import { MatCardModule }                         from '@angular/material/card';
import { MatIconModule }                         from '@angular/material/icon';
import { MatProgressSpinnerModule }              from '@angular/material/progress-spinner';
import { PageHeaderComponent }                   from '@layout/components/page-header/page-header.component';
import { VehicleSessionsService }                from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { DriversService }                        from '@modules/admin/logistics/fleet-management/services/drivers.service';
import { VehiclesService }                       from '@modules/admin/logistics/fleet-management/services/vehicles.service';
import { NotyfService }                          from '@shared/services/notyf.service';
import { firstValueFrom }                        from 'rxjs';
import { ApexOptions, NgApexchartsModule }       from 'ng-apexcharts';
import { Driver }                                from '@modules/admin/logistics/fleet-management/domain/model/driver.model';
import { Vehicle }                               from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';
import { FormControl, ReactiveFormsModule }      from '@angular/forms';
import { MatDatepickerModule }                   from '@angular/material/datepicker';
import { MatFormFieldModule }                    from '@angular/material/form-field';
import { MatInputModule }                        from '@angular/material/input';
import { MatNativeDateModule }                   from '@angular/material/core';
import { MatSelectModule }                       from '@angular/material/select';
import { FindCount }                             from '@shared/domain/model/find-count';

interface SpeedViolation {
    sessionId: string;
    driverId: string;
    vehicleId: string;
    timestamp: Date;
    speed: number;
    excess: number;
    driverName?: string;
    vehicleLicensePlate?: string;
}

@Component({
    selector   : 'app-compliance-safety-dashboard',
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
    templateUrl: './compliance-safety-dashboard.component.html'
})
export class ComplianceSafetyDashboardComponent {
    private readonly vehicleSessionsService = inject(VehicleSessionsService);
    private readonly driversService = inject(DriversService);
    private readonly vehiclesService = inject(VehiclesService);
    private readonly notyf = inject(NotyfService);

    // Date filters
    dateFromControl = new FormControl<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    dateToControl = new FormControl<Date>(new Date());

    // Speed limit (km/h)
    speedLimit = 100;

    // Data resources
    dashboardResource = resource({
        loader: async () => {
            try {
                const dateFrom = this.dateFromControl.value;
                const dateTo = this.dateToControl.value;

                if (!dateFrom || !dateTo) {
                    return null;
                }

                return await firstValueFrom(this.vehicleSessionsService.getComplianceSafetyDashboardData({
                    dateFrom: dateFrom.toISOString(),
                    dateTo  : dateTo.toISOString()
                }));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return null;
            }
        }
    });

    sessionsResource = resource({
        loader: async () => {
            try {
                const dateFrom = this.dateFromControl.value;
                const dateTo = this.dateToControl.value;

                if (!dateFrom || !dateTo) {
                    return [];
                }

                return await firstValueFrom(this.vehicleSessionsService.findAll({
                    dateFrom: dateFrom.toISOString(),
                    dateTo  : dateTo.toISOString()
                }));
            } catch (error) {
                this.notyf.error('Error al cargar las sesiones');
                return [];
            }
        }
    });

    driversResource = resource({
        loader: async () => {
            try {
                return await firstValueFrom<FindCount<Driver>>(this.driversService.findAll());
            } catch (error) {
                this.notyf.error('Error al cargar los conductores');
                return {total: 0, items: []} as FindCount<Driver>;
            }
        }
    });

    vehiclesResource = resource({
        loader: async () => {
            try {
                return await firstValueFrom<FindCount<Vehicle>>(this.vehiclesService.findAll());
            } catch (error) {
                this.notyf.error('Error al cargar los vehículos');
                return {total: 0, items: []} as FindCount<Vehicle>;
            }
        }
    });

    // Computed metrics from dashboard data
    expiredSessions = computed(() => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard) return 0;

        return dashboard.expiredSessions.count;
    });

    expiredSessionsPercentage = computed(() => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard) return 0;

        return dashboard.expiredSessions.percentage;
    });

    speedViolations = computed(() => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard || !dashboard.speedViolationsTable || !dashboard.speedViolationsTable.violations) return [];

        return dashboard.speedViolationsTable.violations.map(violation => ({
            sessionId          : violation.sessionId,
            driverId           : violation.driverId,
            vehicleId          : violation.vehicleId,
            timestamp          : new Date(violation.timestamp),
            speed              : violation.speed,
            excess             : violation.excess,
            driverName         : `${ violation.firstName } ${ violation.lastName }`,
            vehicleLicensePlate: violation.licensePlate
        }));
    });

    totalSpeedViolations = computed(() => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard) return 0;

        return dashboard.speedViolations.count;
    });

    speedLimitValue = computed(() => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard) return this.speedLimit;

        return dashboard.speedViolations.speedLimit;
    });

    expiringLicenses = computed(() => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard || !dashboard.expiringLicensesTable || !dashboard.expiringLicensesTable.licenses) return [];

        return dashboard.expiringLicensesTable.licenses.map(license => {
            const driver = {
                id       : license.driverId,
                firstName: license.firstName,
                lastName : license.lastName
            } as Driver;

            return {
                driver,
                licenseType    : license.licenseType,
                expiryDate     : new Date(license.expiryDate),
                daysUntilExpiry: license.daysUntilExpiry
            };
        }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    });

    maintenanceAlerts = computed(() => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard || !dashboard.maintenanceAlertsTable || !dashboard.maintenanceAlertsTable.alerts) return [];

        return dashboard.maintenanceAlertsTable.alerts
            .sort((a, b) => {
                if (a.alertType === 'date' && b.alertType === 'date') {
                    return (a.daysUntilDue || 0) - (b.daysUntilDue || 0);
                } else if (a.alertType === 'odometer' && b.alertType === 'odometer') {
                    return (a.kmUntilDue || 0) - (b.kmUntilDue || 0);
                } else {
                    return a.alertType === 'date' ? -1 : 1; // Date-based alerts first
                }
            });
    });

    // Chart data
    expiredSessionsTrendChart = computed((): ApexOptions => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard || !dashboard.expiredSessionsTrendChart || !dashboard.expiredSessionsTrendChart.data || dashboard.expiredSessionsTrendChart.data.length === 0) return null;

        const chartData = dashboard.expiredSessionsTrendChart.data;

        return {
            series : [ {
                name: 'Sesiones Expiradas (%)',
                data: chartData.map(p => Math.round(p.percentage * 10) / 10)
            } ],
            chart  : {
                type   : 'line',
                toolbar: {
                    show: false
                }
            },
            stroke : {
                curve: 'smooth',
                width: 3
            },
            colors : [ '#EF4444' ],
            markers: {
                size: 5
            },
            xaxis  : {
                categories: chartData.map(p => p.label || `${ p.month }`),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis  : {
                title: {
                    text: 'Porcentaje (%)'
                },
                min  : 0,
                max  : 100
            },
            tooltip: {
                y: {
                    formatter: (val) => {
                        return `${ val }%`;
                    }
                }
            }
        };
    });

    incidentsByVehicleTypeChart = computed((): ApexOptions => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard || !dashboard.incidentsByVehicleTypeChart || !dashboard.incidentsByVehicleTypeChart.data || dashboard.incidentsByVehicleTypeChart.data.length === 0) return null;

        const chartData = dashboard.incidentsByVehicleTypeChart.data;

        // Prepare data for chart
        const data = chartData.map(item => item.incidentCount);
        const labels = chartData.map(item => item.typeLabel || item.vehicleType);

        return {
            series : data,
            chart  : {
                type   : 'donut',
                height : 350,
                toolbar: {
                    show: false
                }
            },
            labels : labels,
            colors : [ '#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#6B7280' ],
            legend : {
                position: 'bottom'
            },
            tooltip: {
                y: {
                    formatter: (val) => {
                        return `${ val } incidentes`;
                    }
                }
            }
        };
    });

    incidentsByDriverChart = computed((): ApexOptions => {
        const dashboard = this.dashboardResource.value();
        if (!dashboard || !dashboard.incidentsByDriverChart || !dashboard.incidentsByDriverChart.drivers || dashboard.incidentsByDriverChart.drivers.length === 0) return null;

        // Get top 10 drivers by incident count
        const topDrivers = dashboard.incidentsByDriverChart.drivers
            .sort((a, b) => b.incidentCount - a.incidentCount)
            .slice(0, 10);

        return {
            series     : [ {
                name: 'Incidentes',
                data: topDrivers.map(d => d.incidentCount)
            } ],
            chart      : {
                type   : 'bar',
                height : 350,
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal  : true,
                    borderRadius: 5,
                    dataLabels  : {
                        position: 'top'
                    }
                }
            },
            dataLabels : {
                enabled  : true,
                formatter: (val) => {
                    return val.toString();
                },
                offsetX  : 20,
                style    : {
                    fontSize: '12px',
                    colors  : [ '#304758' ]
                }
            },
            colors     : [ '#EF4444' ],
            xaxis      : {
                categories: topDrivers.map(d => `${ d.firstName } ${ d.lastName }`),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis      : {
                title: {
                    text: 'Número de Incidentes'
                }
            },
            tooltip    : {
                y: {
                    formatter: (val) => {
                        return `${ val } incidentes`;
                    }
                }
            }
        };
    });

    clearFilters(): void {
        this.dateFromControl.setValue(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        this.dateToControl.setValue(new Date());
        this.reloadData();
    }

    reloadData(): void {
        this.dashboardResource.reload();
        this.sessionsResource.reload();
        this.driversResource.reload();
        this.vehiclesResource.reload();
    }
}
