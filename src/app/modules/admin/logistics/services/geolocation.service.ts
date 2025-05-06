import { Injectable }                            from '@angular/core';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, map, tap }                  from 'rxjs/operators';
import { GeoLocation }                           from '../domain/model/vehicle-session.model';

@Injectable({
    providedIn: 'root'
})
export class GeolocationService {

    // Configuración del servicio de geolocalización
    private readonly geoOptions: PositionOptions = {
        enableHighAccuracy: true,   // Alta precisión (GPS)
        timeout           : 10000,             // 10 segundos de timeout
        maximumAge        : 30000           // Máximo 30 segundos de cache
    };

    // Stream de la última posición conocida
    private readonly _lastKnownPosition = new BehaviorSubject<GeoLocation | null>(null);
    public readonly lastKnownPosition$ = this._lastKnownPosition.asObservable();

    // Watchposition ID para poder cancelar el seguimiento
    private watchId: number | null = null;

    /**
     * Solicita permiso para acceder a la ubicación del usuario
     * @returns Observable<boolean> - true si el permiso fue concedido
     */
    public requestPermission(): Observable<boolean> {
        if (!this.isGeolocationAvailable()) {
            return of(false);
        }

        return from(new Promise<boolean>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                () => resolve(true),
                () => resolve(false),
                this.geoOptions
            );
        }));
    }

    /**
     * Obtiene la posición actual
     * @returns Observable<GeoLocation>
     */
    public getCurrentPosition(): Observable<GeoLocation> {
        if (!this.isGeolocationAvailable()) {
            return of(null);
        }

        return from(new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position),
                error => reject(error),
                this.geoOptions
            );
        })).pipe(
            map(position => this.mapToGeoLocation(position)),
            tap(location => this._lastKnownPosition.next(location)),
            catchError(error => {
                console.error('Error getting current position:', error);
                return of(null);
            })
        );
    }

    /**
     * Verifica si la geolocalización está disponible en el navegador
     * @returns boolean
     */
    public isGeolocationAvailable(): boolean {
        return 'geolocation' in navigator;
    }

    /**
     * Convierte una GeolocationPosition del navegador a nuestro modelo GeoLocation
     * @param position GeolocationPosition
     * @returns GeoLocation
     */
    private mapToGeoLocation(position: GeolocationPosition): GeoLocation {
        return {
            latitude : position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy : position.coords.accuracy,
            timestamp: position.timestamp
        };
    }
}
