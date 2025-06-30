import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                 from '@angular/common';
import { MatIconModule }                                from '@angular/material/icon';
import { MatButtonModule }                              from '@angular/material/button';
import { MatProgressSpinnerModule }                     from '@angular/material/progress-spinner';
import { WeatherForecast, WeatherService }              from '../services/weather.service';
import { firstValueFrom, Subscription }                 from 'rxjs';
import { GeolocationService }                           from '@modules/admin/logistics/fleet-management/services/geolocation.service';

@Component({
    selector  : 'app-weather-widget',
    standalone: true,
    imports   : [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ],
    template  : `
        <div class="flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <div class="text-lg font-semibold">Clima actual</div>
                <div class="bg-blue-900/30 text-blue-500 text-sm font-bold px-2 py-1 rounded" *ngIf="weather()">
                    Actualizado {{ getTimeAgo(weather().current.lastUpdated) }}
                </div>
            </div>

            <!-- Loading state -->
            <div class="flex justify-center items-center py-8" *ngIf="loading()">
                <mat-spinner [diameter]="40"></mat-spinner>
            </div>

            <!-- Error state -->
            <div class="text-center py-8 text-red-500" *ngIf="error">
                <p>{{ error }}</p>
                <button mat-button color="primary" class="mt-2" (click)="loadWeatherData()">
                    Reintentar
                </button>
            </div>

            <!-- Weather data -->
            <ng-container *ngIf="weather() && !loading() && !error">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="w-16 h-16 flex items-center justify-center mr-4">
                            <mat-icon class="text-5xl text-yellow-500" [svgIcon]="weather().current.icon"></mat-icon>
                        </div>
                        <div>
                            <div class="text-3xl font-bold">{{ weather().current.temperature }}°C</div>
                            <div class="text-sm text-gray-400">{{ weather().current.condition }}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-400">{{ weather().current.location }}</div>
                        <div class="text-xs text-gray-500">Sensación térmica: {{ weather().current.feelsLike }}°C</div>
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-2 mb-4">
                    <div class="text-center p-2 bg-blue-900/20 rounded-lg" *ngFor="let forecast of weather().hourly">
                        <div class="text-xs text-gray-400">{{ forecast.time }}</div>
                        <mat-icon [svgIcon]="forecast.icon"></mat-icon>
                        <div class="text-sm font-bold">{{ forecast.temperature }}°C</div>
                    </div>
                </div>

                <div class="flex justify-between items-center">
                    <div>
                        <div class="flex items-center mb-1">
                            <mat-icon class="text-blue-500 mr-1 text-sm" svgIcon="mat_solid:opacity"></mat-icon>
                            <span class="text-sm">Humedad: {{ weather().current.humidity }}%</span>
                        </div>
                        <div class="flex items-center">
                            <mat-icon class="text-blue-500 mr-1 text-sm" svgIcon="mat_solid:air"></mat-icon>
                            <span class="text-sm">Viento: {{ weather().current.windSpeed }} km/h</span>
                        </div>
                    </div>
                    <button mat-button color="primary">
                        <mat-icon svgIcon="mat_solid:map"></mat-icon>
                        Ver pronóstico completo
                    </button>
                </div>
            </ng-container>
        </div>
    `
})
export class WeatherWidgetComponent implements OnInit, OnDestroy {
    readonly #geoService = inject(GeolocationService);
    weather = signal<WeatherForecast>(null);
    loading = signal<boolean>(true);
    error: string | null = null;
    private subscription: Subscription | null = null;

    constructor(private weatherService: WeatherService) {}

    ngOnInit(): void {
        this.loadWeatherData();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    async loadWeatherData(): Promise<void> {
        this.loading.set(true);
        this.error = null;

        const coordinates = await firstValueFrom(this.#geoService.getCurrentPosition());

        this.weatherService.getWeatherForecast(coordinates.latitude, coordinates.longitude)
            .then((data) => {
                this.weather.set(data);
                this.loading.set(false);
            })
            .catch((err) => {
                console.error('Error loading weather data:', err);
                this.error = 'No se pudo cargar la información del clima. Por favor, intente de nuevo más tarde.';

                // Fallback to mock data if API call fails
                this.weatherService.getMockWeatherData().subscribe({
                    next : (mockData) => {
                        this.weather.set(mockData);
                        this.loading.set(false);
                        this.error = null;
                    },
                    error: () => {
                        this.loading.set(false);
                    }
                });
            });
    }

    getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 1) {
            return 'hace unos segundos';
        } else if (diffMins === 1) {
            return 'hace 1 minuto';
        } else if (diffMins < 60) {
            return `hace ${ diffMins } minutos`;
        } else if (diffMins < 120) {
            return 'hace 1 hora';
        } else {
            return `hace ${ Math.floor(diffMins / 60) } horas`;
        }
    }
}
