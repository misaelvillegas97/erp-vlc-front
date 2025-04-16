import { Component, inject, OnInit }                               from '@angular/core';
import { CommonModule }                                            from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule }                                         from '@angular/material/button';
import { MatCardModule }                                           from '@angular/material/card';
import { MatDialog, MatDialogModule }                              from '@angular/material/dialog';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatIconModule }                                           from '@angular/material/icon';
import { MatInputModule }                                          from '@angular/material/input';
import { MatProgressSpinnerModule }                                from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule }                    from '@angular/router';
import { TranslocoService }                                        from '@ngneat/transloco';
import { Notyf }                                                   from 'notyf';
import { catchError, finalize, forkJoin, of, switchMap, tap }      from 'rxjs';
import { PageHeaderComponent }                                     from '@layout/components/page-header/page-header.component';
import { FinishSessionDto, GeoLocation, VehicleSession }           from '../../domain/model/vehicle-session.model';
import { Driver }                                                  from '../../domain/model/driver.model';
import { Vehicle }                                                 from '../../domain/model/vehicle.model';
import { DriversService }                                          from '../../services/drivers.service';
import { GeolocationService }                                      from '../../services/geolocation.service';
import { VehicleSessionsService }                                  from '../../services/vehicle-sessions.service';
import { VehiclesService }                                         from '../../services/vehicles.service';
import { ConfirmDialogComponent }                                  from '../active-sessions/confirm-dialog.component';
import { environment }                                             from 'environments/environment';

@Component({
    selector   : 'app-finish-session',
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
        ReactiveFormsModule,
        RouterModule,
        PageHeaderComponent
    ],
    templateUrl: './finish-session.component.html'
})
export class FinishSessionComponent implements OnInit {
    readonly #fb = inject(FormBuilder);
    readonly #route = inject(ActivatedRoute);
    readonly #router = inject(Router);
    readonly #dialog = inject(MatDialog);
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();
    readonly #sessionsService = inject(VehicleSessionsService);
    readonly #driversService = inject(DriversService);
    readonly #vehiclesService = inject(VehiclesService);
    readonly #geolocationService = inject(GeolocationService);

    // Variables de estado
    isLoading = true;
    isSubmitting = false;
    sessionId: string;
    session: VehicleSession;
    driver: Driver;
    vehicle: Vehicle;
    elapsedMinutes = 0;

    // Control de archivos
    uploadedFiles: File[] = [];
    uploadedPhotoPreviews: string[] = [];

    // Control de datos automáticos
    currentLocation: GeoLocation | null = null;

