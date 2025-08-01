import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                                                                                    from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router }                                                                                          from '@angular/router';
import { MatButtonModule }                                                                                 from '@angular/material/button';
import { MatCardModule }                                                                                   from '@angular/material/card';
import { MatDialog, MatDialogModule }                                                                      from '@angular/material/dialog';
import { MatFormFieldModule }                                                                              from '@angular/material/form-field';
import { MatIconModule }                                                                                   from '@angular/material/icon';
import { MatInputModule }                                                                                  from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                        from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                                 from '@angular/material/select';
import { PageHeaderComponent }                                                                             from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                                           from 'notyf';
import { firstValueFrom, of }                                                                              from 'rxjs';
import { catchError, take }                                                                                from 'rxjs/operators';
import { takeUntilDestroyed, toSignal }                                                                    from '@angular/core/rxjs-interop';

import { DriversService }                                    from '@modules/admin/logistics/fleet-management/services/drivers.service';
import { VehiclesService }                                   from '@modules/admin/logistics/fleet-management/services/vehicles.service';
import { VehicleSessionsService }                            from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { GeolocationService }                                from '@modules/admin/logistics/fleet-management/services/geolocation.service';
import { HapticFeedbackService }                                                                           from '@modules/admin/logistics/fleet-management/services/haptic-feedback.service';
import { FleetAnimationsService }                                                                          from '@modules/admin/logistics/fleet-management/services/fleet-animations.service';
import { GeoLocation, NewVehicleSessionDto, VehicleSession } from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { GpsWarningDialogComponent }                         from './gps-warning-dialog.component';
import { Driver }                                            from '@modules/admin/logistics/fleet-management/domain/model/driver.model';
import { Vehicle }                                           from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';
import { UserService }                                       from '@core/user/user.service';
import { RoleEnum }                                          from '@core/user/role.type';
import { VehicleSelectorComponent }                          from '@shared/controls/components/vehicle-selector/vehicle-selector.component';
import { DriverSelectorComponent }                                                                         from '@shared/controls';
import { HapticClickDirective }                                                                            from '@modules/admin/logistics/fleet-management/directives/haptic-click.directive';

