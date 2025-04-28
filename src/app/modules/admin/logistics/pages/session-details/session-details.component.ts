import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { ActivatedRoute, Router }                                               from '@angular/router';
import { MatButtonModule }                                                      from '@angular/material/button';
import { MatCardModule }                                                        from '@angular/material/card';
import { MatChipsModule }                                                       from '@angular/material/chips';
import { MatDividerModule }                                                     from '@angular/material/divider';
import { MatIconModule }                                                        from '@angular/material/icon';
import { MatProgressSpinnerModule }                                             from '@angular/material/progress-spinner';
import { MatTabsModule }                                                        from '@angular/material/tabs';
import { MatTooltipModule }                                                     from '@angular/material/tooltip';
import { PageHeaderComponent }                                                  from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                from 'notyf';
import { GoogleMapsModule }                                                     from '@angular/google-maps';
import { VehicleSessionsService }                                               from '../../services/vehicle-sessions.service';
import { GpsGeneric, SessionStatus, VehicleSession }                            from '../../domain/model/vehicle-session.model';
import { DateTime }                                                             from 'luxon';

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
export class SessionDetailsComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly notyf = new Notyf();

    // Signals
    isLoading = signal(true);
    session = signal<VehicleSession | null>(null);
    sessionId = signal<string>('');

    // Google Maps options
    mapOptions = signal({
        center           : {lat: 0, lng: 0},
        zoom             : 14,
        mapTypeId        : 'roadmap',
        mapTypeControl   : true,
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

        return gpsData[gpsData.length - 1].totalDistance;
    });

    ngOnInit(): void {
        this.sessionId.set(this.route.snapshot.paramMap.get('id') || '');

        if (!this.sessionId()) {
            this.notyf.error('ID de sesión no válido');
            this.router.navigate([ '/logistics/active-sessions' ]);
            return;
        }

        this.loadSessionDetails();
        setInterval(() => this.loadSessionDetails(), 30000);
    }

    private loadSessionDetails(): void {
        this.isLoading.set(true);

        this.sessionsService.findById(this.sessionId()).subscribe({
            next : (session) => {
                console.log('session', session);
                this.session.set(session);
                this.isLoading.set(false);

                if (session.gps && session.gps.length > 0) {
                    this.setupMapData(session.gps);
                }
            },
            error: (error) => {
                console.error('Error loading session details', error);
                this.notyf.error('Error al cargar los detalles de la sesión');
                this.isLoading.set(false);
            }
        });
    }

    private setupMapData(gpsData: GpsGeneric[]): void {
        if (!gpsData || gpsData.length === 0) {
            return;
        }

        // Verifica si google está definido
        if (typeof google === 'undefined') {
            console.error('Google Maps no está disponible');
            return;
        }

        // Crear la ruta para el polyline
        const path = gpsData[0].lastLocations;
        gpsData.forEach(point => path.push({
            lat: point.latitude,
            lng: point.longitude
        }));

        this.polylinePath.set(path);

        // Centrar el mapa en el primer punto GPS
        this.mapCenter.set(path[0]);

        // Crear marcadores para los puntos de inicio y fin
        const markers: google.maps.MarkerOptions[] = [
            {
                position: path[0],
                title   : 'Inicio',
            }
        ];

        // Agregar marcador de fin si la sesión está completada
        if (this.session()?.status === SessionStatus.COMPLETED && path.length > 1) {
            markers.push({
                position: path[path.length - 1],
                title   : 'Fin',
                // icon: {
                //     url: 'assets/icons/map/end-marker.png',
                //     scaledSize: new google.maps.Size(32, 32)
                // }
            });
        }

        this.markers.set(markers);
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
            this.router.navigate([ '/logistics/active-sessions' ]);
        } else {
            this.router.navigate([ '/logistics/history' ]);
        }
    }
}
