import { Component, inject, resource, signal, WritableSignal } from '@angular/core';
import { CommonModule }                                        from '@angular/common';
import { FormControl, ReactiveFormsModule }                    from '@angular/forms';
import { MatButtonModule }                                     from '@angular/material/button';
import { MatFormFieldModule }                                  from '@angular/material/form-field';
import { MatIconModule }                                       from '@angular/material/icon';
import { MatInputModule }                                      from '@angular/material/input';
import { MatSelectModule }                                     from '@angular/material/select';
import { MatDatepickerModule }                                 from '@angular/material/datepicker';
import { MatNativeDateModule }                                 from '@angular/material/core';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { ApexOptions, ChartComponent }                         from 'ng-apexcharts';
import { FuelRecordsService }                                  from '@modules/admin/logistics/fuel-management/services/fuel-records.service';
import { FuelConsumptionByPeriod, FuelConsumptionSummary }     from '@modules/admin/logistics/fuel-management/domain/model/fuel-record.model';
import { firstValueFrom }                                      from 'rxjs';
import { toSignal }                                            from '@angular/core/rxjs-interop';
import { debounceTime }                                        from 'rxjs/operators';
import { NotyfService }                                        from '@shared/services/notyf.service';
import { MatProgressSpinner }                                  from '@angular/material/progress-spinner';
import { VehicleSelectorComponent }                            from '@shared/controls/components/vehicle-selector/vehicle-selector.component';

// Mock service for vehicles - replace with actual service when available
class VehicleService {
    getVehicles() {
        return Promise.resolve({
            items: [
                {
                    id          : 'v1',
                    brand       : 'Toyota',
                    model       : 'Corolla',
                    licensePlate: 'ABC-123'
                },
                {
                    id          : 'v2',
                    brand       : 'Honda',
                    model       : 'Civic',
                    licensePlate: 'XYZ-789'
                }
            ]
        });
    }
}

@Component({
    selector   : 'app-analysis',
    standalone : true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        PageHeaderComponent,
        ChartComponent,
        MatProgressSpinner,
        VehicleSelectorComponent
    ],
    providers  : [
        {provide: VehicleService, useClass: VehicleService} // Replace with actual service
    ],
    templateUrl: './analysis.component.html'
})
export class AnalysisComponent {
    private readonly fuelRecordsService = inject(FuelRecordsService);
    private readonly vehicleService = inject(VehicleService);
    private readonly notyf = inject(NotyfService);

    // Filters
    dateFromControl = new FormControl<Date>(null);
    dateFromSignal = toSignal(this.dateFromControl.valueChanges.pipe(debounceTime(300)), {initialValue: null});

    dateToControl = new FormControl<Date>(null);
    dateToSignal = toSignal(this.dateToControl.valueChanges.pipe(debounceTime(300)), {initialValue: null});

    vehicleControl = new FormControl<string>('');
    vehicleSignal = toSignal(this.vehicleControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    // Charts
    chartConsumptionByPeriod: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartEfficiencyByPeriod: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartCostByPeriod: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartConsumptionByVehicle: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartEfficiencyByVehicle: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartCostPerKmByVehicle: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);

    // Data
    vehicles = signal<any[]>([]);
    isLoading = signal(false);

    // Analysis resource
    analysisResource = resource({
        request: () => ({
            dateFrom : this.dateFromSignal(),
            dateTo   : this.dateToSignal(),
            vehicleId: this.vehicleSignal()
        }),
        loader : async ({request}) => {
            try {
                this.isLoading.set(true);

                // Apply filters
                let params: any = {};

                if (request.dateFrom) {
                    params.startDate = request.dateFrom.toISOString();
                }

                if (request.dateTo) {
                    params.endDate = request.dateTo.toISOString();
                }

                if (request.vehicleId) {
                    params.vehicleId = request.vehicleId;
                }

                // Get consumption data
                const consumptionByPeriod = await firstValueFrom(this.fuelRecordsService.getFuelConsumptionByPeriod(params));
                const consumptionSummary = await firstValueFrom(this.fuelRecordsService.getFuelConsumptionSummary(params));

                // Set chart data
                this.setChartConsumptionByPeriod(consumptionByPeriod);
                this.setChartEfficiencyByPeriod(consumptionByPeriod);
                this.setChartCostByPeriod(consumptionByPeriod);
                this.setChartConsumptionByVehicle(consumptionSummary);
                this.setChartEfficiencyByVehicle(consumptionSummary);
                this.setChartCostPerKmByVehicle(consumptionSummary);

                this.isLoading.set(false);

                return {
                    consumptionByPeriod,
                    consumptionSummary
                };
            } catch (error) {
                console.error('Error loading analysis data:', error);
                this.notyf.error('Error al cargar los datos de análisis');
                this.isLoading.set(false);
                return {
                    consumptionByPeriod: [],
                    consumptionSummary : []
                };
            }
        }
    });

    constructor() {
        this.loadVehicles();
    }

    async loadVehicles(): Promise<void> {
        try {
            const result = await this.vehicleService.getVehicles();
            this.vehicles.set(result.items);
        } catch (error) {
            this.notyf.error('Error al cargar los vehículos');
        }
    }

    clearFilters(): void {
        this.dateFromControl.setValue(null);
        this.dateToControl.setValue(null);
        this.vehicleControl.setValue('');
        this.analysisResource.reload();
    }

