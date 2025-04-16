import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators }                         from '@angular/forms';
import { ActivatedRoute, Router, RouterLink }                                              from '@angular/router';
import { MatDialog }                                                                       from '@angular/material/dialog';
import { forkJoin, of, Subject }                                                           from 'rxjs';
import { catchError, finalize, switchMap, takeUntil, tap }                                 from 'rxjs/operators';
import { VehicleSessionsService }                                                          from '../../services/vehicle-sessions.service';
import { DriversService }                                                                  from '../../services/drivers.service';
import { VehiclesService }                                                                 from '../../services/vehicles.service';
import { GeolocationService }                                                              from '../../services/geolocation.service';
import { LocationTrackingService, StoredLocationPoint }                                    from '../../services/location-tracking.service';
import { FinishSessionDto, GeoLocation, VehicleSession }                                   from '../../domain/model/vehicle-session.model';
import { Driver }                                                                          from '../../domain/model/driver.model';
import { Vehicle }                                                                         from '../../domain/model/vehicle.model';
import { ConfirmDialogComponent }                                                          from '../active-sessions/confirm-dialog.component';
import { PageHeaderComponent }                                                             from '@layout/components/page-header/page-header.component';
import { CommonModule }                                                                    from '@angular/common';
import { MatButtonModule }                                                                 from '@angular/material/button';
import { MatCardModule }                                                                   from '@angular/material/card';
import { MatFormFieldModule }                                                              from '@angular/material/form-field';
import { MatIconModule }                                                                   from '@angular/material/icon';
import { MatInputModule }                                                                  from '@angular/material/input';
import { MatProgressSpinnerModule }                                                        from '@angular/material/progress-spinner';
import { environment }                                                                     from '../../../../../../environments/environment';
import { NotyfService }                                                                    from '@shared/services/notyf.service';
import { DateTime }                                                                        from 'luxon';

