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
                @if (fuelPrices()) {
                    <div class="bg-green-900/30 text-green-500 text-xs font-bold px-2 py-0.5 rounded">
                        Actualizado {{ lastUpdated() }}
                    </div>
                }
            </div>

            <!-- Loading state -->
            @if (loading()) {
                <div class="flex justify-center items-center py-6">
                    <mat-spinner [diameter]="36"></mat-spinner>
                </div>
            }

            <!-- Error state -->
            @if (error()) {
                <div class="text-center py-6 text-red-500">
                    <p>{{ error() }}</p>
                    <button mat-button color="primary" class="mt-1" (click)="loadFuelPricesData()">
                        Reintentar
                    </button>
                </div>
            }

            <!-- Fuel prices data -->
            @if (fuelPrices() && !loading() && !error()) {
                <!-- Compact summary section -->
                <div class="flex flex-wrap items-center justify-between gap-1 mb-2 bg-blue-900/10 dark:bg-blue-950/20 p-1.5 rounded-lg text-xs">
                    <!-- Price info -->
                    <div class="flex items-center gap-2">
                        <div class="flex items-center">
                            <span class="text-gray-400 dark:text-gray-300 mr-0.5">Promedio:</span>
                            <span class="font-bold text-green-500 dark:text-green-400">{{ averagePrice() }}</span>
                        </div>
                        <div class="flex items-center"
                             [class.text-red-400]="trendClass()['text-red-400']"
                             [class.text-green-400]="trendClass()['text-green-400']"
                             [class.dark:text-red-300]="trendClass()['text-red-400']"
                             [class.dark:text-green-300]="trendClass()['text-green-400']">
                            <span class="text-gray-400 dark:text-gray-300 mr-0.5">Tendencia:</span>
                            <mat-icon class="text-xs h-4 w-4" [svgIcon]="trendIcon()"></mat-icon>
                            <span class="font-bold">{{ trendText() }}</span>
                        </div>
                    </div>

                    <!-- Compact fuel type legend -->
                    <div class="flex items-center gap-1">
                        <span class="text-gray-400 dark:text-gray-300">Combustibles:</span>
                        <div class="flex items-center gap-1">
                            <span class="flex items-center"><span class="inline-block w-2 h-2 rounded-full bg-blue-500 mr-0.5"></span>93</span>
                            <span class="flex items-center"><span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-0.5"></span>95</span>
                            <span class="flex items-center"><span class="inline-block w-2 h-2 rounded-full bg-purple-500 mr-0.5"></span>97</span>
                            <span class="flex items-center"><span class="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-0.5"></span>Diesel</span>
                        </div>
                    </div>
                </div>

                <!-- Compact station cards -->
                <div class="space-y-1">
                    @for (station of stations(); track station.name) {
                        <div class="bg-blue-900/10 dark:bg-blue-950/20 rounded-lg p-1.5">
                            <!-- Use grid layout with fixed columns for consistent alignment -->
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-1 items-center">
                                <!-- Station info - fixed width column -->
                                <div class="flex items-center col-span-1 md:col-span-6">
                                    <mat-icon class="text-blue-500 dark:text-blue-400 text-sm mr-1" svgIcon="mat_solid:local_gas_station"></mat-icon>
                                    <div class="overflow-hidden">
                                        <a [href]="getGoogleMapsUrl(station)" target="_blank" class="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer">
                                            <div class="font-medium text-sm truncate">{{ station.name }}</div>
                                            <div class="text-xs text-gray-400 dark:text-gray-300 truncate">{{ station.distance }} km • {{ station.address }}</div>
                                        </a>
                                    </div>
                                </div>

                                <!-- Fuel prices in card-like format - fixed width column -->
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 col-span-1 md:col-span-6">
                                    @for (price of station.formattedPrices; track price) {
                                        <div class="rounded border-l-4 flex items-center p-1 bg-gray-800/30 dark:bg-gray-900/50 overflow-hidden"
                                             [class.border-blue-500]="price.fuelType === '93'"
                                             [class.border-green-500]="price.fuelType === '95'"
                                             [class.border-purple-500]="price.fuelType === '97'"
                                             [class.border-yellow-500]="price.fuelType === 'Diesel'">
                                            <span class="text-base font-bold ml-auto">{{ price.formattedPrice }}</span>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>

                <button mat-button color="primary" class="mt-1 self-end text-xs">
                    <mat-icon class="text-sm h-4 w-4" svgIcon="mat_solid:map"></mat-icon>
                    Ver todas las gasolineras
                </button>
            }
        </div>
    `
})
export class FuelPricesComponent implements OnInit, OnDestroy {
    readonly #geoLocationService = inject(GeolocationService);
    readonly #fuelPricesService = inject(FuelPricesService);
    fuelPrices = signal<FuelPricesData>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    private subscription: Subscription | null = null;

    // Formatted data for template
    stations = signal<any[]>([]);
    averagePrice = signal<string>('');
    trendText = signal<string>('');
    trendIcon = signal<string>('');
    trendClass = signal<any>({});
    lastUpdated = signal<string>('');

    ngOnInit(): void {
        void this.loadFuelPricesData();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    async loadFuelPricesData(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);

        const coordinates = await firstValueFrom(this.#geoLocationService.getCurrentPosition());

        await firstValueFrom(this.#fuelPricesService.getFuelPrices(coordinates.latitude, coordinates.longitude))
            .then((data) => {
                this.fuelPrices.set(data);
                this.formatData();
                this.loading.set(false);
            }).catch((err) => {
                console.error('Error loading fuel prices data:', err);
                this.error.set('No se pudo cargar la información de precios de combustible. Por favor, intente de nuevo más tarde.');
                this.loading.set(false);
            })
    }

    formatData(): void {
        if (!this.fuelPrices()) return;

        // Format stations
        this.stations.set(this.fuelPrices().stations.map(station => {
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
        }));

        // Format average price
        this.averagePrice.set(`$${ this.fuelPrices().averagePrice.toFixed(2) }`);

        // Format trend
        const trend = this.fuelPrices().weeklyTrend;
        this.trendText.set(`${ trend.increasing ? '+' : '-' }${ trend.percentage.toFixed(1) }%`);
        this.trendIcon.set(trend.increasing ? 'mat_solid:arrow_upward' : 'mat_solid:arrow_downward');
        this.trendClass.set({
            'text-red-400'  : trend.increasing,
            'text-green-400': !trend.increasing
        });

        // Format last updated
        this.lastUpdated.set(this.getTimeAgo(this.fuelPrices().lastUpdated));
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

    /**
     * Generate a Google Maps URL for the given station
     * @param station The gas station object
     * @returns Google Maps URL with the station's coordinates
     */
    getGoogleMapsUrl(station: any): string {
        if (!station.latitude || !station.longitude) {
            return 'https://www.google.com/maps';
        }
        return `https://www.google.com/maps?q=${ station.latitude },${ station.longitude }`;
    }
}
