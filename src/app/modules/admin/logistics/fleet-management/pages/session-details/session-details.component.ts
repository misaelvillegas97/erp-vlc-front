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
import { VehicleSessionsService }                                                          from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { SessionStatus, VehicleSession }                                                   from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { DateTime }                                                                        from 'luxon';
import { Subscription }                                                                    from 'rxjs';

// Reusable components
import { GpsMapComponent }           from '@shared/components/gps-map/gps-map.component';
import { GpsTableComponent }         from '@shared/components/gps-table/gps-table.component';
import { GpsSummaryComponent }       from '@shared/components/gps-summary/gps-summary.component';
import { OfflineIndicatorComponent } from '@shared/components/offline-indicator/offline-indicator.component';
import { calculateDistance }         from '@shared/utils/gps.utils';

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
        // Reusable components
        GpsMapComponent,
        GpsTableComponent,
        GpsSummaryComponent,
        OfflineIndicatorComponent
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

    SessionStatus = SessionStatus;

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

    private loadSessionDetails(): void {
        this.isLoading.set(true);
        clearInterval(this.interval);

        const subscription = this.sessionsService.findById(this.sessionId()).subscribe({
            next : (session) => {
                this.session.set(session);
                this.isLoading.set(false);

                if (session.status === SessionStatus.ACTIVE) {
                    this.interval = setInterval(() => {
                        const refreshSubscription = this.sessionsService.findById(this.sessionId()).subscribe({
                            next : (session) => {
                                this.session.set(session);
                            },
                            error: (error) => {
                                console.error('Error loading session details', error);
                            }
                        });
                        this.subscriptions.add(refreshSubscription);
                    }, 15000);
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
