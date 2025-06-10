import { Component, forwardRef, inject, input, OnDestroy, OnInit, resource, signal }                          from '@angular/core';
import { CommonModule }                                                                                       from '@angular/common';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabelType, MatFormFieldModule, SubscriptSizing }                                                from '@angular/material/form-field';
import { MatInputModule }                                                                                     from '@angular/material/input';
import { MatIconModule }                                                                                      from '@angular/material/icon';
import { MatAutocompleteModule }                                                                              from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, first, firstValueFrom, Subject, takeUntil }                      from 'rxjs';
import { DriversService }                                                                                     from '@modules/admin/logistics/fleet-management/services/drivers.service';
import { Driver }                                                                                             from '@modules/admin/logistics/fleet-management/domain/model/driver.model';
import { FindCount }                                                                                          from '@shared/domain/model/find-count';
import { startWith }                                                                                          from 'rxjs/operators';
import { toSignal }                                                                                           from '@angular/core/rxjs-interop';

@Component({
    selector   : 'driver-selector',
    standalone : true,
    imports    : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule
    ],
    templateUrl: './driver-selector.component.html',
    providers  : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DriverSelectorComponent),
            multi      : true
        }
    ]
})
export class DriverSelectorComponent implements ControlValueAccessor, OnInit, OnDestroy {
    private readonly driversService = inject(DriversService);
    private readonly destroy$ = new Subject<void>();

    label = input<string>('Conductor');
    placeholder = input<string>('Seleccionar conductor');
    floatLabel = input<FloatLabelType>('always');
    subscriptSizing = input<SubscriptSizing>('fixed');
    controlClasses = input<string>('');
    onlyAvailable = input<boolean>(false);
    required = input<boolean>(false);

    drivers = signal<Driver[]>([]);
    loading = signal<boolean>(false);
    searchControl = new FormControl<string | Driver>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
    ));
    selectedDriver = signal<Driver | null>(null);

    // ControlValueAccessor implementation
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    // Resource for fetching drivers
    driversResource = resource({
        request: () => ({
            search: this.searchControlSignal()
        }),
        loader : async ({request}) => {
            this.loading.set(true);

            try {
                let response: FindCount<Driver>;

                // If search is empty or less than 2 chars, fetch all drivers
                if (!request.search || request.search['length'] && request.search['length'] < 2) {
                    response = await firstValueFrom(this.driversService.findAll());
                } else {
                    // Otherwise, search with the term
                    response = await firstValueFrom(
                        this.driversService.findAll()
                    );
                }

                this.drivers.set(response.items);
                return this.loading.set(false);
            } catch (error) {
                this.loading.set(false);
                console.error('Error fetching drivers:', error);
            }
        }
    });

    ngOnInit(): void {
        // Set validators if required
        if (this.required()) {
            this.searchControl.setValidators([ Validators.required ]);
            this.searchControl.updateValueAndValidity();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Handle driver selection
    onDriverSelected(driver: Driver): void {
        this.selectedDriver.set(driver);
        this.onChange(driver.id);
    }

    // Display function for autocomplete
    displayDriverFn = (driver: Driver | string | null): string => {
        console.log('displayDriverFn called with:', driver);
        if (!driver) {
            return '';
        }

        if (typeof driver === 'string') {
            const selectedDriver = this.selectedDriver();
            if (selectedDriver && selectedDriver.id === driver) {
                return `${ selectedDriver.firstName } ${ selectedDriver.lastName }`;
            }
            return '';
        }

        return `${ driver.firstName } ${ driver.lastName }`;
    };

    // ControlValueAccessor methods
    writeValue(value: string): void {
        if (value) {
            // Fetch driver details when a value is set externally
            this.driversService.findById(value)
                .pipe(takeUntil(this.destroy$), first())
                .subscribe({
                    next : (driver) => {
                        this.onDriverSelected(driver);
                        this.searchControl.setValue(driver, {emitEvent: false});
                    },
                    error: () => {
                        this.searchControl.setValue('', {emitEvent: false});
                    }
                });
        } else {
            this.selectedDriver.set(null);
            this.searchControl.setValue('', {emitEvent: false});
        }
    }

    registerOnChange(fn: (value: string) => void): void {
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

    // Mark as touched when the control is blurred
    onBlur(): void {
        this.onTouched();
    }
}
