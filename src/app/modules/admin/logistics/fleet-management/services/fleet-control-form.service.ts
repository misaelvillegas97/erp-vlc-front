import { Injectable, inject, signal, computed }                                               from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { toSignal }                                                                           from '@angular/core/rxjs-interop';

import { UserService } from '@core/user/user.service';
import { RoleEnum }    from '@core/user/role.type';
import { Vehicle }     from '../domain/model/vehicle.model';

/**
 * Service to manage the fleet control form logic and validation.
 * Extracted from FleetControlComponent to improve separation of concerns.
 */
@Injectable({
    providedIn: 'root'
})
export class FleetControlFormService {
    private readonly userService = inject(UserService);
    private readonly fb = inject(FormBuilder);

    // Tolerancia permitida para el odómetro (en kilómetros)
    readonly ODOMETER_TOLERANCE = 100;

    // Current user signals
    currentUser = toSignal(this.userService.user$);
    currentUserIsDriver = computed(() => this.currentUser()?.role.id === RoleEnum.driver);

    // Selected vehicle for odometer validation
    selectedVehicle = signal<Vehicle | null>(null);

    /**
     * Creates the fleet control form with proper validation and initial values.
     * @returns FormGroup configured for fleet control
     */
    createForm(): FormGroup {
        return this.fb.group({
            driverId       : [
                this.currentUserIsDriver()
                    ? {value: this.currentUser()?.id, disabled: true}
                    : undefined,
                [ Validators.required ]
            ],
            vehicleId      : [ '', [ Validators.required ] ],
            initialOdometer: [
                '',
                [
                    Validators.required,
                    Validators.min(0),
                    this.createOdometerToleranceValidator()
                ]
            ],
            purpose        : [ '', [ Validators.maxLength(500) ] ]
        });
    }

    /**
     * Updates the selected vehicle and adjusts form validation accordingly.
     * @param vehicle The selected vehicle
     * @param form The form to update
     */
    updateSelectedVehicle(vehicle: Vehicle | null, form: FormGroup): void {
        this.selectedVehicle.set(vehicle);

        if (vehicle) {
            // Update odometer field with last known value
            form.patchValue({
                initialOdometer: vehicle.lastKnownOdometer || 0
            });

            // Force revalidation of odometer field
            const odometerControl = form.get('initialOdometer');
            if (odometerControl) {
                odometerControl.updateValueAndValidity();
            }
        }
    }

    /**
     * Validates form and returns validation result.
     * @param form The form to validate
     * @returns Object with validation status and errors
     */
    validateForm(form: FormGroup): { isValid: boolean; errors: string[] } {
        if (form.valid) {
            return {isValid: true, errors: []};
        }

        const errors: string[] = [];

        Object.keys(form.controls).forEach(key => {
            const control = form.get(key);
            if (control && control.errors) {
                if (control.errors['required']) {
                    errors.push(`${ this.getFieldDisplayName(key) } es requerido`);
                }
                if (control.errors['min']) {
                    errors.push(`${ this.getFieldDisplayName(key) } debe ser mayor a 0`);
                }
                if (control.errors['maxlength']) {
                    errors.push(`${ this.getFieldDisplayName(key) } excede la longitud máxima`);
                }
                if (control.errors['odometerTolerance']) {
                    const error = control.errors['odometerTolerance'];
                    errors.push(
                        `El odómetro debe estar entre ${ error.lastKnown - this.ODOMETER_TOLERANCE } y ${ error.lastKnown + this.ODOMETER_TOLERANCE } km`
                    );
                }
            }
        });

        return {isValid: false, errors};
    }

    /**
     * Gets the display name for form fields.
     * @param fieldName The field name
     * @returns Display name for the field
     */
    private getFieldDisplayName(fieldName: string): string {
        const fieldNames: Record<string, string> = {
            driverId       : 'Conductor',
            vehicleId      : 'Vehículo',
            initialOdometer: 'Odómetro inicial',
            purpose        : 'Propósito'
        };
        return fieldNames[fieldName] || fieldName;
    }

    /**
     * Creates a custom validator for odometer tolerance validation.
     * Validates that the initial odometer reading is within acceptable tolerance
     * of the vehicle's last known odometer reading.
     * @returns ValidatorFn for odometer tolerance validation
     */
    private createOdometerToleranceValidator(): ValidatorFn {
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
}
