import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                                                    from '@angular/common';
import { ActivatedRoute, Router }                                                          from '@angular/router';
import { MatButtonModule }                                                                 from '@angular/material/button';
import { MatCardModule }                                                                   from '@angular/material/card';
import { MatChipsModule }                                                                  from '@angular/material/chips';
import { MatDividerModule }                                                                from '@angular/material/divider';
import { MatIconModule }                                                                   from '@angular/material/icon';
import { MatProgressSpinnerModule }                                                        from '@angular/material/progress-spinner';
import { MatTabsModule }                                                                   from '@angular/material/tabs';
import { MatTooltipModule }                                                                from '@angular/material/tooltip';
import { PageHeaderComponent }                                                             from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                           from 'notyf';
import { GoogleMapsModule }                                                                from '@angular/google-maps';
import { VehicleSessionsService }                                                          from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { GpsGeneric, SessionStatus, VehicleSession }                                       from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { DateTime }                                                                        from 'luxon';
import { calculateDistance }                                                               from '@shared/utils/gps.utils';
import { Subscription }                                                                    from 'rxjs';

@Component({
    selector       : 'app-session-details',
    standalone     : true,
    imports        : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatDividerModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatTooltipModule,
        PageHeaderComponent,
        GoogleMapsModule
    ],
    templateUrl    : './session-details.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionDetailsComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly notyf = new Notyf();

    private interval: any;
    private subscriptions = new Subscription();

    // Signals
    isLoading = signal(true);
    session = signal<VehicleSession | null>(null);
    sessionId = signal<string>('');
    mapInstance = signal<google.maps.Map | null>(null);
    startMarker = signal<google.maps.Marker | null>(null);
    currentPositionMarker = signal<google.maps.Marker | null>(null);
    endMarker = signal<google.maps.Marker | null>(null);
    mapPolyline = signal<google.maps.Polyline | null>(null);

    // Google Maps options
    mapOptions = signal({
        center        : {lat: 0, lng: 0},
        // zoom             : 14,
        mapTypeId        : 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    });

    mapCenter = signal<google.maps.LatLngLiteral>({lat: 0, lng: 0});
    polylinePath = signal<google.maps.LatLngLiteral[]>([]);
    markers = signal<google.maps.MarkerOptions[]>([]);

    // Session status enum for template
    SessionStatus = SessionStatus;

    // Computed values for template
    maxSpeed = computed(() => {
        const gpsData = this.session()?.gps;
        if (!gpsData || gpsData.length === 0) {
            return undefined;
        }

        return gpsData.reduce((max, point) => Math.max(max, point.speed || 0), 0);
    });

    totalDistance = computed(() => {
        const gpsData = this.session()?.gps;
        if (!gpsData || gpsData.length === 0) {
            return undefined;
        }

        const meters = calculateDistance(gpsData);

        return meters / 1000;
    });

    ngOnInit(): void {
        this.sessionId.set(this.route.snapshot.paramMap.get('id') || '');

        if (!this.sessionId()) {
            this.notyf.error('ID de sesión no válido');
            this.router.navigate([ '/logistics/fleet-management/active-sessions' ]);
            return;
        }

        this.loadSessionDetails();
    }

    ngOnDestroy(): void {
        clearInterval(this.interval);
        this.subscriptions.unsubscribe();
    }

    onMapInitialized(map: google.maps.Map): void {
        this.mapInstance.set(map);

        // Si ya tenemos datos GPS, configuramos los elementos del mapa
        if (this.session()?.gps?.length > 0) {
            this.setupMapData(this.session()!.gps);
        }
    }

    private loadSessionDetails(): void {
        this.isLoading.set(true);
        clearInterval(this.interval);

        const subscription = this.sessionsService.findById(this.sessionId()).subscribe({
            next : (session) => {
                this.session.set(session);
                this.isLoading.set(false);

                if (session.gps && session.gps.length > 0) {
                    this.setupMapData(session.gps);
                }

                if (session.status === SessionStatus.ACTIVE) {
                    this.interval = setInterval(() => {
                        const refreshSubscription = this.sessionsService.findById(this.sessionId()).subscribe({
                            next : (session) => {
                                this.session.set(session);
                                if (session.gps && session.gps.length > 0) {
                                    this.setupMapData(session.gps);
                                }
                            },
                            error: (error) => {
                                console.error('Error loading session details', error);
                            }
                        });
                        this.subscriptions.add(refreshSubscription);
                    }, 5000);
                }
            },
            error: (error) => {
                console.error('Error loading session details', error);
                this.notyf.error('Error al cargar los detalles de la sesión');
                this.isLoading.set(false);
            }
        });
        this.subscriptions.add(subscription);
    }

    private setupMapData(gpsData: GpsGeneric[]): void {
        if (!gpsData || gpsData.length === 0 || !this.mapInstance) {
            return;
        }

        // Verifica si google está definido
        if (typeof google === 'undefined') {
            console.error('Google Maps no está disponible');
            return;
        }

        // Crear la ruta para el polyline
        const path = [];
        gpsData.forEach(point => path.push({
            lat: point.latitude,
            lng: point.longitude
        }));

        // Actualizar polyline
        if (!this.mapPolyline()) {
            // Primera inicialización
            this.mapPolyline.set(new google.maps.Polyline({
                path         : path,
                geodesic     : true,
                strokeColor  : '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight : 2,
                map          : this.mapInstance()
            }));
        } else {
            // Solo actualizar el path
            this.mapPolyline().setPath(path);
        }

        const lastPosition = path[path.length - 1];

        // Centrar el mapa en la última ubicación conocida
        this.mapCenter.set(lastPosition);

        // Inicializar o actualizar marcadores

        // Marcador de inicio
        if (!this.startMarker()) {
            this.startMarker.set(new google.maps.Marker({
                position: path[0],
                title: 'Inicio',
                icon: {
                    url       : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRDQUY1MCI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
                    scaledSize: new google.maps.Size(36, 36)
                },
                map  : this.mapInstance()
            }));
        }

        // Agregar o actualizar marcador de fin si la sesión está completada
        if (this.session()?.status === SessionStatus.COMPLETED) {
            if (!this.endMarker()) {
                this.endMarker.set(new google.maps.Marker({
                    position: lastPosition,
                    title   : 'Fin',
                    icon: {
                        url       : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0Y0NDMzNiI+PHBhdGggZD0iTTIxIDNMMyA5djFsMi4xIDIuOEwzIDIxaDFsMi44LTIuMUwyMSAyMXYtMWwtMi44LTIuMUwyMSA0VjN6Ii8+PC9zdmc+',
                        scaledSize: new google.maps.Size(36, 36)
                    },
                    map     : this.mapInstance()
                }));
            } else {
                this.endMarker().setPosition(lastPosition);
            }
        }

        // Marcador de posición actual
        if (!this.currentPositionMarker() && this.session().status === SessionStatus.ACTIVE) {
            this.currentPositionMarker.set(new google.maps.Marker({
                position: lastPosition,
                title   : 'Ubicación actual',
                icon    : {
                    url       : 'data:image/png;base64,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',
                    scaledSize: new google.maps.Size(36, 36)
                },
                map     : this.mapInstance()
            }));
        } else {
            // Solo actualizar posición
            this.currentPositionMarker().setPosition(lastPosition);
        }

        // Opcional: asegurarse de que todos los marcadores sean visibles
        if (this.mapInstance()) {
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            this.mapInstance().fitBounds(bounds);
        }
    }

    formatDateTime(timestamp: number): string {
        if (!timestamp) {
            return 'N/A';
        }

        return DateTime.fromSeconds(timestamp).toFormat('dd-MM-yyyy HH:mm:ss');
    }

    formatDuration(startTime: Date | string, endTime?: Date | string): string {
        if (!startTime) {
            return 'N/A';
        }

        const start = DateTime.fromJSDate(new Date(startTime));
        const end = endTime ? DateTime.fromJSDate(new Date(endTime)) : DateTime.now();

        const diff = end.diff(start, [ 'hours', 'minutes', 'seconds' ]);
        const hours = Math.floor(diff.hours);
        const minutes = Math.floor(diff.minutes);
        const seconds = Math.floor(diff.seconds);

        return `${ hours }h ${ minutes }m ${ seconds }s`;
    }

    getStatusText(status: SessionStatus): string {
        switch (status) {
            case SessionStatus.ACTIVE:
                return 'Activa';
            case SessionStatus.COMPLETED:
                return 'Completada';
            case SessionStatus.CANCELLED:
                return 'Cancelada';
            case SessionStatus.EXPIRED:
                return 'Expirada';
            default:
                return 'Desconocido';
        }
    }

    getStatusClass(status: SessionStatus): string {
        switch (status) {
            case SessionStatus.ACTIVE:
                return 'bg-green-500';
            case SessionStatus.COMPLETED:
                return 'bg-blue-500';
            case SessionStatus.CANCELLED:
                return 'bg-orange-500';
            case SessionStatus.EXPIRED:
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    }

    formatSpeed(speed: number | undefined): string {
        if (speed === undefined) {
            return 'N/A';
        }
        return `${ speed.toFixed(1) } km/h`;
    }

    formatDistance(distance: number | undefined): string {
        if (distance === undefined) {
            return 'N/A';
        }
        return `${ distance.toFixed(2) } km`;
    }

    goBack(): void {
        const session = this.session();
        if (session?.status === SessionStatus.ACTIVE) {
            this.router.navigate([ '/logistics/fleet-management/active-sessions' ]);
        } else {
            this.router.navigate([ '/logistics/fleet-management/history' ]);
        }
    }
}
