import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                                          from '@angular/common';
import { MatButtonModule }                                                       from '@angular/material/button';
import { MatIconModule }                                                         from '@angular/material/icon';
import { MatProgressSpinnerModule }                                              from '@angular/material/progress-spinner';
import { MatCardModule }                                                         from '@angular/material/card';
import { RouterModule }                                                          from '@angular/router';
import { PageHeaderComponent }                                                   from '@layout/components/page-header/page-header.component';
import { VehicleSessionsService }                                                from '../../services/vehicle-sessions.service';
import { GeolocationService }                                                    from '../../services/geolocation.service';
import { LocationTrackingService, StoredLocationPoint }                          from '../../services/location-tracking.service';
import { DriversService }                                                        from '../../services/drivers.service';
import { VehiclesService }                                                       from '../../services/vehicles.service';
import { NotyfService }                                                          from '@shared/services/notyf.service';
import { of, Subject }                                                           from 'rxjs';
import { catchError, switchMap, takeUntil, tap }                                 from 'rxjs/operators';
import { ActiveSessionView, GeoLocation, VehicleSession }                        from '../../domain/model/vehicle-session.model';
import { Driver }                                                                from '../../domain/model/driver.model';
import { Vehicle }                                                               from '../../domain/model/vehicle.model';
import { environment }                                                           from 'environments/environment';
import { MatMenu, MatMenuItem, MatMenuTrigger }                                  from '@angular/material/menu';

