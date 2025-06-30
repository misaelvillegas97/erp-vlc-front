import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                 from '@angular/common';
import { MatIconModule }                                from '@angular/material/icon';
import { MatButtonModule }                              from '@angular/material/button';
import { MatProgressSpinnerModule }                     from '@angular/material/progress-spinner';
import { FuelPricesData, FuelPricesService }            from '../services/fuel-prices.service';
import { firstValueFrom, Subscription }                 from 'rxjs';
import { GeolocationService }                           from '@modules/admin/logistics/fleet-management/services/geolocation.service';

@Component({
    selector  : 'app-fuel-prices',
    standalone: true,
    imports   : [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ],
    styles    : [ `
        .writing-mode-vertical {
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
    ` ],
    template  : `
        <div class="flex flex-col">
            <div class="flex justify-between items-center mb-2">
                <div class="text-lg font-semibold">Precios de combustible</div>
                <div class="bg-green-900/30 text-green-500 text-xs font-bold px-2 py-0.5 rounded" *ngIf="fuelPrices">
                    Actualizado {{ lastUpdated }}
                </div>
            </div>

            <!-- Loading state -->
            <div class="flex justify-center items-center py-6" *ngIf="loading()">
                <mat-spinner [diameter]="36"></mat-spinner>
            </div>

            <!-- Error state -->
            <div class="text-center py-6 text-red-500" *ngIf="error">
                <p>{{ error }}</p>
                <button mat-button color="primary" class="mt-1" (click)="loadFuelPricesData()">
                    Reintentar
                </button>
            </div>

            <!-- Fuel prices data -->
            <ng-container *ngIf="fuelPrices && !loading() && !error">
                <!-- Compact summary section -->
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2 bg-blue-900/10 p-2 rounded-lg">
                    <!-- Price info -->
                    <div class="flex items-center gap-3">
                        <div class="flex items-center">
                            <span class="text-xs text-gray-400 mr-1">Promedio:</span>
                            <span class="text-sm font-bold text-green-500">{{ averagePrice }}</span>
                        </div>
                        <div class="flex items-center" [ngClass]="trendClass">
                            <span class="text-xs text-gray-400 mr-1">Tendencia:</span>
                            <mat-icon class="text-sm" [svgIcon]="trendIcon"></mat-icon>
                            <span class="text-sm font-bold">{{ trendText }}</span>
                        </div>
                    </div>

                    <!-- Compact fuel type legend -->
                    <div class="flex items-center gap-2 text-xs">
                        <span class="text-gray-400">Combustibles:</span>
                        <div class="flex items-center gap-2">
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                                93
                            </div>
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                95
                            </div>
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
                                97
                            </div>
                            <div class="flex items-center">
                                <div class="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                                Diesel
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Compact station cards -->
                <div class="space-y-2">
                    <div class="bg-blue-900/10 rounded-lg p-2" *ngFor="let station of stations">
                        <!-- Use grid layout with fixed columns for consistent alignment -->
                        <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            <!-- Station info - fixed width column -->
                            <div class="flex items-center col-span-1 md:col-span-4">
                                <div class="w-8 h-8 bg-blue-900/20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                    <mat-icon class="text-blue-500 text-sm" svgIcon="mat_solid:local_gas_station"></mat-icon>
                                </div>
                                <div class="overflow-hidden">
                                    <div class="font-medium text-sm truncate">{{ station.name }}</div>
                                    <div class="text-xs text-gray-400 truncate">{{ station.distance }} km • {{ station.address }}</div>
                                </div>
                            </div>

                            <!-- Fuel prices in card-like format - fixed width column -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 col-span-1 md:col-span-8">
                                <ng-container *ngFor="let price of station.formattedPrices">
                                    <div class="rounded-lg shadow-sm flex items-center justify-between p-0 overflow-hidden border-l-4"
                                         [ngClass]="{
                                            'bg-blue-900/30 border-blue-500': price.fuelType === '93',
                                            'bg-green-900/30 border-green-500': price.fuelType === '95',
                                            'bg-purple-900/30 border-purple-500': price.fuelType === '97',
                                            'bg-yellow-900/30 border-yellow-500': price.fuelType === 'Diesel'
                                         }">
                                        <div class="h-full flex items-center justify-center px-1.5 py-2">
                                            <div class="text-xs font-bold writing-mode-vertical transform rotate-180"
                                                 [ngClass]="{
                                                    'text-blue-500': price.fuelType === '93',
                                                    'text-green-500': price.fuelType === '95',
                                                    'text-purple-500': price.fuelType === '97',
                                                    'text-yellow-500': price.fuelType === 'Diesel'
                                                 }">{{ price.fuelType }}
                                            </div>
                                        </div>
                                        <div class="flex-grow h-full flex items-center justify-center px-2 py-2 bg-gray-800/30">
                                            <div class="text-base font-bold">{{ price.formattedPrice }}</div>
                                        </div>
                                    </div>
                                </ng-container>
                            </div>
                        </div>
                    </div>
                </div>

                <button mat-button color="primary" class="mt-2 self-end text-xs">
                    <mat-icon class="text-sm" svgIcon="mat_solid:map"></mat-icon>
                    Ver todas las gasolineras
                </button>
            </ng-container>
        </div>
    `
})
export class FuelPricesComponent implements OnInit, OnDestroy {
    readonly #geoLocationService = inject(GeolocationService);
    readonly #fuelPricesService = inject(FuelPricesService);
    fuelPrices = signal<FuelPricesData>(null);
    loading = signal(true);
    error: string | null = null;
    private subscription: Subscription | null = null;

