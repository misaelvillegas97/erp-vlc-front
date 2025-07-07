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
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 shadow-sm border border-blue-100 dark:border-slate-700"><!-- border border-blue-100 dark:border-slate-700 -->
            <!-- Loading state -->
            <div class="flex items-center justify-center py-6" *ngIf="loading()">
                <mat-spinner [diameter]="24"></mat-spinner>
            </div>

            <!-- Error state -->
            <div class="text-center py-4" *ngIf="error && !loading()">
                <mat-icon class="text-red-400 mb-2">warning</mat-icon>
                <p class="text-sm text-red-600 dark:text-red-400 mb-2">Error al cargar clima</p>
                <button mat-button (click)="loadWeatherData()" class="">
                    Reintentar
                </button>
            </div>

            <!-- Weather data -->
            <ng-container *ngIf="weather() && !loading() && !error">
                <!-- Header compacto -->
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Clima Actual</h3>
                    <span class="text-xs text-gray-500 bg-white/60 dark:bg-slate-700/60 px-2 py-1 rounded-full">
                        {{ getTimeAgo(weather().current.lastUpdated) }}
                    </span>
                </div>

                <!-- Información principal -->
                <div class="flex items-center space-x-4 mb-4">
                    <!-- Icono y temperatura -->
                    <div class="flex items-center space-x-2">
                        <div class="w-12 h-12 flex items-center justify-center bg-white/70 dark:bg-slate-700/70 rounded-lg">
                            <mat-icon class="text-2xl text-yellow-500" [svgIcon]="weather().current.icon"></mat-icon>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-gray-800 dark:text-white">{{ weather().current.temperature }}°</div>
                            <div class=" text-gray-500 dark:text-gray-400">{{ weather().current.condition }}</div>
                        </div>
                    </div>

                    <!-- Información adicional -->
                    <div class="flex-1 text-right space-y-1">
                        <div class=" text-gray-600 dark:text-gray-400">{{ weather().current.location }}</div>
                        <div class=" text-gray-500 dark:text-gray-500">ST: {{ weather().current.feelsLike }}°</div>
                    </div>
                </div>

                <!-- Pronóstico por horas (compacto) -->
                <div class="grid grid-cols-4 gap-1 mb-3">
                    @for (forecast of weather().hourly; track forecast.time) {
                        <div class="text-center p-2 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                            <div class=" text-gray-500 mb-1">{{ forecast.time }}</div>
                            <mat-icon class="text-sm text-blue-500 mb-1" [svgIcon]="forecast.icon"></mat-icon>
                            <div class=" font-medium">{{ forecast.temperature }}°</div>
                        </div>
                    }
                </div>

                <!-- Detalles compactos -->
                <div class="flex items-center justify-between  text-gray-600 dark:text-gray-400">
                    <div class="flex items-center space-x-3">
                        <span class="flex items-center">
                            <mat-icon class="text-sm mr-1">opacity</mat-icon>
                            {{ weather().current.humidity }}%
                        </span>
                        <span class="flex items-center">
                            <mat-icon class="text-sm mr-1">air</mat-icon>
                            {{ weather().current.windSpeed }}km/h
                        </span>
                    </div>
                    <button mat-button class=" h-6 min-h-0 px-2" (click)="showFullForecast()">
                        <mat-icon class="text-sm">expand_more</mat-icon>
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

    showFullForecast(): void {
        // Implementar navegación al pronóstico completo
        console.log('Mostrar pronóstico completo');
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
