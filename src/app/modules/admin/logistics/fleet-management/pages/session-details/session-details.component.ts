import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal, viewChildren } from '@angular/core';
import { CommonModule }                                                                                  from '@angular/common';
import { ActivatedRoute, Router }                                                                        from '@angular/router';
import { MatButtonModule }                                                                               from '@angular/material/button';
import { MatCardModule }                                                                                 from '@angular/material/card';
import { MatChipsModule }                                                                                from '@angular/material/chips';
import { MatDividerModule }                                                                              from '@angular/material/divider';
import { MatIconModule }                                                                                 from '@angular/material/icon';
import { MatProgressSpinnerModule }                                                                      from '@angular/material/progress-spinner';
import { MatTabsModule }                                                                                 from '@angular/material/tabs';
import { MatTooltipModule }                                                                              from '@angular/material/tooltip';
import { PageHeaderComponent }                                                                           from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                                         from 'notyf';
import { GoogleMapsModule, MapInfoWindow }                                                               from '@angular/google-maps';
import { VehicleSessionsService }                                                                        from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { GpsGeneric, SessionStatus, VehicleSession }                                                     from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { DateTime }                                                                                      from 'luxon';
import { calculateDistance }                                                                             from '@shared/utils/gps.utils';
import { Subscription }                                                                                  from 'rxjs';

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
    startMarker = signal(null);
    currentPositionMarker = signal(null);
    endMarker = signal(null);
    activeInfoWindow = signal<google.maps.InfoWindow | null>(null);

    infoWindows = viewChildren(MapInfoWindow);

    // Signals para el enfoque declarativo
    gpsMarkers = signal<any[]>([]);
    selectedMarker = signal<any | null>(null);
    selectedPoint = signal<GpsGeneric | null>(null);

    // Google Maps options
    mapOptions = signal({
        center        : {lat: 0, lng: 0},
        mapTypeId        : 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    });

    mapCenter = signal<google.maps.LatLngLiteral>({lat: 0, lng: 0});
    polylinePath = signal<google.maps.LatLngLiteral[]>([]);
    markers = signal<any[]>([]);

    SessionStatus = SessionStatus;

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

    headerComputed = computed((): Element => {
        const marker = this.selectedMarker();

        if (marker) {
            const el = document.createElement('div');

            el.innerHTML = `<strong class="text-gray-800 font-medium">${ marker.title }</strong><br>`;

            return el;
        }
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
        this.cleanupMarkers();
    }

    onMapInitialized(map: google.maps.Map): void {
        this.mapInstance.set(map);

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

        if (typeof google === 'undefined' || !google.maps) {
            console.error('Google Maps API no está completamente cargada');
            // Intentar nuevamente después de un breve retraso
            setTimeout(() => this.setupMapData(gpsData), 500);
            return;
        }

        this.cleanupMarkers();

        const path = [];
        gpsData.forEach(point => path.push({
            lat: point.latitude,
            lng: point.longitude
        }));

        this.polylinePath.set(path);

        const lastPosition = path[path.length - 1];

        this.mapCenter.set(lastPosition);

        if (!this.startMarker()) {
            this.startMarker.set({
                position: path[0],
                title: 'Inicio',
                icon : {
                    url       : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRDQUY1MCI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
                    scaledSize: {width: 36, height: 36}
                }
            });
        }

        if (this.session()?.status === SessionStatus.COMPLETED) {
            if (!this.endMarker()) {
                this.endMarker.set({
                    position: lastPosition,
                    title   : 'Fin',
                    icon: {
                        url       : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0Y0NDMzNiI+PHBhdGggZD0iTTIxIDNMMyA5djFsMi4xIDIuOEwzIDIxaDFsMi44LTIuMUwyMSAyMXYtMWwtMi44LTIuMUwyMSA0VjN6Ii8+PC9zdmc+',
                        scaledSize: {width: 36, height: 36}
                    },
                });
            }
        }

        if (!this.currentPositionMarker() && this.session().status === SessionStatus.ACTIVE) {
            this.currentPositionMarker.set({
                position: lastPosition,
                title   : 'Ubicación actual',
                icon    : {
                    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzIxOTZGMyI+PHBhdGggZD0iTTEyIDhBNCA0IDAgMCAwIDggMTJINlYxMEg0VjE0SDEwVjEySDhBMiAyIDAgMCAxIDEwIDEwQTIgMiAwIDAgMSAxMiAxMkEyIDIgMCAwIDEgMTAgMTRBMiAyIDAgMCAxIDggMTJIN0E0IDQgMCAwIDAgMTEgMTUuOVYxOEg5VjIwSDEyQTEgMSAwIDAgMCAxMyAxOVYxNS45QTQgNCAwIDAgMCAxNiAxMkE0IDQgMCAwIDAgMTIgOFoiLz48L3N2Zz4=',
                    scaledSize: {width: 36, height: 36}
                }
            });
        } else if (this.currentPositionMarker()) {
            this.currentPositionMarker.update(position => ({
                ...position,
                position: lastPosition
            }));
        }

        const gpsMarkerData = [];

        this.selectedMarker.set(null);
        this.selectedPoint.set(null);

        gpsData.forEach((point, index) => {
            if (gpsData.length > 100 && index % Math.ceil(gpsData.length / 100) !== 0) {
                return;
            }

            const position = {lat: point.latitude, lng: point.longitude};

            const markerData = {
                position: position,
                title   : `Punto GPS #${ index + 1 }`,
                options : {
                    icon     : {
                        path        : 0.0,
                        scale       : 4,
                        fillColor   : '#4285F4',
                        fillOpacity : 0.8,
                        strokeColor : '#FFFFFF',
                        strokeWeight: 1
                    },
                    visible  : true,
                    clickable: true,
                    zIndex   : 999
                },
                point   : point,
                // label   : point.speed > 120 ? this.formatSpeed(point.speed) : '',
                index: index
            };

            gpsMarkerData.push(markerData);
        });

        this.gpsMarkers.set(gpsMarkerData);

        this.markers.set([]);

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

    onMarkerMouseOver(marker: any): void {
        this.infoWindows().forEach(infoWindow => infoWindow.open());
        this.selectedMarker.set(marker);
        this.selectedPoint.set(marker.point);
    }

    onMarkerMouseOut(): void {
        this.infoWindows().forEach(infoWindow => infoWindow.close());
    }

    /**
     * Limpia los marcadores existentes del mapa
     */
    private cleanupMarkers(): void {
        // Limpiar marcadores de puntos GPS (para compatibilidad con el enfoque imperativo)
        const currentMarkers = this.markers();
        if (currentMarkers && currentMarkers.length > 0) {
            currentMarkers.forEach(marker => {
                marker.setMap(null);
            });
            this.markers.set([]);
        }

        // Limpiar datos de marcadores para el enfoque declarativo
        this.gpsMarkers.set([]);
        this.selectedMarker.set(null);
        this.selectedPoint.set(null);

        // Cerrar cualquier InfoWindow activa (para compatibilidad con el enfoque imperativo)
        if (this.activeInfoWindow()) {
            this.activeInfoWindow().close();
            this.activeInfoWindow.set(null);
        }
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