    // Formulario
    form: FormGroup = this.#fb.group({
        finalOdometer: [ '', [
            Validators.required,
            Validators.min(0),
            // Control dinámico para validar que finalOdometer > initialOdometer
            // Se configura cuando se carga la sesión
        ] ],
        incidents    : [ '', [ Validators.maxLength(500) ] ]
    });

    ngOnInit(): void {
        this.sessionId = this.#route.snapshot.paramMap.get('id');
        if (!this.sessionId) {
            this.#notyf.error({message: 'ID de sesión no válido'});
            this.#router.navigate([ '/logistics/active-sessions' ]);
            return;
        }

        // Obtener la ubicación actual
        this.#geolocationService.getCurrentPosition().subscribe({
            next : (location) => {
                this.currentLocation = location;
            },
            error: (err) => {
                this.#notyf.error({message: 'No se pudo obtener la ubicación actual'});
            }
        });

        // Cargar datos de la sesión
        this.loadSessionData();
    }

    loadSessionData(): void {
        this.isLoading = true;

        this.#sessionsService.findById(this.sessionId).pipe(
            tap(session => {
                this.session = session;

                // Calcular tiempo transcurrido
                const startTime = new Date(session.startTimestamp).getTime();
                const currentTime = new Date().getTime();
                this.elapsedMinutes = Math.floor((currentTime - startTime) / (60 * 1000));

                // Configurar validador para odómetro final
                const initialOdometerValue = session.initialOdometer;
                this.form.get('finalOdometer').addValidators(
                    Validators.min(initialOdometerValue + 1)
                );
                this.form.get('finalOdometer').updateValueAndValidity();
            }),
            switchMap(session => {
                // Cargar datos del conductor y vehículo en paralelo
                return forkJoin({
                    driver : this.#driversService.findById(session.driverId),
                    vehicle: this.#vehiclesService.findById(session.vehicleId)
                });
            }),
            tap(({driver, vehicle}) => {
                this.driver = driver;
                this.vehicle = vehicle;

                // Pre-rellenar el campo de odómetro final con un valor sugerido
                this.form.get('finalOdometer').setValue(vehicle.lastKnownOdometer);
            }),
            catchError(error => {
                this.#notyf.error({message: 'Error al cargar los datos de la sesión'});
                this.#router.navigate([ '/logistics/active-sessions' ]);
                return of(null);
            }),
            finalize(() => {
                this.isLoading = false;
            })
        ).subscribe();
    }

    onFileSelected(event: Event): void {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            // Limitar a 5 archivos
            const remainingSlots = 5 - this.uploadedFiles.length;
            const filesToAdd = Array.from(files).slice(0, remainingSlots);

            filesToAdd.forEach(file => {
                if (file.type.startsWith('image/')) {
                    // Agregar archivo a la lista
                    this.uploadedFiles.push(file);

                    // Generar preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.uploadedPhotoPreviews.push(e.target.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    this.#notyf.error({message: 'Solo se permiten archivos de imagen'});
                }
            });

            // Restablecer input file para permitir seleccionar el mismo archivo
            (event.target as HTMLInputElement).value = '';
        }
    }

    removeFile(index: number): void {
        this.uploadedFiles.splice(index, 1);
        this.uploadedPhotoPreviews.splice(index, 1);
    }

    formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${ hours }h ${ mins }m`;
    }

    calculateDistance(): number {
        if (this.form.get('finalOdometer').valid && this.session) {
            const finalOdometer = this.form.get('finalOdometer').value;
            return finalOdometer - this.session.initialOdometer;
        }
        return 0;
    }

    confirmFinish(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.#notyf.error({message: 'Por favor, complete correctamente todos los campos requeridos'});
            return;
        }

        if (!this.currentLocation) {
            this.#notyf.error({message: 'No se pudo obtener la ubicación actual. Intente de nuevo.'});
            return;
        }

        const dialogRef = this.#dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data : {
                title  : 'Confirmar finalización',
                message: '¿Está seguro que desea finalizar esta sesión de vehículo? Esta acción no se puede deshacer.'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.finishSession();
            }
        });
    }

    finishSession(): void {
        this.isSubmitting = true;

        const finishData: FinishSessionDto = {
            finalOdometer: this.form.value.finalOdometer,
            finalLocation: this.currentLocation,
            incidents    : this.form.value.incidents || '',
            photos       : this.uploadedFiles
        };

        this.#sessionsService.finishSession(this.sessionId, finishData).pipe(
            tap(session => {
                this.#notyf.success({message: 'Sesión de vehículo finalizada correctamente'});
                this.#router.navigate([ '/logistics/active-sessions' ]);
            }),
            catchError(error => {
                this.#notyf.error({message: 'Error al finalizar la sesión: ' + error.message});
                return of(null);
            }),
            finalize(() => {
                this.isSubmitting = false;
            })
        ).subscribe();
    }

    /**
     * Genera la URL para el mapa estático que muestra tanto la ubicación inicial como la final
     * @returns URL de la imagen del mapa estático
     */
    getStaticMapUrl(): string {
        if (!this.currentLocation || !this.session?.initialLocation) {
            return '';
        }

        // Obtenemos las ubicaciones inicial y final
        const startLocation = this.session.initialLocation;
        const endLocation = this.currentLocation;

        // Calculamos el centro del mapa (punto medio entre ambas ubicaciones)
        const centerLat = (startLocation.latitude + endLocation.latitude) / 2;
        const centerLng = (startLocation.longitude + endLocation.longitude) / 2;

        // Configuramos los parámetros del mapa
        const zoom = 13; // Nivel de zoom (más bajo para que se vean ambos puntos)
        const size = '600x300'; // Tamaño de la imagen
        const scale = 2; // Factor de escala para pantallas de alta densidad
        const mapType = 'roadmap'; // Tipo de mapa

        // Marcadores: azul para ubicación inicial, rojo para ubicación final
        const startMarker = `markers=color:blue%7Clabel:I%7C${ startLocation.latitude },${ startLocation.longitude }`;
        const endMarker = `markers=color:red%7Clabel:F%7C${ endLocation.latitude },${ endLocation.longitude }`;

        // Usar la API key configurada en el entorno
        const apiKey = environment.GMAPS_API_KEY;

        // Generamos una ruta si las ubicaciones están suficientemente separadas
        // (cálculo básico de distancia usando la fórmula de Haversine)
        const distance = this.calculateGeoDistance(startLocation, endLocation);
        let path = '';
        if (distance > 0.05) { // Si están separados más de 50 metros
            path = `&path=color:0x0000ff80|weight:5|${ startLocation.latitude },${ startLocation.longitude }|${ endLocation.latitude },${ endLocation.longitude }`;
        }

        // Construir la URL del mapa estático
        return `https://maps.googleapis.com/maps/api/staticmap?center=${ centerLat },${ centerLng }&zoom=${ zoom }&size=${ size }&scale=${ scale }&maptype=${ mapType }&${ startMarker }&${ endMarker }${ path }&key=${ apiKey }`;
    }

    /**
     * Calcula la distancia en kilómetros entre dos puntos geográficos
     */
    private calculateGeoDistance(point1: GeoLocation, point2: GeoLocation): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.deg2rad(point2.latitude - point1.latitude);
        const dLon = this.deg2rad(point2.longitude - point1.longitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(point1.latitude)) * Math.cos(this.deg2rad(point2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en km
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
