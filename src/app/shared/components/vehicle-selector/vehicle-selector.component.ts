import { Component, forwardRef, inject, input, OnInit, resource, signal } from '@angular/core';
import { CommonModule }                                                              from '@angular/common';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule }                                                        from '@angular/material/form-field';
import { MatInputModule }                                                            from '@angular/material/input';
import { MatAutocompleteModule }                                                     from '@angular/material/autocomplete';
import { MatIconModule }                                                             from '@angular/material/icon';
import { MatProgressSpinnerModule }                                                  from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, firstValueFrom, Observable, startWith } from 'rxjs';
import { toSignal }                                                                  from '@angular/core/rxjs-interop';
import { VehiclesService }                                                           from '@modules/admin/maintainers/vehicles/vehicles.service';
import { Vehicle }                                                                   from '@modules/admin/maintainers/vehicles/domain/model/vehicle';
import { FindCount }                                                      from '@shared/domain/model/find-count';

export { Vehicle };

@Component({
    selector  : 'app-vehicle-selector',
    standalone: true,
    imports   : [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    providers : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VehicleSelectorComponent),
            multi      : true
        }
    ],
    template  : `
        <mat-form-field class="w-full fuse-mat-dense">
            <mat-label>{{ label() }}</mat-label>

            <input
                matInput
                [formControl]="searchControl"
                [matAutocomplete]="auto"
                [placeholder]="placeholder()"
                [disabled]="disabled()"
            />

            @if (filteredVehicles.isLoading()) {
                <mat-spinner matSuffix diameter="20"></mat-spinner>
            } @else {
                <mat-icon matSuffix>directions_car</mat-icon>
            }

            <mat-autocomplete
                #auto="matAutocomplete"
                [displayWith]="displayFn"
                (optionSelected)="onOptionSelected($event)"
            >
                @if (filteredVehicles.value()?.length === 0 && !filteredVehicles.isLoading()) {
                    <mat-option disabled>
                        No se encontraron vehículos
                    </mat-option>
                } @else {
                    @for (vehicle of filteredVehicles.value() || []; track vehicle.id) {
                        <mat-option [value]="vehicle" [disabled]="vehicle.status === 'OUT_OF_SERVICE'">
                            <div class="flex flex-col">
                                <span class="font-medium">{{ vehicle.displayName }}</span>
                                @if (vehicle.year || vehicle.type) {
                                    <span class="text-sm text-gray-600">
                                        {{ [ vehicle.year, vehicle.type ].filter(Boolean).join(' • ') }}
                                    </span>
                                }
                            </div>
                        </mat-option>
                    }
                }
            </mat-autocomplete>

            @if (hint()) {
                <mat-hint>{{ hint() }}</mat-hint>
            }

            @if (hasError()) {
                <mat-error>{{ errorMessage() }}</mat-error>
            }
        </mat-form-field>
    `
})
export class VehicleSelectorComponent implements ControlValueAccessor, OnInit {
    private vehiclesService = inject(VehiclesService);

    // Inputs
    disabled = input<boolean>(false);
    required = input<boolean>(false);
    placeholder = input<string>('Buscar vehículo...');
    label = input<string>('Vehículo');
    hint = input<string>('Selecciona un vehículo');
    vehicleTypes = input<string[]>([]);
    vehicleStatus = input<boolean | undefined>(undefined);
    excludeIds = input<string[]>([]);
    staticVehicles = input<Vehicle[]>([]);

    // Internal state
    searchControl = new FormControl({value: '', disabled: this.disabled()});
    selectedVehicle = signal<Vehicle | null>(null);

    // Error handling
    hasError = signal<boolean>(false);
    errorMessage = signal<string>('');

    // ControlValueAccessor
    private onChange = (value: string | null) => {};
    private onTouched = () => {};

    // Search functionality
    private searchQuery = toSignal(
        this.searchControl.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ),
        {initialValue: ''}
    );

    // Resource for fetching vehicles
    filteredVehicles = resource({
        params: () => ({search: this.searchQuery()}),
        loader: async ({params}) => {
            try {
                return await firstValueFrom(this.searchVehicles(params.search)).then(findCount => findCount.items);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
                return [];
            }
        }
    });

    ngOnInit(): void {
        // Set up validation
        if (this.required()) {
            this.searchControl.addValidators(() => {
                const value = this.selectedVehicle();
                return value ? null : {required: true};
            });
        }

        if (!(this.staticVehicles()?.length > 0)) this.searchVehicles();
    }

    // Search function for dynamic vehicle loading
    private searchVehicles(query?: string): Observable<FindCount<Vehicle>> {
        // Build query parameters
        const params: any = {
            search: query,
            limit : 20
        };

        // Add type filter if specified
        const vehicleTypes = this.vehicleTypes();
        if (vehicleTypes.length > 0) {
            params.types = vehicleTypes.join(',');
        }

        // Add vehicle status filter if specified
        const vehicleStatus = this.vehicleStatus();
        if (vehicleStatus !== undefined) {
            params.active = vehicleStatus;
        }

        // Add exclude IDs if specified
        const excludeIds = this.excludeIds();
        if (excludeIds.length > 0) {
            params.excludeIds = excludeIds.join(',');
        }

        return this.vehiclesService.findByQuery(params);
    }

    // ControlValueAccessor implementation
    writeValue(value: string | null): void {
        if (value) {
            // Find the vehicle that matches the value
            const vehicle = this.staticVehicles().find(v => v.id === value);
            if (vehicle) {
                this.selectedVehicle.set(vehicle);
                this.searchControl.setValue(`${ vehicle.brand } ${ vehicle.model } (${ vehicle.licensePlate })`, {emitEvent: false});
            }
        } else {
            this.selectedVehicle.set(null);
            this.searchControl.setValue('', {emitEvent: false});
        }
    }

    registerOnChange(fn: (value: string | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.searchControl.disable();
        } else {
            this.searchControl.enable();
        }
    }

    // Event handlers
    onOptionSelected(event: any): void {
        const vehicle = event.option.value as Vehicle;
        this.selectedVehicle.set(vehicle);
        this.onChange(vehicle.id);
        this.onTouched();
        this.hasError.set(false);
    }

    displayFn = (vehicle: Vehicle | string): string => {
        if (typeof vehicle === 'string') {
            return vehicle;
        }
        return vehicle ? `${ vehicle.brand } ${ vehicle.model } (${ vehicle.licensePlate })` : '';
    };

    // Validation
    validate(): void {
        if (this.required() && !this.selectedVehicle()) {
            this.hasError.set(true);
            this.errorMessage.set('Este campo es requerido');
        } else {
            this.hasError.set(false);
            this.errorMessage.set('');
        }
    }

    protected readonly Boolean = Boolean;
}
