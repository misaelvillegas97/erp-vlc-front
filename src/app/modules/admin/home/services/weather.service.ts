import { inject, Injectable }                  from '@angular/core';
import { HttpClient }                          from '@angular/common/http';
import { firstValueFrom, map, Observable, of } from 'rxjs';
import { GeolocationService }                  from '@modules/admin/logistics/fleet-management/services/geolocation.service';

export interface WeatherData {
    location: string;
    temperature: number;
    feelsLike: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    lastUpdated: Date;
}

export interface ForecastItem {
    time: string;
    temperature: number;
    condition: string;
    icon: string;
}

export interface WeatherForecast {
    current: WeatherData;
    hourly: ForecastItem[];
}

// Open-Meteo API response interfaces
export interface OpenMeteoResponse {
    latitude: number;
    longitude: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    current_units: CurrentUnits;
    current: CurrentWeather;
    hourly_units: HourlyUnits;
    hourly: HourlyWeather;
}

export interface CurrentUnits {
    time: string;
    interval: string;
    temperature_2m: string;
    is_day: string;
    precipitation: string;
    relative_humidity_2m: string;
    apparent_temperature: string;
}

export interface CurrentWeather {
    time: string;
    interval: number;
    temperature_2m: number;
    is_day: number;
    precipitation: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
}

export interface HourlyUnits {
    time: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    precipitation_probability: string;
    rain: string;
    precipitation: string;
}

export interface HourlyWeather {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    rain: number[];
    precipitation: number[];
}

@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    // Open-Meteo API doesn't require an API key
    readonly #geoService = inject(GeolocationService);
    private apiUrl = 'https://api.open-meteo.com/v1/forecast';

    constructor(private http: HttpClient) {}

    async getWeatherForecast(latitude: number = -38.7396, longitude: number = -72.5984): Promise<WeatherForecast> {
        // Construct URL with required parameters for Open-Meteo API
        const url = `${ this.apiUrl }?latitude=${ latitude }&longitude=${ longitude }&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,rain,precipitation&current=temperature_2m,is_day,precipitation,relative_humidity_2m,apparent_temperature&timezone=auto&forecast_days=1`;

        const weather = await firstValueFrom(this.http.get<OpenMeteoResponse>(url).pipe(map(response => this.transformWeatherData(response))));
        const city = await firstValueFrom(this.#geoService.getCurrentCity(latitude, longitude));

        return {
            ...weather,
            current: {
                ...weather.current,
                location: city || weather.current.location
            }
        };
    }

    private transformWeatherData(response: OpenMeteoResponse): WeatherForecast {
        if (!response || !response.current || !response.hourly) {
            throw new Error('Invalid weather data received');
        }

        // Get location from timezone
        const location = response.timezone.split('/').pop()?.replace('_', ' ') || 'Unknown Location';

        // Determine weather condition based on precipitation and is_day
        const condition = this.getWeatherCondition(response.current.precipitation, response.current.is_day);

        // Transform current weather
        const currentWeather: WeatherData = {
            location,
            temperature: Math.round(response.current.temperature_2m),
            feelsLike  : Math.round(response.current.apparent_temperature),
            condition,
            icon       : this.getWeatherIconFromCondition(condition, response.current.is_day),
            humidity   : response.current.relative_humidity_2m,
            windSpeed  : 0, // Wind speed not available in current data
            lastUpdated: new Date()
        };

        const hourlyForecast: ForecastItem[] = [];

        // Get current hour
        const currentHour = new Date().getHours();

        let startIndex = -1;
        for (let i = 0; i < response.hourly.time.length; i++) {
            const timeHour = new Date(response.hourly.time[i]).getHours();
            if (timeHour >= currentHour) {
                startIndex = i;
                break;
            }
        }

        // If we couldn't find a starting index, use 0
        if (startIndex === -1) {
            startIndex = 0;
        }

        // Only process up to 4 time slots from the starting index
        // const endIndex = Math.min(startIndex + 24, response.hourly.time.length);

        for (let i = startIndex; i < response.hourly.time.length; i++) {
            const time = new Date(response.hourly.time[i]);
            const hourCondition = this.getWeatherCondition(
                response.hourly.precipitation[i],
                time.getHours() >= 6 && time.getHours() < 18 ? 1 : 0 // Assume day between 6am and 6pm
            );

            hourlyForecast.push({
                time       : time.getHours() + ':00',
                temperature: Math.round(response.hourly.temperature_2m[i]),
                condition  : hourCondition,
                icon       : this.getWeatherIconFromCondition(hourCondition, time.getHours() >= 6 && time.getHours() < 18 ? 1 : 0)
            });
        }

        return {
            current: currentWeather,
            hourly : hourlyForecast
        };
    }

    private getWeatherCondition(precipitation: number, isDay: number): string {
        if (precipitation > 5) {
            return 'Lluvia intensa';
        } else if (precipitation > 0) {
            return 'Lluvia ligera';
        } else {
            return isDay ? 'Soleado' : 'Despejado';
        }
    }

    private getWeatherIconFromCondition(condition: string, isDay: number): string {
        // Map condition to Material icons
        if (condition.includes('Lluvia')) {
            return 'mat_solid:rainy';
        } else if (isDay) {
            return 'mat_solid:wb_sunny';
        } else {
            return 'mat_solid:nightlight_round';
        }
    }

    // Fallback method to get mock data when API is not available
    getMockWeatherData(): Observable<WeatherForecast> {
        // Mock data based on Open-Meteo API format
        // Get current hour to generate appropriate mock data
        const currentHour = new Date().getHours();

        // Create mock hourly forecast for the next 4 hours
        const mockHourly: ForecastItem[] = [];
        for (let i = 0; i < 4; i++) {
            const forecastHour = (currentHour + i) % 24;
            const isDaytime = forecastHour >= 6 && forecastHour < 18;

            mockHourly.push({
                time       : `${ forecastHour }:00`,
                temperature: isDaytime ? Math.round(Math.random() * 10) : Math.round(Math.random() * 5) - 5, // Warmer during day
                condition  : isDaytime ? 'Soleado' : 'Despejado',
                icon       : isDaytime ? 'mat_solid:wb_sunny' : 'mat_solid:nightlight_round'
            });
        }

        const mockData: WeatherForecast = {
            current: {
                location   : 'Santiago',
                temperature: -3,
                feelsLike  : -6,
                condition  : 'Despejado',
                icon       : 'mat_solid:nightlight_round',
                humidity   : 72,
                windSpeed  : 5,
                lastUpdated: new Date()
            },
            hourly : mockHourly
        };

        return of(mockData);
    }
}
