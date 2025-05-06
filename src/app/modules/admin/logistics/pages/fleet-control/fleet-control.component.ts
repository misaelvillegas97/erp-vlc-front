import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                                                                          from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators }                  from '@angular/forms';
import { Router }                                                                                from '@angular/router';
import { MatButtonModule }                                                                       from '@angular/material/button';
import { MatCardModule }                                                                         from '@angular/material/card';
import { MatDialog, MatDialogModule }                                                            from '@angular/material/dialog';
import { MatFormFieldModule }                                                                    from '@angular/material/form-field';
import { MatIconModule }                                                                         from '@angular/material/icon';
import { MatInputModule }                                                                        from '@angular/material/input';
import { MatProgressSpinnerModule }                                                              from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                       from '@angular/material/select';
import { PageHeaderComponent }                                                                   from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                                 from 'notyf';
import { firstValueFrom, of }                                                                    from 'rxjs';
import { catchError, take }                                                                      from 'rxjs/operators';
import { takeUntilDestroyed }                                                                    from '@angular/core/rxjs-interop';

import { DriversService }                                    from '../../services/drivers.service';
import { VehiclesService }                                   from '../../services/vehicles.service';
import { VehicleSessionsService }                            from '../../services/vehicle-sessions.service';
import { GeolocationService }                                from '../../services/geolocation.service';
import { GeoLocation, NewVehicleSessionDto, VehicleSession } from '../../domain/model/vehicle-session.model';
import { GpsWarningDialogComponent }                         from './gps-warning-dialog.component';
import { Driver }                                            from '@modules/admin/logistics/domain/model/driver.model';
import { Vehicle }                                           from '@modules/admin/logistics/domain/model/vehicle.model';

@Component({
    selector   : 'app-fleet-control',
    standalone : true,
    imports    : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        ReactiveFormsModule,
        FormsModule,
        PageHeaderComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fleet-control.component.html'
})
export class FleetControlComponent implements OnInit, AfterViewInit {
    private driversService = inject(DriversService);
    private vehiclesService = inject(VehiclesService);
    private sessionsService = inject(VehicleSessionsService);
    private geolocationService = inject(GeolocationService);
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private destroyRef = inject(DestroyRef);
    private notyf = new Notyf();

    // Signals
    isLoading = signal(true);
    isSubmitting = signal(false);
    hasGeolocationPermission = signal(false);
    currentDateTime = signal(new Date());
    currentLocation = signal<GeoLocation | null>(null);

    availableDrivers = signal<Driver[]>([]);
    availableVehicles = signal<Vehicle[]>([]);
    selectedDriver = signal<Driver | null>(null);
    selectedVehicle = signal<Vehicle | null>(null);

    form: FormGroup = this.fb.group({
        driverId       : [ '', [ Validators.required ] ],
        vehicleId      : [ '', [ Validators.required ] ],
        initialOdometer: [ '', [ Validators.required, Validators.min(0) ] ],
        observations   : [ '', [ Validators.maxLength(500) ] ]
    });

    ngOnInit() {
        const intervalId = window.setInterval(() => {
            this.currentDateTime.set(new Date());
        }, 1000);

        this.geolocationService
            .getCurrentPosition()
            .pipe(
                take(1),
                takeUntilDestroyed(this.destroyRef),
                catchError(() => {
                    this.notyf.error({
                        message:
                            'No se pudo acceder a la ubicación GPS. Por favor, asegúrese de que está habilitada.'
                    });
                    this.hasGeolocationPermission.set(false);
                    return of(null);
                })
            )
            .subscribe(location => {
                if (location) {
                    this.currentLocation.set(location);
                    this.hasGeolocationPermission.set(true);
                }
            });

        // this.destroyRef.onDestroy(() => dialogRef && dialogRef.close());
        this.destroyRef.onDestroy(() => clearInterval(intervalId));

        this.loadData();

        this.form
            .get('driverId')!
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(id => {
                if (!id) {
                    this.selectedDriver.set(null);
                } else {
                    this.fetchDriverDetails(id);
                }
            });

        this.form
            .get('vehicleId')!
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(id => {
                if (!id) {
                    this.selectedVehicle.set(null);
                } else {
                    this.fetchVehicleDetails(id);
                }
            });
    }