@Component({
    selector   : 'app-fleet-control',
    standalone : true,
    imports: [
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
        PageHeaderComponent,
        VehicleSelectorComponent,
        DriverSelectorComponent,
        HapticClickDirective
    ],
    animations: [
        FleetAnimationsService.buttonPress,
        FleetAnimationsService.sessionStateChange,
        FleetAnimationsService.gpsIndicator,
        FleetAnimationsService.fadeInOut,
        FleetAnimationsService.dataLoading
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fleet-control.component.html'
})
export class FleetControlComponent implements OnInit, AfterViewInit {
    readonly #driversService = inject(DriversService);
    readonly #vehiclesService = inject(VehiclesService);
    readonly #sessionsService = inject(VehicleSessionsService);
    readonly #geolocationService = inject(GeolocationService);
    readonly #hapticService = inject(HapticFeedbackService);
    readonly #userService = inject(UserService);

    readonly #fb = inject(FormBuilder);
    readonly #router = inject(Router);
    readonly #dialog = inject(MatDialog);
    readonly #destroyRef = inject(DestroyRef);
    private notyf = new Notyf();

    // Tolerancia permitida para el odómetro (en kilómetros)
    readonly ODOMETER_TOLERANCE = 100;

    /**
     * Validador personalizado para verificar que el odómetro inicial esté dentro de la tolerancia permitida
     * respecto al último odómetro conocido del vehículo.
     * Permite que el odómetro sea mayor o hasta ODOMETER_TOLERANCE km menor que el último conocido.
     */
    private odometerToleranceValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;

            // Si no hay valor o no hay vehículo seleccionado, no validamos
            if (value === null || value === undefined || !this.selectedVehicle()) {
                return null;
            }

            const lastKnownOdometer = this.selectedVehicle()?.lastKnownOdometer || 0;

            // Permitimos que el odómetro sea mayor o hasta ODOMETER_TOLERANCE km menor que el último conocido
            if (value < lastKnownOdometer - this.ODOMETER_TOLERANCE) {
                return {
                    odometerTolerance: {
                        lastKnown: lastKnownOdometer,
                        current  : value,
                        tolerance: this.ODOMETER_TOLERANCE
                    }
                };
            }

            return null;
        };
    }

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

    // Estado para animaciones
    buttonPressed = signal(false);
    sessionState = signal<'idle' | 'starting' | 'active'>('idle');
    gpsState = signal<'active' | 'inactive'>('inactive');

    currentUser = toSignal(this.#userService.user$);
    currentUserIsDriver = computed(() => this.currentUser()?.role.id === RoleEnum.driver);

    form: FormGroup = this.#fb.group({
        driverId: [ this.currentUserIsDriver() ? {value: this.currentUser().id, disabled: true} : undefined, [ Validators.required ] ],
        vehicleId      : [ '', [ Validators.required ] ],
        initialOdometer: [ '', [ Validators.required, Validators.min(0), this.odometerToleranceValidator() ] ],
        purpose : [ '', [ Validators.maxLength(500) ] ]
    });

    ngOnInit() {
        const intervalId = window.setInterval(() => this.currentDateTime.set(new Date()), 1000);

        this.#geolocationService
            .getCurrentPosition()
            .pipe(
                take(1),
                takeUntilDestroyed(this.#destroyRef),
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
        this.#destroyRef.onDestroy(() => clearInterval(intervalId));

        this.loadData();

        this.form
            .get('driverId')!
            .valueChanges.pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(id => {
                if (!id) {
                    this.selectedDriver.set(null);
                } else {
                    this.fetchDriverDetails(id);
                }
            });

        this.form
            .get('vehicleId')!
            .valueChanges.pipe(takeUntilDestroyed(this.#destroyRef))
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
            this.#dialog.open(GpsWarningDialogComponent, {
                width       : '400px',
                disableClose: true
            });
            // Mark that we've shown the dialog in this session
            localStorage.setItem('hasShownGpsWarning', 'true');
        });
    }

    private loadData(): void {
        this.isLoading.set(true);

        const drivers$ = firstValueFrom(this.#driversService.findAll()).then(
            result => {
                this.availableDrivers.set(result.items);
                if (result.total === 0) this.notyf.error({message: 'No hay conductores disponibles actualmente', duration: 5_000, ripple: true});
            }
        );
        const vehicles$ = firstValueFrom(
            this.#vehiclesService.findAvailableVehicles()
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
        firstValueFrom(this.#driversService.findById(id))
            .then(driver => this.selectedDriver.set(driver))
            .catch(() =>
                this.notyf.error({message: 'Error al cargar detalles del conductor'})
            );
    }

    private fetchVehicleDetails(id: string): void {
        firstValueFrom(this.#vehiclesService.findById(id))
            .then(vehicle => {
                this.selectedVehicle.set(vehicle);

                // Actualizar el valor del odómetro con el último conocido
                this.form.patchValue({
                    initialOdometer: vehicle.lastKnownOdometer || 0
                });

                // Forzar la revalidación del campo de odómetro para aplicar la validación de tolerancia
                const odometerControl = this.form.get('initialOdometer');
                if (odometerControl) {
                    odometerControl.updateValueAndValidity();
                }
            })
            .catch(() =>
                this.notyf.error({message: 'Error al cargar detalles del vehículo'})
            );
    }

    async startVehicleSession(): Promise<void> {
        // Feedback háptico al presionar el botón
        this.#hapticService.buttonPress();
        this.buttonPressed.set(true);
        setTimeout(() => this.buttonPressed.set(false), 150);

        if (this.form.invalid) {
            this.#hapticService.errorAction();
            this.form.markAllAsTouched();
            this.notyf.error({
                message: 'Por favor, complete todos los campos requeridos'
            });
            return;
        }

        if (!this.currentLocation()) {
            this.#hapticService.errorAction();
            this.notyf.error({
                message:
                    'No se pudo obtener la ubicación actual. Por favor, asegúrese de que el GPS está habilitado.'
            });
            return;
        }

        this.isSubmitting.set(true);
        this.sessionState.set('starting');

        try {
            const location = await firstValueFrom(
                this.#geolocationService.getCurrentPosition().pipe(
                    takeUntilDestroyed(this.#destroyRef),
                    catchError((error) => {
                        console.error('Error getting current position:', error);
                        return of(null);
                    })
                )
            );
            if (location) this.currentLocation.set(location);

            const fv = this.form.getRawValue();
            const newSession: NewVehicleSessionDto = {
                driverId       : fv.driverId,
                vehicleId      : fv.vehicleId,
                initialOdometer: parseFloat(fv.initialOdometer),
                initialLocation: this.currentLocation(),
                purpose: fv.observations || null
            };

            const session = await firstValueFrom(
                this.#sessionsService.startSession(newSession).pipe(
                    catchError(err => {
                        this.notyf.error({
                            message: 'Error al iniciar la sesión: ' + err.message
                        });
                        return of<VehicleSession | null>(null);
                    })
                )
            );

            if (session) {
                // Feedback háptico de éxito
                this.#hapticService.sessionStart();
                this.sessionState.set('active');
                
                this.notyf.success({
                    message: 'Sesión de vehículo iniciada correctamente'
                });
                this.form.reset();

                try {
                    const vehicles = await firstValueFrom(
                        this.#vehiclesService.findAvailableVehicles()
                    );
                    this.availableVehicles.set(vehicles.items);
                } catch {
                    this.#hapticService.errorAction();
                    this.notyf.error({
                        message: 'Error al cargar vehículos disponibles'
                    });
                }

                // Pequeño delay para mostrar la animación antes de navegar
                setTimeout(() => {
                    void this.#router.navigate([ '/logistics/fleet-management/active-sessions' ]);
                }, 500);
            }
        } catch (err: any) {
            this.#hapticService.errorAction();
            this.sessionState.set('idle');
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
