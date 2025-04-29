import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                                          from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators }  from '@angular/forms';
import { Router }                                                                from '@angular/router';
import { MatButtonModule }                                                       from '@angular/material/button';
import { MatCardModule }                                                         from '@angular/material/card';
import { MatDialog, MatDialogModule }                                            from '@angular/material/dialog';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatIconModule }                                                         from '@angular/material/icon';
import { MatInputModule }                                                        from '@angular/material/input';
import { MatProgressSpinnerModule }                                              from '@angular/material/progress-spinner';
import { MatSelectModule }                                                       from '@angular/material/select';
import { PageHeaderComponent }                                                   from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                 from 'notyf';
import { firstValueFrom, of }                                                    from 'rxjs';
import { catchError, finalize, switchMap, take }                                 from 'rxjs/operators';

import { DriversService }                                    from '../../services/drivers.service';
import { VehiclesService }                                   from '../../services/vehicles.service';
import { VehicleSessionsService }                            from '../../services/vehicle-sessions.service';
import { GeolocationService }                                from '../../services/geolocation.service';
import { Driver }                                            from '../../domain/model/driver.model';
import { Vehicle }                                           from '../../domain/model/vehicle.model';
import { GeoLocation, NewVehicleSessionDto, VehicleSession } from '../../domain/model/vehicle-session.model';
import { GpsWarningDialogComponent }                         from './gps-warning-dialog.component';

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
export class FleetControlComponent implements OnInit, OnDestroy {

    // Inyección de dependencias mediante inject
    readonly driversService = inject(DriversService);
    readonly vehiclesService = inject(VehiclesService);
    readonly sessionsService = inject(VehicleSessionsService);
    readonly geolocationService = inject(GeolocationService);
    readonly fb = inject(FormBuilder);
    readonly router = inject(Router);
    readonly dialog = inject(MatDialog);
    readonly notyf = new Notyf();

    // Estados gestionados con Signals
    isLoading = signal(true);
    isSubmitting = signal(false);
    hasGeolocationPermission = signal(false);
    currentDateTime = signal(new Date());
    currentLocation = signal<GeoLocation | null>(null);

    availableDrivers = signal<Driver[]>([]);
    availableVehicles = signal<Vehicle[]>([]);
    selectedDriver = signal<Driver | null>(null);
    selectedVehicle = signal<Vehicle | null>(null);

    // Formulario usando Reactive Forms (se continúa utilizando FormGroup para aprovechar las validaciones)
    form: FormGroup = this.fb.group({
        driverId       : [ '', [ Validators.required ] ],
        vehicleId      : [ '', [ Validators.required ] ],
        initialOdometer: [ '', [ Validators.required, Validators.min(0) ] ],
        observations   : [ '', [ Validators.maxLength(500) ] ]
    });

    // Signals para llevar un estado reactivo de los campos del formulario
    driverId = signal<string | null>(null);
    vehicleId = signal<string | null>(null);
    initialOdometer = signal<number | null>(null);
    observations = signal<string>('');

    // Colección para almacenar funciones de limpieza de efectos y suscripciones
    private cleanupCallbacks: Array<() => void> = [];

    ngOnInit(): void {
        // Abrir diálogo de advertencia de GPS
        this.dialog.open(GpsWarningDialogComponent, {
            width       : '400px',
            disableClose: true
        });

        // Actualizar el reloj cada segundo con setInterval y almacenar su función de limpieza
        const intervalId = setInterval(() => {
            this.currentDateTime.set(new Date());
        }, 1000);
        this.cleanupCallbacks.push(() => clearInterval(intervalId));

        // Obtener la ubicación inicial
        const locationSub = this.geolocationService.getCurrentPosition().pipe(
            catchError(error => {
                this.notyf.error({message: 'No se pudo acceder a la ubicación GPS. Por favor, asegúrese de que está habilitada.'});
                this.hasGeolocationPermission.set(false);
                return of(null);
            })
        ).subscribe(location => {
            if (location) {
                this.currentLocation.set(location);
                this.hasGeolocationPermission.set(true);
            }
        });
        this.cleanupCallbacks.push(() => locationSub.unsubscribe());

        // Cargar datos iniciales de conductores y vehículos
        this.loadData();

        // Sincronizar cambios de los campos driverId y vehicleId del formulario con signals
        const driverSub = this.form.get('driverId')?.valueChanges.subscribe(value => {
            this.driverId.set(value);
            if (!value) {
                this.selectedDriver.set(null);
            } else {
                this.fetchDriverDetails(value);
            }
        });
        const vehicleSub = this.form.get('vehicleId')?.valueChanges.subscribe(value => {
            this.vehicleId.set(value);
            if (!value) {
                this.selectedVehicle.set(null);
            } else {
                this.fetchVehicleDetails(value);
            }
        });
        // Agregar las funciones de limpieza para cancelar estas suscripciones
        if (driverSub) {
            this.cleanupCallbacks.push(() => driverSub.unsubscribe());
        }
        if (vehicleSub) {
            this.cleanupCallbacks.push(() => vehicleSub.unsubscribe());
        }
    }