    ngAfterViewInit() {
        // Check if gps permissions it is granted
        if (this.hasGeolocationPermission()) return;

        // Check if we've already shown the dialog in this session
        const hasShownGpsWarning = localStorage.getItem('hasShownGpsWarning');
        if (hasShownGpsWarning) return;

        setTimeout(() => {
            this.dialog.open(GpsWarningDialogComponent, {
                width       : '400px',
                disableClose: true
            });
            // Mark that we've shown the dialog in this session
            localStorage.setItem('hasShownGpsWarning', 'true');
        });
    }

    private loadData(): void {
        this.isLoading.set(true);

        const drivers$ = firstValueFrom(this.driversService.findAll()).then(
            result => {
                this.availableDrivers.set(result.items);
                if (result.total === 0) this.notyf.error({message: 'No hay conductores disponibles actualmente', duration: 5_000, ripple: true});
            }
        );
        const vehicles$ = firstValueFrom(
            this.vehiclesService.findAvailableVehicles()
        ).then(result => {
            this.availableVehicles.set(result.items);
            if (result.total === 0)
                this.notyf.error({
                    message : 'No hay vehículos disponibles actualmente',
                    duration: 5_000,
                    ripple  : false
                });
        });

        Promise.all([ drivers$, vehicles$ ]).then(() => {
            this.isLoading.set(false);
        });
    }

    private fetchDriverDetails(id: string): void {
        firstValueFrom(this.driversService.findById(id))
            .then(driver => this.selectedDriver.set(driver))
            .catch(() =>
                this.notyf.error({message: 'Error al cargar detalles del conductor'})
            );
    }

    private fetchVehicleDetails(id: string): void {
        firstValueFrom(this.vehiclesService.findById(id))
            .then(vehicle => {
                this.selectedVehicle.set(vehicle);
                this.form.patchValue({
                    initialOdometer: vehicle.lastKnownOdometer || 0
                });
            })
            .catch(() =>
                this.notyf.error({message: 'Error al cargar detalles del vehículo'})
            );
    }

    async startVehicleSession(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.notyf.error({
                message: 'Por favor, complete todos los campos requeridos'
            });
            return;
        }

        if (!this.currentLocation()) {
            this.notyf.error({
                message:
                    'No se pudo obtener la ubicación actual. Por favor, asegúrese de que el GPS está habilitado.'
            });
            return;
        }

        this.isSubmitting.set(true);

        try {
            const location = await firstValueFrom(
                this.geolocationService.getCurrentPosition().pipe(
                    takeUntilDestroyed(this.destroyRef),
                    catchError((error) => {
                        console.error('Error getting current position:', error);
                        return of(null);
                    })
                )
            );
            if (location) this.currentLocation.set(location);

            const fv = this.form.value;
            const newSession: NewVehicleSessionDto = {
                driverId       : fv.driverId,
                vehicleId      : fv.vehicleId,
                initialOdometer: parseFloat(fv.initialOdometer),
                initialLocation: this.currentLocation(),
                observations   : fv.observations || null
            };

            const session = await firstValueFrom(
                this.sessionsService.startSession(newSession).pipe(
                    catchError(err => {
                        this.notyf.error({
                            message: 'Error al iniciar la sesión: ' + err.message
                        });
                        return of<VehicleSession | null>(null);
                    })
                )
            );

            if (session) {
                this.notyf.success({
                    message: 'Sesión de vehículo iniciada correctamente'
                });
                this.form.reset();

                try {
                    const vehicles = await firstValueFrom(
                        this.vehiclesService.findAvailableVehicles()
                    );
                    this.availableVehicles.set(vehicles.items);
                } catch {
                    this.notyf.error({
                        message: 'Error al cargar vehículos disponibles'
                    });
                }

                void this.router.navigate([ '/logistics/active-sessions' ]);
            }
        } catch (err: any) {
            this.notyf.error({
                message: `Error inesperado al iniciar la sesión: ${
                    err?.message ?? err
                }`
            });
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
