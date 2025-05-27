import { Component, forwardRef, inject, Input, OnDestroy, OnInit, signal }                        from '@angular/core';
import { CommonModule }                                                                           from '@angular/common';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelType, MatFormFieldModule, SubscriptSizing }                                    from '@angular/material/form-field';
import { MatSelectModule }                                                                        from '@angular/material/select';
import { MatIconModule }                                                                          from '@angular/material/icon';
import { Subject, takeUntil }                                                                     from 'rxjs';
import { VehiclesService }                                                                        from '@modules/admin/logistics/fleet-management/services/vehicles.service';
import { Vehicle }                                                                                from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';

@Component({
    selector   : 'vehicle-selector',
    standalone : true,
    imports    : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule
    ],
    templateUrl: './vehicle-selector.component.html',
    providers  : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VehicleSelectorComponent),
            multi      : true
        }
    ]
})
export class VehicleSelectorComponent implements ControlValueAccessor, OnInit, OnDestroy {
    private readonly vehiclesService = inject(VehiclesService);
    private readonly destroy$ = new Subject<void>();

    @Input() label = 'Vehículo';
    @Input() placeholder = 'Seleccionar vehículo';
    @Input() includeAllOption = true;
    @Input() allOptionLabel = 'Todos';
    @Input() hideLabel = false;
    @Input() floatLabel: FloatLabelType = 'always';
    @Input() subscriptSizing: SubscriptSizing = 'fixed';
    @Input() controlClasses: string;
    @Input() required = false;

    vehicles = signal<Vehicle[]>([]);
    loading = signal<boolean>(false);
    vehicleControl = new FormControl<string>('');

    // ControlValueAccessor implementation
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    ngOnInit(): void {
        // Subscribe to value changes
        this.vehicleControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(value => {
                this.onChange(value);
            });

        // Load vehicles
        this.loadVehicles();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Load vehicles from service
    private loadVehicles(): void {
        this.loading.set(true);
        this.vehiclesService.findAll({sortBy: 'licensePlate', sortOrder: 'ASC'})
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next : (response) => {
                    this.vehicles.set(response.items);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                }
            });
    }

    // ControlValueAccessor methods
    writeValue(value: string): void {
        this.vehicleControl.setValue(value, {emitEvent: false});
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.vehicleControl.disable();
        } else {
            this.vehicleControl.enable();
        }
    }

    // Mark as touched when the control is blurred
    onBlur(): void {
        this.onTouched();
    }
}