    ngOnDestroy(): void {
        // Ejecutar todas las funciones de limpieza
        this.cleanupCallbacks.forEach(cleanup => cleanup());
    }

    private loadData(): void {
        this.isLoading.set(true);

        const driversPromise = firstValueFrom(this.driversService.findAll())
            .then(drivers => {
                this.availableDrivers.set(drivers.items);
                if (drivers.total === 0) this.notyf.error({message: 'No hay conductores disponibles actualmente', duration: 5000});
            })
            .catch(error => {})

        const vehiclesPromise = firstValueFrom(this.vehiclesService.findAvailableVehicles())
            .then(vehicles => {
                this.availableVehicles.set(vehicles.items);
                if (vehicles.total === 0) this.notyf.error({message: 'No hay vehículos disponibles actualmente', duration: 5000});
            })
            .catch(error => {});

        Promise.all([ driversPromise, vehiclesPromise ]).then(() => {
            this.isLoading.set(false);
        });
    }

    private fetchDriverDetails(id: string): void {
        firstValueFrom(this.driversService.findById(id))
            .then(driver => this.selectedDriver.set(driver))
            .catch(() => this.notyf.error({message: 'Error al cargar detalles del conductor'}));
    }

    private fetchVehicleDetails(id: string): void {
        firstValueFrom(this.vehiclesService.findById(id))
            .then(vehicle => {
                this.selectedVehicle.set(vehicle);
                this.form.patchValue({initialOdometer: vehicle.lastKnownOdometer || 0});
            })
            .catch(() => this.notyf.error({message: 'Error al cargar detalles del vehículo'}));
    }

    startVehicleSession(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.notyf.error({message: 'Por favor, complete todos los campos requeridos'});
            return;
        }

        if (!this.currentLocation()) {
            this.notyf.error({message: 'No se pudo obtener la ubicación actual. Por favor, asegúrese de que el GPS está habilitado.'});
            return;
        }

        this.isSubmitting.set(true);

        this.geolocationService.getCurrentPosition().pipe(
            take(1),
            catchError(() => of(null)),
            switchMap(location => {
                if (location) {
                    this.currentLocation.set(location);
                }
                const formValue = this.form.value;
                const newSession: NewVehicleSessionDto = {
                    driverId       : formValue.driverId,
                    vehicleId      : formValue.vehicleId,
                    initialOdometer: parseFloat(formValue.initialOdometer),
                    initialLocation: this.currentLocation(),
                    observations   : formValue.observations || null
                };
                return this.sessionsService.startSession(newSession).pipe(
                    take(1),
                    catchError(error => {
                        this.notyf.error({message: 'Error al iniciar la sesión: ' + error.message});
                        return of(null);
                    })
                );
            }),
            finalize(() => this.isSubmitting.set(false))
        ).subscribe((session: VehicleSession | null) => {
            if (session) {
                this.notyf.success({message: 'Sesión de vehículo iniciada correctamente'});
                this.resetForm();

                firstValueFrom(this.vehiclesService.findAvailableVehicles())
                    .then(vehicles => this.availableVehicles.set(vehicles.items))
                    .catch(error => this.notyf.error({message: 'Error al cargar vehículos disponibles'}));

                // Redirigir a la página de sesiones activas
                this.router.navigate([ '/logistics/active-sessions' ]);
            }
        });
    }

    private resetForm(): void {
        this.form.reset();
        this.driverId.set(null);
        this.vehicleId.set(null);
        this.initialOdometer.set(null);
        this.observations.set('');
    }
}
