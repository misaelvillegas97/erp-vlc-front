import { Component, computed, inject, resource }                     from '@angular/core';
import { CommonModule }                                              from '@angular/common';
import { MatButtonModule }                                           from '@angular/material/button';
import { MatCardModule }                                             from '@angular/material/card';
import { MatDialog, MatDialogModule }                                from '@angular/material/dialog';
import { MatIconModule }                                             from '@angular/material/icon';
import { MatProgressSpinnerModule }                                  from '@angular/material/progress-spinner';
import { PageHeaderComponent }                                       from '@layout/components/page-header/page-header.component';
import { VehicleSessionsService }                                    from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { NotyfService }                                              from '@shared/services/notyf.service';
import { firstValueFrom }                                            from 'rxjs';
import { ApexOptions, NgApexchartsModule }                           from 'ng-apexcharts';
import { FormControl, ReactiveFormsModule }                          from '@angular/forms';
import { MatDatepickerModule }                                       from '@angular/material/datepicker';
import { MatFormFieldModule }                                        from '@angular/material/form-field';
import { MatInputModule }                                            from '@angular/material/input';
import { MatNativeDateModule }                                       from '@angular/material/core';
import { MatSelectModule }                                           from '@angular/material/select';
import { MatTooltipModule }                                          from '@angular/material/tooltip';
import { GeographicalAnalysisDashboardData }                         from '@modules/admin/logistics/fleet-management/domain/model/dashboard.model';
import { LocationPreviewDialogComponent, LocationPreviewDialogData } from './location-preview-dialog.component';

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
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        PageHeaderComponent,
        NgApexchartsModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatNativeDateModule,
        MatSelectModule,
        MatTooltipModule
    ],
    templateUrl: './geographical-analysis-dashboard.component.html'
})
export class GeographicalAnalysisDashboardComponent {
    private readonly vehicleSessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);
    private readonly dialog = inject(MatDialog);

    // Google Maps API Key - In a real app, this should be stored in an environment variable
    private readonly googleMapsApiKey = 'YOUR_API_KEY';

    /**
     * Converts decimal coordinates to DMS (degrees, minutes, seconds) format
     */
    formatCoordinateToDMS(coordinate: number, isLatitude: boolean): string {
        const absolute = Math.abs(coordinate);
        const degrees = Math.floor(absolute);
        const minutesNotTruncated = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesNotTruncated);
        const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

        const direction = isLatitude
            ? (coordinate >= 0 ? 'N' : 'S')
            : (coordinate >= 0 ? 'E' : 'O');

        return `${ degrees }° ${ minutes }' ${ seconds }" ${ direction }`;
    }

    /**
     * Formats coordinates in a human-readable way
     */
    formatCoordinates(latitude: number, longitude: number): string {
        return `${ this.formatCoordinateToDMS(latitude, true) }, ${ this.formatCoordinateToDMS(longitude, false) }`;
    }

    /**
     * Formats decimal coordinates in a simplified way
     */
    formatDecimalCoordinates(latitude: number, longitude: number): string {
        return `${ latitude.toFixed(4) }, ${ longitude.toFixed(4) }`;
    }

    /**
     * Generates a URL to open Google Maps at the specified coordinates
     */
    getGoogleMapsUrl(latitude: number, longitude: number): string {
        return `https://www.google.com/maps?q=${ latitude },${ longitude }`;
    }

    /**
     * Opens Google Maps in a new tab
     */
    openGoogleMaps(latitude: number, longitude: number): void {
        const url = this.getGoogleMapsUrl(latitude, longitude);
        window.open(url, '_blank');
    }

    /**
     * Opens a dialog with a preview of the location
     */
    openLocationPreviewDialog(latitude: number, longitude: number): void {
        this.dialog.open<LocationPreviewDialogComponent, LocationPreviewDialogData>(LocationPreviewDialogComponent, {
            data      : {
                latitude,
                longitude
            },
            width     : '1100px',
            maxWidth  : '95vw',
            maxHeight : '90vh',
            panelClass: 'location-preview-dialog'
        });
    }

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
                        totalGpsPoints                   : {count: 0},
                        maxSpeed                         : {maxSpeedKmh: 0, sessionId: '', driverId: '', vehicleId: '', timestamp: ''},
                        averageDistance                  : {averageKm: 0},
                        mostVisitedAreas                 : {areas: []},
                        speedDistributionChart           : {data: []},
                        sessionStartTimeDistributionChart: {data: []},
                        sessionEndTimeDistributionChart  : {data: []},
                        heatMapData                      : {points: []},
                        frequentRoutesData               : {routes: []}
                    };
                }

                return await firstValueFrom<GeographicalAnalysisDashboardData>(this.vehicleSessionsService.getGeographicalAnalysisDashboardData({
                    dateFrom: dateFrom.toISOString(),
                    dateTo  : dateTo.toISOString()
                }));
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return {
                    totalGpsPoints                   : {count: 0},
                    maxSpeed                         : {maxSpeedKmh: 0, sessionId: '', driverId: '', vehicleId: '', timestamp: ''},
                    averageDistance                  : {averageKm: 0},
                    mostVisitedAreas                 : {areas: []},
                    speedDistributionChart           : {data: []},
                    sessionStartTimeDistributionChart: {data: []},
                    sessionEndTimeDistributionChart  : {data: []},
                    heatMapData                      : {points: []},
                    frequentRoutesData               : {routes: []}
                };
            }
        }
    });

    // Computed metrics from dashboard data
    totalGpsPoints = computed(() => this.dashboardResource.value()?.totalGpsPoints.count || 0);
    maxSpeed = computed(() => this.dashboardResource.value()?.maxSpeed.maxSpeedKmh || 0);
    averageDistance = computed(() => this.dashboardResource.value()?.averageDistance.averageKm || 0);

    // Computed areas from dashboard data
    mostVisitedAreas = computed(() => this.dashboardResource.value()?.mostVisitedAreas.areas || []);

    // Chart data from dashboard data
    speedDistributionChart = computed(() => {
        const chartData = this.dashboardResource.value()?.speedDistributionChart;
        if (!chartData || !chartData.data || chartData.data.length === 0) return null;

        return {
            series     : [ {
                name: 'Puntos GPS',
                data: chartData.data.map(item => item.count)
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
                categories: chartData.data.map(item => item.range),
                labels    : {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis      : {
                title: {
                    text: 'Número de puntos GPS'
                }
            },
            tooltip    : {
                theme: 'dark',
                y    : {
                    formatter: (val) => {
                        return `${ val } puntos`;
                    }
                }
            }
        } as ApexOptions;
    });

    sessionStartTimeDistributionChart = computed(() => {
        const chartData = this.dashboardResource.value()?.sessionStartTimeDistributionChart;
        if (!chartData || !chartData.data || chartData.data.length === 0) return null;

        return {
            series     : [ {
                name: 'Inicios de Sesión',
                data: chartData.data.map(item => item.count)
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
                categories: chartData.data.map(item => item.label),
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

    sessionEndTimeDistributionChart = computed(() => {
        const chartData = this.dashboardResource.value()?.sessionEndTimeDistributionChart;
        if (!chartData || !chartData.data || chartData.data.length === 0) return null;

        return {
            series     : [ {
                name: 'Finalizaciones de Sesión',
                data: chartData.data.map(item => item.count)
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
                categories: chartData.data.map(item => item.label),
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

    clearFilters(): void {
        this.dateFromControl.setValue(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        this.dateToControl.setValue(new Date());
        this.dashboardResource.reload();
    }

    reloadData(): void {
        this.dashboardResource.reload();
    }
}
