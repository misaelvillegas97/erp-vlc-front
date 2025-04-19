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
import { DriversService }                                                        from '../../services/drivers.service';
import { VehiclesService }                                                       from '../../services/vehicles.service';
import { NotyfService }                                                          from '@shared/services/notyf.service';
import { of, Subject }                                                           from 'rxjs';
import { catchError, switchMap, takeUntil, tap }                                 from 'rxjs/operators';
import { ActiveSessionView, GeoLocation, VehicleSession }                        from '../../domain/model/vehicle-session.model';
import { Driver }                                                                from '../../domain/model/driver.model';
import { Vehicle }                                                               from '../../domain/model/vehicle.model';
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
    estimatedDistance = signal(0);
    averageSpeed = signal(0);
    isTrackingActive = signal(false);
    mapUrl = signal('');

    // Para la vista de pantalla completa
    isFullScreen = signal(false);
    hasFullScreenSupport = signal(false);

    ngOnInit(): void {
        this.hasFullScreenSupport.set(Boolean(document.documentElement.requestFullscreen));

        // Cargar sesiones activas
        this.loadActiveSessions();

        // Actualizar ubicación actual
        this.geolocationService.getCurrentPosition()
            .pipe(takeUntil(this.destroy$))
            .subscribe(location => {
                if (location) {
                    this.currentLocation.set(location);
                }
            });

        // Iniciar timer para actualizar el tiempo transcurrido
        this.updateInterval = window.setInterval(() => {
            this.updateElapsedTime();
            this.updateEstimatedDistance();
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
        const points = this.currentSession()?.['locationPoints'];

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
}
