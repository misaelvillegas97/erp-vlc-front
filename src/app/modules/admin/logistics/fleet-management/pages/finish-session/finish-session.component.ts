import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators }                         from '@angular/forms';
import { ActivatedRoute, Router, RouterLink }                                              from '@angular/router';
import { MatDialog }                                                                       from '@angular/material/dialog';
import { forkJoin, of, Subject }                                                           from 'rxjs';
import { catchError, finalize, switchMap, takeUntil, tap }                                 from 'rxjs/operators';
import { VehicleSessionsService }                                                          from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { DriversService }                                                                  from '@modules/admin/logistics/fleet-management/services/drivers.service';
import { VehiclesService }                                                                 from '@modules/admin/logistics/fleet-management/services/vehicles.service';
import { GeolocationService }                                                              from '@modules/admin/logistics/fleet-management/services/geolocation.service';
import { FinishSessionDto, GeoLocation, VehicleSession }                                   from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { Driver }                                                                          from '@modules/admin/logistics/fleet-management/domain/model/driver.model';
import { Vehicle }                                                                         from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';
import { ConfirmDialogComponent }                                                          from '../active-sessions/confirm-dialog.component';
import { PageHeaderComponent }                                                             from '@layout/components/page-header/page-header.component';
import { CommonModule }                                                                    from '@angular/common';
import { MatButtonModule }                                                                 from '@angular/material/button';
import { MatCardModule }                                                                   from '@angular/material/card';
import { MatFormFieldModule }                                                              from '@angular/material/form-field';
import { MatIconModule }                                                                   from '@angular/material/icon';
import { MatInputModule }                                                                  from '@angular/material/input';
import { MatProgressSpinnerModule }                                                        from '@angular/material/progress-spinner';
import { NotyfService }                                                                    from '@shared/services/notyf.service';
import { DateTime }                                                                        from 'luxon';
import { calculateDistance }                                                               from '@shared/utils/gps.utils';
import { toSignal }                                                                        from '@angular/core/rxjs-interop';

@Component({
    selector       : 'app-finish-session',
    standalone     : true,
    imports    : [
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

    private destroy$ = new Subject<void>();

    form: FormGroup = this.fb.group({
        finalOdometer: [ '', [ Validators.required, Validators.min(0) ] ],
        incidents    : [ '', [ Validators.maxLength(500) ] ]
    });

    isLoading = signal(true);
    isSubmitting = signal(false);
    sessionId = signal<string>('');
    session = signal<VehicleSession | null>(null);
    driver = signal<Driver | null>(null);
    vehicle = signal<Vehicle | null>(null);
    currentLocation = signal<GeoLocation | null>(null);
    uploadedFiles = signal<File[]>([]);
    uploadedPreviews = signal<string[]>([]);

    // Form control signals
    finalOdometer = toSignal(this.form.get('finalOdometer')!.valueChanges, {initialValue: 0});

    elapsedMinutes = computed(() => {
        const s = this.session();
        if (!s) return 0;
        const diff = Date.now() - new Date(s.startTime).getTime();
        return Math.floor(diff / 60000);
    });

    calculatedDistance = computed(() => {
        const final = this.finalOdometer();
        const initial = this.session()?.initialOdometer ?? 0;
        return final > initial ? final - initial : 0;
    });

    calculatedGpsDistance = computed(() => {
        const points = this.session()?.gps;
        if (!points || points.length < 2) return 0;

        const meters = calculateDistance(points);
        return +(meters / 1000).toFixed(2);
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.notyf.error('ID de sesión no válido');
            this.router.navigate([ '/logistics/fleet-management/active-sessions' ]);
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
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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
                const min = session.initialOdometer;
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
                this.form.get('finalOdometer')!.setValue(vehicle.lastKnownOdometer + (this.calculatedGpsDistance() || 0), {emitEvent: false});
            }),
            catchError(err => {
                console.error('Session load error', err);
                this.notyf.error('Error al cargar datos de sesión');
                this.router.navigate([ '/logistics/fleet-management/active-sessions' ]);
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

            // Store a reference to the onload function to be able to remove it later
            const onLoadHandler = (e: ProgressEvent<FileReader>) => {
                this.uploadedPreviews.set([ ...this.uploadedPreviews(), e.target!.result as string ]);
            };

            reader.onload = onLoadHandler;
            reader.readAsDataURL(file);

            // Add cleanup for the FileReader
            this.destroy$.subscribe(() => {
                reader.onload = null;
                reader.onerror = null;
                reader.onabort = null;
            });
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

        this.sessionsService.finishSession(this.sessionId(), data).pipe(
            takeUntil(this.destroy$),
            tap(() => {
                this.notyf.success('Sesión finalizada');

                this.router.navigate([ '/logistics/fleet-management/active-sessions' ]);
            }),
            catchError(err => {
                console.error('Finish session error', err);
                this.notyf.error('Error al finalizar: ' + err.message);
                return of(null);
            }),
            finalize(() => this.isSubmitting.set(false))
        ).subscribe();
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