@Component({
    selector       : 'app-finish-session',
    standalone     : true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        PageHeaderComponent,
        RouterLink
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './finish-session.component.html'
})
export class FinishSessionComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly notyf = inject(NotyfService);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly driversService = inject(DriversService);
    private readonly vehiclesService = inject(VehiclesService);
    private readonly geolocationService = inject(GeolocationService);
    private readonly locationTrackingService = inject(LocationTrackingService);

    private destroy$ = new Subject<void>();

    isLoading = signal(true);
    isSubmitting = signal(false);
    sessionId = signal<string>('');
    session = signal<VehicleSession | null>(null);
    driver = signal<Driver | null>(null);
    vehicle = signal<Vehicle | null>(null);
    currentLocation = signal<GeoLocation | null>(null);
    uploadedFiles = signal<File[]>([]);
    uploadedPreviews = signal<string[]>([]);

    storedLocationPoints = signal<StoredLocationPoint[]>([]);
    isTrackingActive = signal(false);
    trackingPointsCount = signal(0);
    isMobileDevice = signal(false);
    showTrackingDetails = signal(false);

    form: FormGroup = this.fb.group({
        finalOdometer: [ '', [ Validators.required, Validators.min(0) ] ],
        incidents    : [ '', [ Validators.maxLength(500) ] ]
    });

    elapsedMinutes = computed(() => {
        const s = this.session();
        if (!s) return 0;
        const diff = Date.now() - new Date(s.startTimestamp).getTime();
        return Math.floor(diff / 60000);
    });

    calculatedDistance = computed(() => {
        const final = this.form.get('finalOdometer')!.value;
        const initial = this.session()?.initialOdometer ?? 0;
        return final > initial ? final - initial : 0;
    });

    calculatedGpsDistance = computed(() => {
        const points = this.storedLocationPoints();
        if (!points || points.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            totalDistance += this.calculateGeoDistance(
                {latitude: prev.latitude, longitude: prev.longitude, accuracy: prev.accuracy, timestamp: prev.timestamp},
                {latitude: curr.latitude, longitude: curr.longitude, accuracy: curr.accuracy, timestamp: curr.timestamp}
            );
        }

        return parseFloat(totalDistance.toFixed(2));
    });

    ngOnInit(): void {
        this.isMobileDevice.set(this.locationTrackingService.isMobileOrTablet());
        
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.notyf.error('ID de sesión no válido');
            this.router.navigate([ '/logistics/active-sessions' ]);
            return;
        }
        this.sessionId.set(id);
        this.loadSessionData();

        this.geolocationService.getCurrentPosition().pipe(
            takeUntil(this.destroy$),
            catchError(err => {
                console.error('Geolocation error', err);
                this.notyf.error('No se pudo obtener ubicación');
                return of(null);
            })
        ).subscribe(loc => loc && this.currentLocation.set(loc));

        if (this.isMobileDevice()) {
            this.locationTrackingService.isTracking$.pipe(
                takeUntil(this.destroy$)
            ).subscribe(isTracking => {
                this.isTrackingActive.set(isTracking);
            });

            this.locationTrackingService.storedPointsCount$.pipe(
                takeUntil(this.destroy$)
            ).subscribe(count => {
                this.trackingPointsCount.set(count);
            });

            this.loadStoredLocationPoints(id);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private async loadStoredLocationPoints(sessionId: string): Promise<void> {
        try {
            const points = await this.locationTrackingService.getLocationPoints(sessionId);
            this.storedLocationPoints.set(points);
            this.showTrackingDetails.set(points.length > 0);

            if (points.length > 0) {
                this.notyf.success(`Se han recuperado ${ points.length } puntos de ubicación`);
            }
        } catch (error) {
            console.error('Error al cargar puntos de ubicación:', error);
        }
    }

    formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${ hours }h ${ mins }m`;
    }

    private loadSessionData(): void {
        this.isLoading.set(true);
        this.sessionsService.findById(this.sessionId()).pipe(
            takeUntil(this.destroy$),
            tap(session => {
                this.session.set(session);
                const min = session.initialOdometer + 1;
                this.form.get('finalOdometer')!
                    .setValidators([ Validators.required, Validators.min(min) ]);
                this.form.get('finalOdometer')!.updateValueAndValidity({emitEvent: false});
            }),
            switchMap(session => forkJoin({
                driver : this.driversService.findById(session.driverId),
                vehicle: this.vehiclesService.findById(session.vehicleId)
            })),
            tap(({driver, vehicle}) => {
                this.driver.set(driver);
                this.vehicle.set(vehicle);
                this.form.get('finalOdometer')!.setValue(vehicle.lastKnownOdometer, {emitEvent: false});
            }),
            catchError(err => {
                console.error('Session load error', err);
                this.notyf.error('Error al cargar datos de sesión');
                this.router.navigate([ '/logistics/active-sessions' ]);
                return of(null);
            }),
            finalize(() => this.isLoading.set(false))
        ).subscribe();
    }

    onFileSelected(evt: Event): void {
        const files = (evt.target as HTMLInputElement).files;
        if (!files) return;
        const slots = 5 - this.uploadedFiles().length;
        Array.from(files).slice(0, slots).forEach(file => {
            if (!file.type.startsWith('image/')) {
                this.notyf.error('Solo imágenes');
                return;
            }
            this.uploadedFiles.set([ ...this.uploadedFiles(), file ]);
            const reader = new FileReader();
            reader.onload = e => {
                this.uploadedPreviews.set([ ...this.uploadedPreviews(), e.target!.result as string ]);
            };
            reader.readAsDataURL(file);
        });
        (evt.target as HTMLInputElement).value = '';
    }

    removeFile(index: number): void {
        const files = this.uploadedFiles();
        const previews = this.uploadedPreviews();
        this.uploadedFiles.set(files.filter((_, i) => i !== index));
        this.uploadedPreviews.set(previews.filter((_, i) => i !== index));
    }

    confirmFinish(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.notyf.error('Complete correctamente los campos');
            return;
        }
        const loc = this.currentLocation();
        if (!loc) {
            this.notyf.error('Ubicación no disponible');
            return;
        }
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title  : 'Confirmar finalización',
                message: '¿Desea finalizar la sesión?'
            }
        });
        dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(ok => ok && this.finishSession());
    }

    private finishSession(): void {
        this.isSubmitting.set(true);
        const data: FinishSessionDto = {
            finalOdometer: this.form.value.finalOdometer,
            finalLocation: this.currentLocation()!,
            incidents    : this.form.value.incidents || '',
            photos       : this.uploadedFiles()
        };

        if (this.storedLocationPoints().length > 0) {
            data['locationHistory'] = this.storedLocationPoints().map(point => ({
                latitude : point.latitude,
                longitude: point.longitude,
                accuracy : point.accuracy,
                timestamp: point.timestamp
            }));
        }

        console.log(data);
        
        this.sessionsService.finishSession(this.sessionId(), data).pipe(
            takeUntil(this.destroy$),
            tap(() => {
                this.notyf.success('Sesión finalizada');

                if (this.isMobileDevice()) {
                    this.locationTrackingService.stopTracking();
                    this.locationTrackingService.clearLocationPoints(this.sessionId())
                        .then(() => console.log('Datos de ubicación eliminados'))
                        .catch(err => console.error('Error al limpiar datos de ubicación', err));
                }
                
                this.router.navigate([ '/logistics/active-sessions' ]);
            }),
            catchError(err => {
                console.error('Finish session error', err);
                this.notyf.error('Error al finalizar: ' + err.message);
                return of(null);
            }),
            finalize(() => this.isSubmitting.set(false))
        ).subscribe();
    }

    getStaticMapUrl(): string {
        const s = this.session();
        const loc = this.currentLocation();
        if (!s || !loc) return '';

        const start = s.initialLocation;
        const end = loc;
        if (!start || !end) return '';

        const storedPoints = this.storedLocationPoints();
        if (storedPoints.length > 0) {
            const latitudes = storedPoints.map(p => p.latitude);
            const longitudes = storedPoints.map(p => p.longitude);
            latitudes.push(start.latitude, end.latitude);
            longitudes.push(start.longitude, end.longitude);

            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);

            const centerLat = (minLat + maxLat) / 2;
            const centerLng = (minLng + maxLng) / 2;

            const latSpan = maxLat - minLat;
            const lngSpan = maxLng - minLng;
            const maxSpan = Math.max(latSpan, lngSpan);
            let zoom = 15;
            if (maxSpan > 0.1) zoom = 11;
            if (maxSpan > 0.5) zoom = 9;
            if (maxSpan > 1) zoom = 7;
            if (maxSpan > 2) zoom = 5;

            const startMarker = `markers=label:I|${ start.latitude },${ start.longitude }`;
            const endMarker = `markers=label:F|${ end.latitude },${ end.longitude }`;

            const pathPoints = [
                `${ start.latitude },${ start.longitude }`,
                ...storedPoints.slice(0, 100).map(p => `${ p.latitude },${ p.longitude }`),
                `${ end.latitude },${ end.longitude }`
            ];

            const path = `path=color:0x0000FF|weight:3|${ pathPoints.join('|') }`;

            const apiKey = environment.GMAPS_API_KEY;
            return `https://maps.googleapis.com/maps/api/staticmap?center=${ centerLat },${ centerLng }&zoom=${ zoom }&size=600x400&scale=2&${ startMarker }&${ endMarker }&${ path }&key=${ apiKey }`;
        }
        
        const centerLat = (start.latitude + end.latitude) / 2;
        const centerLng = (start.longitude + end.longitude) / 2;
        const distance = this.calculateGeoDistance(start, end);
        const zoom = distance > 1000 ? 3 : distance > 500 ? 5 : distance > 100 ? 7 : 10;
        const startMarker = `markers=label:I|${ start.latitude },${ start.longitude }`;
        const endMarker = `markers=label:F|${ end.latitude },${ end.longitude }`;
        const path = distance > 0.05 ? `&path=${ start.latitude },${ start.longitude }|${ end.latitude },${ end.longitude }` : '';
        const apiKey = environment.GMAPS_API_KEY;
        return `https://maps.googleapis.com/maps/api/staticmap?center=${ centerLat },${ centerLng }&zoom=${ zoom }&size=600x300&scale=2&${ startMarker }&${ endMarker }${ path }&key=${ apiKey }`;
    }

    toggleTrackingDetails(): void {
        this.showTrackingDetails.update(current => !current);
    }

    calculateGeoDistance(p1: GeoLocation, p2: GeoLocation): number {
        if (p1 == null || p2 == null) return 0;
        const R = 6371;
        const dLat = this.deg2rad(p2.latitude - p1.latitude);
        const dLon = this.deg2rad(p2.longitude - p1.longitude);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.deg2rad(p1.latitude))
            * Math.cos(this.deg2rad(p2.latitude)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    protected readonly Math = Math;
    protected readonly DateTime = DateTime;
}
