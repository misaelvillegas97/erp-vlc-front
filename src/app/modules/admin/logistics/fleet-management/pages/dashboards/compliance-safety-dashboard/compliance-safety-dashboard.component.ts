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
import { NgApexchartsModule }                    from 'ng-apexcharts';
import { SessionStatus }                         from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
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
    driverName?: string;
    vehicleLicensePlate?: string;
}

interface ExpiredLicense {
    driver: Driver;
    licenseType: string;
    expiryDate: Date;
    daysUntilExpiry: number;
}

interface MaintenanceAlert {
    vehicle: Vehicle;
    type: 'date' | 'odometer';
    dueDate?: Date;
    dueKm?: number;
    daysUntilDue?: number;
    kmUntilDue?: number;
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

    // Computed metrics
    expiredSessions = computed(() => {
        const sessions = this.sessionsResource.value();
        if (!sessions || sessions.length === 0) return 0;

        return sessions.filter(session => session.status === SessionStatus.EXPIRED).length;
    });

    speedViolations = computed(() => {
        const sessions = this.sessionsResource.value();
        const drivers = this.driversResource.value();
        const vehicles = this.vehiclesResource.value();

        if (!sessions || sessions.length === 0) return [];

        const violations: SpeedViolation[] = [];

        sessions.forEach(session => {
            if (!session.gps) return;

            session.gps.forEach(point => {
                if (point.speed !== undefined && point.speed > this.speedLimit && point.timestamp) {
                    const violation: SpeedViolation = {
                        sessionId: session.id,
                        driverId : session.driverId,
                        vehicleId: session.vehicleId,
                        timestamp: new Date(point.timestamp),
                        speed    : point.speed
                    };

                    // Add driver and vehicle info if available
                    if (drivers && drivers.items?.length > 0) {
                        const driver = drivers.items?.find(d => d.id === session.driverId);
                        if (driver) {
                            violation.driverName = `${ driver.firstName } ${ driver.lastName }`;
                        }
                    }

                    if (vehicles && vehicles.items?.length > 0) {
                        const vehicle = vehicles.items?.find(v => v.id === session.vehicleId);
                        if (vehicle) {
                            violation.vehicleLicensePlate = vehicle.licensePlate;
                        }
                    }

                    violations.push(violation);
                }
            });
        });

        return violations;
    });

    totalSpeedViolations = computed(() => this.speedViolations().length);

    expiringLicenses = computed(() => {
        const drivers = this.driversResource.value();
        if (!drivers || drivers.items?.length === 0) return [];

        const today = new Date();
        const expiringLicenses: ExpiredLicense[] = [];

        drivers.items?.forEach(driver => {
            if (!driver.driverLicense || driver.driverLicense.length === 0) return;

            driver.driverLicense.forEach(license => {
                const expiryDate = new Date(license.licenseValidTo);
                const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                // Include licenses that expire within 30 days or have already expired
                if (daysUntilExpiry <= 30) {
                    expiringLicenses.push({
                        driver,
                        licenseType: license.licenseType,
                        expiryDate,
                        daysUntilExpiry
                    });
                }
            });
        });

        // Sort by days until expiry (ascending)
        return expiringLicenses.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    });

    maintenanceAlerts = computed(() => {
        const vehicles = this.vehiclesResource.value();
        if (!vehicles || vehicles.items?.length === 0) return [];

        const today = new Date();
        const maintenanceAlerts: MaintenanceAlert[] = [];

        vehicles.items?.forEach(vehicle => {
            // Check date-based maintenance
            if (vehicle.nextMaintenanceDate) {
                const dueDate = new Date(vehicle.nextMaintenanceDate);
                const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                // Include vehicles with maintenance due within 30 days or overdue
                if (daysUntilDue <= 30) {
                    maintenanceAlerts.push({
                        vehicle,
                        type: 'date',
                        dueDate,
                        daysUntilDue
                    });
                }
            }

            // Check odometer-based maintenance
            if (vehicle.nextMaintenanceKm && vehicle.lastKnownOdometer) {
                const kmUntilDue = vehicle.nextMaintenanceKm - vehicle.lastKnownOdometer;

                // Include vehicles with maintenance due within 500 km or overdue
                if (kmUntilDue <= 500) {
                    maintenanceAlerts.push({
                        vehicle,
                        type : 'odometer',
                        dueKm: vehicle.nextMaintenanceKm,
                        kmUntilDue
                    });
                }
            }
        });

        // Sort by days until due (ascending) for date-based alerts, then by km until due (ascending) for odometer-based alerts
        return maintenanceAlerts.sort((a, b) => {
            if (a.type === 'date' && b.type === 'date') {
                return (a.daysUntilDue || 0) - (b.daysUntilDue || 0);
            } else if (a.type === 'odometer' && b.type === 'odometer') {
                return (a.kmUntilDue || 0) - (b.kmUntilDue || 0);
            } else {
                return a.type === 'date' ? -1 : 1; // Date-based alerts first
            }
        });
    });