@Component({
    selector       : 'app-driving-mode',
    standalone     : true,
    imports        : [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCardModule,
        RouterModule,
        PageHeaderComponent,
        MatMenu,
        MatMenuTrigger,
        MatMenuItem
    ],
    templateUrl    : './driving-mode.component.html',
    styleUrls      : [ './driving-mode.component.scss' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrivingModeComponent implements OnInit, OnDestroy {
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly driversService = inject(DriversService);
    private readonly vehiclesService = inject(VehiclesService);
    private readonly geolocationService = inject(GeolocationService);
    private readonly locationTrackingService = inject(LocationTrackingService);
    private readonly notyf = inject(NotyfService);

    private destroy$ = new Subject<void>();
    private updateInterval: number;

    // Signals para estado reactivo
    isLoading = signal(true);
    activeSessions = signal<ActiveSessionView[]>([]);
    currentSession = signal<VehicleSession | null>(null);
    driver = signal<Driver | null>(null);
    vehicle = signal<Vehicle | null>(null);
    currentLocation = signal<GeoLocation | null>(null);
    sessionStartTime = signal<Date | null>(null);
    elapsedTime = signal('00:00:00');
    storedLocationPoints = signal<StoredLocationPoint[]>([]);
    estimatedDistance = signal(0);
    averageSpeed = signal(0);
    isMobileDevice = signal(false);
    isTrackingActive = signal(false);
    trackingPointsCount = signal(0);
    mapUrl = signal('');

    // Para la vista de pantalla completa
    isFullScreen = signal(false);
    hasFullScreenSupport = signal(false);

    ngOnInit(): void {
        this.isMobileDevice.set(this.locationTrackingService.isMobileOrTablet());
        this.hasFullScreenSupport.set(Boolean(document.documentElement.requestFullscreen));

        // Cargar sesiones activas
        this.loadActiveSessions();

        // Actualizar ubicación actual
        this.geolocationService.getCurrentPosition()
            .pipe(takeUntil(this.destroy$))
            .subscribe(location => {
                if (location) {
                    this.currentLocation.set(location);
                    this.updateMap();
                }
            });

        // Suscribirse a actualizaciones de rastreo si es un dispositivo móvil
        if (this.isMobileDevice()) {
            this.locationTrackingService.isTracking$
                .pipe(takeUntil(this.destroy$))
                .subscribe(isTracking => {
                    this.isTrackingActive.set(isTracking);
                });

            this.locationTrackingService.storedPointsCount$
                .pipe(takeUntil(this.destroy$))
                .subscribe(count => {
                    this.trackingPointsCount.set(count);
                });
        }

        // Iniciar timer para actualizar el tiempo transcurrido
        this.updateInterval = window.setInterval(() => {
            this.updateElapsedTime();
            this.updateEstimatedDistance();
            this.updateMap();

            if (this.currentSession().id) this.loadStoredLocationPoints(this.currentSession().id);
        }, 1000);
    }

    ngOnDestroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadActiveSessions(): void {
        this.isLoading.set(true);

        this.sessionsService.getActiveSessions()
            .pipe(
                takeUntil(this.destroy$),
                tap(sessions => {
                    this.activeSessions.set(sessions);
                    // Si hay sesiones activas, cargar la primera por defecto
                    if (sessions.length > 0) {
                        this.selectSession(sessions[0].id);
                    } else {
                        this.isLoading.set(false);
                        this.notyf.info('No hay sesiones activas en este momento');
                    }
                }),
                catchError(error => {
                    console.error('Error loading active sessions', error);
                    this.notyf.error('Error al cargar sesiones activas');
                    this.isLoading.set(false);
                    return of(null);
                })
            ).subscribe();
    }

    selectSession(sessionId: string): void {
        this.isLoading.set(true);

        this.sessionsService.findById(sessionId)
            .pipe(
                takeUntil(this.destroy$),
                tap(session => {
                    this.currentSession.set(session);
                    this.sessionStartTime.set(new Date(session.startTimestamp));
                    this.updateElapsedTime();

                    this.locationTrackingService.startTracking(session.id);
                    this.notyf.success('Se ha iniciado el rastreo GPS en segundo plano');
                }),
                switchMap(session => {
                    // Cargar datos del conductor y vehículo en paralelo
                    return this.driversService.findById(session.driverId).pipe(
                        tap(driver => this.driver.set(driver)),
                        switchMap(() => this.vehiclesService.findById(session.vehicleId)),
                        tap(vehicle => this.vehicle.set(vehicle))
                    );
                }),
                tap(() => {
                    // Cargar puntos de ubicación desde IndexedDB
                    if (this.isMobileDevice()) {
                        this.loadStoredLocationPoints(sessionId);
                    }

                    this.updateMap();
                    this.isLoading.set(false);
                }),
                catchError(error => {
                    console.error('Error loading session details', error);
                    this.notyf.error('Error al cargar detalles de la sesión');
                    this.isLoading.set(false);
                    return of(null);
                })
            ).subscribe();
    }

    private async loadStoredLocationPoints(sessionId: string): Promise<void> {
        try {
            const points = await this.locationTrackingService.getLocationPoints(sessionId);
            this.storedLocationPoints.set(points);
            this.updateEstimatedDistance();
        } catch (error) {
            console.error('Error al cargar puntos de ubicación:', error);
        }
    }

    private updateElapsedTime(): void {
        if (!this.sessionStartTime()) {
            return;
        }

        const startTime = this.sessionStartTime();
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);

        const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const seconds = Math.floor(diff % 60).toString().padStart(2, '0');

        this.elapsedTime.set(`${ hours }:${ minutes }:${ seconds }`);
    }

    private updateEstimatedDistance(): void {
        const points = this.storedLocationPoints();
        if (!points || points.length < 2) {
            return;
        }

        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            totalDistance += this.calculateGeoDistance(
                {latitude: prev.latitude, longitude: prev.longitude, accuracy: prev.accuracy, timestamp: prev.timestamp},
                {latitude: curr.latitude, longitude: curr.longitude, accuracy: curr.accuracy, timestamp: curr.timestamp}
            );
        }

        this.estimatedDistance.set(parseFloat(totalDistance.toFixed(2)));

        // Calcular velocidad promedio (km/h)
        if (this.sessionStartTime()) {
            const startTime = this.sessionStartTime().getTime();
            const now = new Date().getTime();
            const hoursElapsed = (now - startTime) / 3600000; // Convert milliseconds to hours

            if (hoursElapsed > 0) {
                this.averageSpeed.set(parseFloat((totalDistance / hoursElapsed).toFixed(1)));
            }
        }
    }

    calculateGeoDistance(p1: GeoLocation, p2: GeoLocation): number {
        if (p1 == null || p2 == null) return 0;
        const R = 6371; // Radio de la tierra en km
        const dLat = this.deg2rad(p2.latitude - p1.latitude);
        const dLon = this.deg2rad(p2.longitude - p1.longitude);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.deg2rad(p1.latitude))
            * Math.cos(this.deg2rad(p2.latitude)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    updateMap(): void {
        const session = this.currentSession();
        const currentLocation = this.currentLocation();

        if (!session || !session.initialLocation || !currentLocation) {
            return;
        }

        const start = session.initialLocation;
        const current = currentLocation;

        // Generar URL del mapa estático
        const storedPoints = this.storedLocationPoints();
        if (storedPoints.length > 0) {
            // Si hay puntos almacenados, crear una ruta más detallada
            const latitudes = storedPoints.map(p => p.latitude);
            const longitudes = storedPoints.map(p => p.longitude);
            latitudes.push(start.latitude, current.latitude);
            longitudes.push(start.longitude, current.longitude);

            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);

            const centerLat = (minLat + maxLat) / 2;
            const centerLng = (minLng + maxLng) / 2;

            // Calcular zoom automático
            const latSpan = maxLat - minLat;
            const lngSpan = maxLng - minLng;
            const maxSpan = Math.max(latSpan, lngSpan);
            let zoom = 15;
            if (maxSpan > 0.1) zoom = 13;
            if (maxSpan > 0.5) zoom = 11;
            if (maxSpan > 1) zoom = 9;
            if (maxSpan > 2) zoom = 5;
            if (maxSpan > 2) zoom = 6;

            const startMarker = `markers=label:I|${ start.latitude },${ start.longitude }`;
            const currentMarker = `markers=color:red|${ current.latitude },${ current.longitude }`;

            // Limitar a 100 puntos para no exceder límites de URL
            const pathPoints = [
                `${ start.latitude },${ start.longitude }`,
                ...storedPoints.slice(-100).map(p => `${ p.latitude },${ p.longitude }`),
                `${ current.latitude },${ current.longitude }`
            ];

            const path = `path=color:0x0000FF|weight:3|${ pathPoints.join('|') }`;

            const apiKey = environment.GMAPS_API_KEY;
            this.mapUrl.set(`https://maps.googleapis.com/maps/api/staticmap?center=${ centerLat },${ centerLng }&size=600x400&scale=2&${ startMarker }&${ currentMarker }&${ path }&key=${ apiKey }`);
        } else {
            // Si no hay puntos almacenados, mostrar solo inicio y posición actual
            const centerLat = (start.latitude + current.latitude) / 2;
            const centerLng = (start.longitude + current.longitude) / 2;
            const startMarker = `markers=label:I|${ start.latitude },${ start.longitude }`;
            const currentMarker = `markers=color:red|${ current.latitude },${ current.longitude }`;
            const path = `path=${ start.latitude },${ start.longitude }|${ current.latitude },${ current.longitude }`;
            const apiKey = environment.GMAPS_API_KEY;
            this.mapUrl.set(`https://maps.googleapis.com/maps/api/staticmap?center=${ centerLat },${ centerLng }&zoom=13&size=600x400&scale=2&${ startMarker }&${ currentMarker }&${ path }&key=${ apiKey }`);
        }
    }

    toggleFullScreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${ err.message }`);
            });
            this.isFullScreen.set(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.error(`Error attempting to exit full-screen mode: ${ err.message }`);
                });
                this.isFullScreen.set(false);
            }
        }
    }

    navigateToFinishSession(): void {
        // Esta función será implementada para navegar a la pantalla de finalizar sesión
    }
}