    // Formatted data for template
    stations: any[] = [];
    averagePrice: string = '';
    trendText: string = '';
    trendIcon: string = '';
    trendClass: any = {};
    lastUpdated: string = '';

    ngOnInit(): void {
        this.loadFuelPricesData();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    async loadFuelPricesData(): Promise<void> {
        this.loading.set(true);
        this.error = null;

        // Load user location
        const coordinates = await firstValueFrom(this.#geoLocationService.getCurrentPosition());

        // Use the mock data for now, but in production we would use getFuelPrices with actual coordinates
        this.subscription = this.#fuelPricesService.getFuelPrices(coordinates.latitude, coordinates.longitude).subscribe({
            next : (data) => {
                this.fuelPrices.set(data);
                this.formatData();
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading fuel prices data:', err);
                this.error = 'No se pudo cargar la información de precios de combustible. Por favor, intente de nuevo más tarde.';
                this.loading.set(false);
            }
        });
    }

    formatData(): void {
        if (!this.fuelPrices) return;

        // Format stations
        this.stations = this.fuelPrices().stations.map(station => {
            // Format each price in the prices array
            const formattedPrices = station.prices.map(price => ({
                ...price,
                formattedPrice: `$${ price.price.toFixed(0) }`
            }));

            return {
                ...station,
                formattedPrices,
                showAllPrices: false // Initialize collapsed state for expandable section
            };
        });

        // Format average price
        this.averagePrice = `$${ this.fuelPrices().averagePrice.toFixed(2) }`;

        // Format trend
        const trend = this.fuelPrices().weeklyTrend;
        this.trendText = `${ trend.increasing ? '+' : '-' }${ trend.percentage.toFixed(1) }%`;
        this.trendIcon = trend.increasing ? 'mat_solid:arrow_upward' : 'mat_solid:arrow_downward';
        this.trendClass = {
            'text-red-400'  : trend.increasing,
            'text-green-400': !trend.increasing
        };

        // Format last updated
        this.lastUpdated = this.getTimeAgo(this.fuelPrices().lastUpdated);
    }

    /**
     * Get the best (lowest) price for a station
     * @param station The station object
     * @returns The formatted price object with the lowest price
     */
    getBestPrice(station: any): any {
        if (!station.formattedPrices || station.formattedPrices.length === 0) {
            return {fuelType: 'N/A', formattedPrice: '$0.00'};
        }

        // Find the price with the lowest value
        return station.formattedPrices.reduce((best, current) => {
            return current.price < best.price ? current : best;
        }, station.formattedPrices[0]);
    }

    getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 60) {
            return 'hace unos minutos';
        } else if (diffMins < 120) {
            return 'hace 1 hora';
        } else if (diffMins < 24 * 60) {
            return `hace ${ Math.floor(diffMins / 60) } horas`;
        } else {
            return 'hoy';
        }
    }
}