    // Chart setters
    setChartConsumptionByPeriod(data: FuelConsumptionByPeriod[]): void {
        const labels = data.map(item => item.period);
        const series = [ {
            name: 'Litros',
            data: data.map(item => item.totalLiters)
        } ];

        this.chartConsumptionByPeriod.set({
            chart  : {
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : '100%',
                width     : '100%',
                type      : 'line',
                zoom      : {enabled: false}
            },
            colors : [ '#34D399' ], // Verde
            grid   : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            markers: {
                size        : 4,
                colors      : [ '#34D399' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {size: 7, sizeOffset: 3}
            },
            noData : {text: 'No hay datos'},
            series : series,
            stroke : {
                width: 2,
                curve: 'smooth'
            },
            tooltip: {theme: 'dark'},
            xaxis  : {
                type      : 'category',
                categories: labels
            },
            yaxis  : {
                title : {text: 'Litros de combustible'},
                labels: {
                    formatter(val: number): string {
                        return val.toFixed(1) + ' L';
                    }
                }
            }
        });
    }

    setChartEfficiencyByPeriod(data: FuelConsumptionByPeriod[]): void {
        const labels = data.map(item => item.period);
        const series = [ {
            name: 'Rendimiento',
            data: data.map(item => item.averageEfficiency)
        } ];

        this.chartEfficiencyByPeriod.set({
            chart  : {
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : '100%',
                width     : '100%',
                type      : 'line',
                zoom      : {enabled: false}
            },
            colors : [ '#60A5FA' ], // Azul
            grid   : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            markers: {
                size        : 4,
                colors      : [ '#60A5FA' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {size: 7, sizeOffset: 3}
            },
            noData : {text: 'No hay datos'},
            series : series,
            stroke : {
                width: 2,
                curve: 'smooth'
            },
            tooltip: {theme: 'dark'},
            xaxis  : {
                type      : 'category',
                categories: labels
            },
            yaxis  : {
                title : {text: 'Rendimiento (km/l)'},
                labels: {
                    formatter(val: number): string {
                        return val.toFixed(2) + ' km/l';
                    }
                }
            }
        });
    }

    setChartCostByPeriod(data: FuelConsumptionByPeriod[]): void {
        const labels = data.map(item => item.period);
        const series = [ {
            name: 'Costo',
            data: data.map(item => item.totalCost)
        } ];

        this.chartCostByPeriod.set({
            chart  : {
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : '100%',
                width     : '100%',
                type      : 'line',
                zoom      : {enabled: false}
            },
            colors : [ '#F87171' ], // Rojo
            grid   : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            markers: {
                size        : 4,
                colors      : [ '#F87171' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {size: 7, sizeOffset: 3}
            },
            noData : {text: 'No hay datos'},
            series : series,
            stroke : {
                width: 2,
                curve: 'smooth'
            },
            tooltip: {theme: 'dark'},
            xaxis  : {
                type      : 'category',
                categories: labels
            },
            yaxis  : {
                title : {text: 'Costo ($)'},
                labels: {
                    formatter(val: number): string {
                        return new Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val);
                    }
                }
            }
        });
    }

    setChartConsumptionByVehicle(data: FuelConsumptionSummary[]): void {
        const labels = data.map(item => `${ item.vehicle.brand } ${ item.vehicle.model } (${ item.vehicle.licensePlate })`);
        const series = [ {
            name: 'Litros',
            data: data.map(item => item.totalLiters)
        } ];

        this.chartConsumptionByVehicle.set({
            chart      : {
                type      : 'bar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#4ADE80' ], // Verde
            dataLabels: {
                enabled: true,
                formatter(val: string | number | number[], opts?: any): string | number | string[] {
                    return val + ' L';
                }
            },
            grid       : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            noData     : {text: 'No hay datos'},
            plotOptions: {
                bar: {horizontal: false}
            },
            series     : series,
            tooltip    : {theme: 'dark'},
            xaxis      : {categories: labels},
            yaxis      : {
                title : {text: 'Litros totales'},
                labels: {
                    formatter(val: number): string {
                        return val.toFixed(1) + ' L';
                    }
                }
            }
        });
    }

    setChartEfficiencyByVehicle(data: FuelConsumptionSummary[]): void {
        const labels = data.map(item => `${ item.vehicle.brand } ${ item.vehicle.model } (${ item.vehicle.licensePlate })`);
        const series = data.map(item => item.averageEfficiency);

        this.chartEfficiencyByVehicle.set({
            chart  : {
                type      : 'donut',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors : [ '#F87171', '#FBBF24', '#60A5FA', '#34D399', '#4ADE80', '#F59E0B' ],
            labels : labels,
            legend : {position: 'bottom'},
            noData : {text: 'No hay datos'},
            series : series,
            tooltip: {
                theme: 'dark',
                y    : {
                    formatter: (val: number) => val.toFixed(2) + ' km/l'
                }
            }
        });
    }

    setChartCostPerKmByVehicle(data: FuelConsumptionSummary[]): void {
        const labels = data.map(item => `${ item.vehicle.brand } ${ item.vehicle.model } (${ item.vehicle.licensePlate })`);
        const series = [ {
            name: 'Costo por km',
            data: data.map(item => item.averageCostPerKm)
        } ];

        this.chartCostPerKmByVehicle.set({
            chart      : {
                type      : 'bar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#FBBF24' ], // Amarillo
            dataLabels: {
                enabled: true,
                formatter(val: string | number | number[], opts?: any): string | number | string[] {
                    return '$' + val + '/km';
                }
            },
            grid       : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            noData     : {text: 'No hay datos'},
            plotOptions: {
                bar: {horizontal: true}
            },
            series     : series,
            tooltip    : {theme: 'dark'},
            xaxis      : {
                categories: labels,
                labels    : {
                    formatter: (val: string) => '$' + val + '/km'
                }
            },
            yaxis      : {
                title: {text: 'Costo por kilómetro'}
            }
        });
    }
}