    // Chart data
    expiredSessionsTrendChart = computed(() => {
        const sessions = this.sessionsResource.value();
        if (!sessions || sessions.length === 0) return null;

        // Group sessions by month
        const sessionsByMonth = new Map<string, { total: number, expired: number }>();

        sessions.forEach(session => {
            if (!session.startTime) return;

            const date = new Date(session.startTime);
            const monthKey = `${ date.getFullYear() }-${ date.getMonth() + 1 }`;

            if (sessionsByMonth.has(monthKey)) {
                const monthData = sessionsByMonth.get(monthKey);
                monthData.total++;
                if (session.status === SessionStatus.EXPIRED) {
                    monthData.expired++;
                }
                sessionsByMonth.set(monthKey, monthData);
            } else {
                sessionsByMonth.set(monthKey, {
                    total  : 1,
                    expired: session.status === SessionStatus.EXPIRED ? 1 : 0
                });
            }
        });

        // Sort months
        const sortedMonths = Array.from(sessionsByMonth.keys()).sort();

        // Calculate percentages
        const percentages = sortedMonths.map(month => {
            const data = sessionsByMonth.get(month);
            return {
                month,
                percentage: data.total > 0 ? (data.expired / data.total) * 100 : 0
            };
        });

        return {
            series : [ {
                name: 'Sesiones Expiradas (%)',
                data: percentages.map(p => Math.round(p.percentage * 10) / 10)
            } ],
            chart  : {
                type   : 'line',
                height : 350,
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
                categories: percentages.map(p => {
                    const [ year, month ] = p.month.split('-');
                    return `${ month }/${ year }`;
                }),
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
            },
            grid   : {
                borderColor: '#e7e7e7',
                row        : {
                    colors : [ '#f3f3f3', 'transparent' ],
                    opacity: 0.5
                }
            }
        };
    });

    incidentsByVehicleTypeChart = computed(() => {
        const sessions = this.sessionsResource.value();
        const vehicles = this.vehiclesResource.value();

        if (!sessions || sessions.length === 0 || !vehicles || vehicles.items?.length === 0) return null;

        // Count incidents by vehicle type
        const incidentsByType = new Map<string, number>();

        // Initialize with all vehicle types
        const vehicleTypes = Array.from(new Set(vehicles.items?.map(v => v.type)));
        vehicleTypes.forEach(type => {
            incidentsByType.set(type, 0);
        });

        // Count incidents
        sessions.forEach(session => {
            if (!session.incidents || session.incidents.trim() === '') return;

            const vehicle = vehicles.items?.find(v => v.id === session.vehicleId);
            if (!vehicle || !vehicle.type) return;

            const currentCount = incidentsByType.get(vehicle.type) || 0;
            incidentsByType.set(vehicle.type, currentCount + 1);
        });

        // Prepare data for chart
        const data = Array.from(incidentsByType.entries())
            .filter(([ _, count ]) => count > 0)
            .map(([ type, count ]) => count);

        const labels = Array.from(incidentsByType.entries())
            .filter(([ _, count ]) => count > 0)
            .map(([ type, _ ]) => type);

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

    incidentsByDriverChart = computed(() => {
        const sessions = this.sessionsResource.value();
        const drivers = this.driversResource.value();

        if (!sessions || sessions.length === 0 || !drivers || drivers.items?.length === 0) return null;

        // Count incidents by driver
        const incidentsByDriver = new Map<string, { driver: Driver, count: number }>();

        // Count incidents
        sessions.forEach(session => {
            if (!session.incidents || session.incidents.trim() === '') return;

            const driver = drivers.items?.find(d => d.id === session.driverId);
            if (!driver) return;

            if (incidentsByDriver.has(driver.id)) {
                const data = incidentsByDriver.get(driver.id);
                data.count++;
                incidentsByDriver.set(driver.id, data);
            } else {
                incidentsByDriver.set(driver.id, {driver, count: 1});
            }
        });

        // Get top 10 drivers by incident count
        const topDrivers = Array.from(incidentsByDriver.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            series     : [ {
                name: 'Incidentes',
                data: topDrivers.map(d => d.count)
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
                categories: topDrivers.map(d => `${ d.driver.firstName } ${ d.driver.lastName }`),
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
        this.reloadData();
    }

    reloadData(): void {
        this.sessionsResource.reload();
        this.driversResource.reload();
        this.vehiclesResource.reload();
    }
}
