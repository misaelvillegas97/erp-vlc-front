import { Component, computed, inject, signal }                     from '@angular/core';
import { CommonModule }                                            from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule }                                         from '@angular/material/button';
import { MatCardModule }                                           from '@angular/material/card';
import { MatDatepickerModule }                                     from '@angular/material/datepicker';
import { MatNativeDateModule }                                     from '@angular/material/core';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatIconModule }                                           from '@angular/material/icon';
import { MatInputModule }                                          from '@angular/material/input';
import { MatSelectModule }                                         from '@angular/material/select';
import { MatStepperModule }                                        from '@angular/material/stepper';
import { MatTooltipModule }                                        from '@angular/material/tooltip';
import { PageHeaderComponent }                                     from '@layout/components/page-header/page-header.component';
import { FuelRecordsService }                                      from '../../../../services/fuel-records.service';
import { Router }                                                  from '@angular/router';
import { NotyfService }                                            from '@shared/services/notyf.service';
import { debounceTime, firstValueFrom }                            from 'rxjs';
import { Vehicle }                                                 from '../../../../domain/model/vehicle.model';
import { FuelRecord }                                              from '../../../../domain/model/fuel-record.model';
import BigNumber                                                   from 'bignumber.js';
import { toSignal }                                                from '@angular/core/rxjs-interop';

// Mock service for vehicles - replace with actual service when available
class VehicleService {
    getVehicles() {
        return Promise.resolve({
            items: [
                {
                    id               : 'v1',
                    brand            : 'Toyota',
                    model            : 'Corolla',
                    licensePlate     : 'ABC-123',
                    fuelType         : 'Gasolina',
                    lastKnownOdometer: 11000
                },
                {
                    id               : 'v2',
                    brand            : 'Honda',
                    model            : 'Civic',
                    licensePlate     : 'XYZ-789',
                    fuelType         : 'Gasolina',
                    lastKnownOdometer: 5400
                }
            ] as Vehicle[]
        });
    }
}

@Component({
    selector   : 'app-register',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatStepperModule,
        MatTooltipModule,
        PageHeaderComponent
    ],
    providers  : [
        {provide: VehicleService, useClass: VehicleService} // Replace with actual service
    ],
    templateUrl: './register.component.html'
})
export class RegisterComponent {
    private readonly fb = inject(FormBuilder);
    private readonly fuelRecordsService = inject(FuelRecordsService);
    private readonly vehicleService = inject(VehicleService);
    private readonly router = inject(Router);
    private readonly notyf = inject(NotyfService);

    // Form
    fuelForm: FormGroup = this.fb.group({
        vehicleId      : [ '', Validators.required ],
        date           : [ new Date(), Validators.required ],
        initialOdometer: [ {value: 0, disabled: true}, [ Validators.required, Validators.min(0) ] ],
        finalOdometer  : [ 0, [ Validators.required, Validators.min(0) ] ],
        liters         : [ 0, [ Validators.required, Validators.min(0.1) ] ],
        cost           : [ 0, [ Validators.required, Validators.min(1) ] ],
        notes          : [ '' ]
    });

    // State
    isLoading = signal(false);
    vehicles = signal<Vehicle[]>([]);
    selectedVehicle = signal<Vehicle | null>(null);

    // Control signals
    initialOdometerSignal = toSignal(this.fuelForm.get('initialOdometer')?.valueChanges.pipe(debounceTime(300)), {initialValue: 0});
    finalOdometerSignal = toSignal(this.fuelForm.get('finalOdometer')?.valueChanges.pipe(debounceTime(300)), {initialValue: 0});
    litersSignal = toSignal(this.fuelForm.get('liters')?.valueChanges.pipe(debounceTime(300)), {initialValue: 0});
    costSignal = toSignal(this.fuelForm.get('cost')?.valueChanges.pipe(debounceTime(300)), {initialValue: 0});

    // Computed values
    distance = computed(() => {
        const initial = this.initialOdometerSignal() || 0;
        const final = this.finalOdometerSignal() || 0;
        return Math.max(0, final - initial);
    });

    efficiency = computed(() => {
        const distance = this.distance();
        const liters = this.litersSignal() || 0;
        if (liters <= 0) return 0;
        return new BigNumber(distance).dividedBy(liters).toNumber();
    });

    costPerKm = computed(() => {
        const distance = this.distance();
        const cost = this.costSignal() || 0;
        if (distance <= 0) return 0;
        return new BigNumber(cost).dividedBy(distance).toNumber();
    });

    constructor() {
        this.loadVehicles();
    }

    async loadVehicles(): Promise<void> {
        try {
            this.isLoading.set(true);
            const result = await this.vehicleService.getVehicles();
            this.vehicles.set(result.items);
            this.isLoading.set(false);
        } catch (error) {
            this.notyf.error('Error al cargar los vehículos');
            this.isLoading.set(false);
        }
    }

    async onVehicleChange(vehicleId: string): Promise<void> {
        if (!vehicleId) {
            this.selectedVehicle.set(null);
            this.fuelForm.get('initialOdometer')?.setValue(0);
            return;
        }

        const vehicle = this.vehicles().find(v => v.id === vehicleId);
        this.selectedVehicle.set(vehicle || null);

        if (vehicle) {
            try {
                // Get the last odometer reading from fuel records or use the vehicle's lastKnownOdometer
                const lastOdometer = await firstValueFrom(this.fuelRecordsService.getVehicleLastOdometer(vehicleId));
                const initialOdometer = lastOdometer > 0 ? lastOdometer : vehicle.lastKnownOdometer;

                this.fuelForm.get('initialOdometer')?.setValue(initialOdometer);
                // Set final odometer to initial + 1 as a starting point
                this.fuelForm.get('finalOdometer')?.setValue(initialOdometer + 1);
            } catch (error) {
                this.notyf.error('Error al obtener el último kilometraje');
            }
        }
    }

    async onSubmit(): Promise<void> {
        if (this.fuelForm.invalid) {
            this.fuelForm.markAllAsTouched();
            return;
        }

        const vehicle = this.selectedVehicle();
        if (!vehicle) {
            this.notyf.error('Debe seleccionar un vehículo');
            return;
        }

        try {
            this.isLoading.set(true);

            const formValue = this.fuelForm.getRawValue();
            const newRecord: Omit<FuelRecord, 'id' | 'createdAt'> = {
                vehicleId      : formValue.vehicleId,
                vehicleInfo    : {
                    brand       : vehicle.brand,
                    model       : vehicle.model,
                    licensePlate: vehicle.licensePlate
                },
                date           : formValue.date.toISOString(),
                initialOdometer: formValue.initialOdometer,
                finalOdometer  : formValue.finalOdometer,
                liters         : formValue.liters,
                cost           : formValue.cost,
                efficiency     : this.efficiency(),
                costPerKm      : this.costPerKm(),
                notes          : formValue.notes
            };

            await firstValueFrom(this.fuelRecordsService.createFuelRecord(newRecord));
            this.notyf.success('Registro de combustible creado correctamente');
            this.router.navigate([ '/logistics/fuel-management/list' ]);
        } catch (error) {
            this.notyf.error('Error al crear el registro de combustible');
        } finally {
            this.isLoading.set(false);
        }
    }

    resetForm(): void {
        this.fuelForm.reset({
            vehicleId      : '',
            date           : new Date(),
            initialOdometer: 0,
            finalOdometer  : 0,
            liters         : 0,
            cost           : 0,
            notes          : ''
        });
        this.selectedVehicle.set(null);
    }
}
