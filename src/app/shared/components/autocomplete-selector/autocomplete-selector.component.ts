import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule }                                                                                    from '@angular/common';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule }                       from '@angular/forms';
import { MatFormFieldModule }                                                                              from '@angular/material/form-field';
import { MatInputModule }                                                                                  from '@angular/material/input';
import { MatAutocompleteModule }                                                                           from '@angular/material/autocomplete';
import { MatIconModule }                                                                                   from '@angular/material/icon';
import { MatProgressSpinnerModule }                                                                        from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Observable, startWith, switchMap }                            from 'rxjs';
import { toSignal }                                                                                        from '@angular/core/rxjs-interop';

export interface AutocompleteOption {
    id: string;
    label: string;
    subtitle?: string;
    disabled?: boolean;
}

export interface AutocompleteConfig {
    placeholder: string;
    label: string;
    hint?: string;
    noOptionsText?: string;
    searchMinLength?: number;
    debounceTime?: number;
}

@Component({
    selector       : 'app-autocomplete-selector',
    standalone     : true,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    providers      : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutocompleteSelectorComponent),
            multi      : true
        }
    ],
    template       : `
        <mat-form-field class="w-full fuse-mat-dense" [appearance]="'outline'">
            <mat-label>{{ config().label }}</mat-label>

            <input
                matInput
                [formControl]="searchControl"
                [matAutocomplete]="auto"
                [placeholder]="config().placeholder"
                [disabled]="disabled()"
            />

            @if (loading()) {
                <mat-spinner matSuffix diameter="20"></mat-spinner>
            } @else {
                <mat-icon matSuffix>search</mat-icon>
            }

            <mat-autocomplete
                #auto="matAutocomplete"
                [displayWith]="displayFn"
                (optionSelected)="onOptionSelected($event)"
            >
                @if (loading()) {

                } @else {
                    @for (option of filteredOptions(); track option.id) {
                        <mat-option [value]="option" [disabled]="option.disabled">
                            <div class="flex flex-col">
                                <span class="font-medium">{{ option.label }}</span>
                                @if (option.subtitle) {
                                    <span class="text-sm text-gray-600">{{ option.subtitle }}</span>
                                }
                            </div>
                        </mat-option>
                    } @empty {
                        <mat-option [disabled]="true">
                            {{ config().noOptionsText || 'No se encontraron opciones' }}
                        </mat-option>
                    }
                }
            </mat-autocomplete>

            @if (config().hint) {
                <mat-hint>{{ config().hint }}</mat-hint>
            }

            @if (hasError()) {
                <mat-error>{{ errorMessage() }}</mat-error>
            }
        </mat-form-field>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteSelectorComponent implements ControlValueAccessor, OnInit {
    // Inputs
    config = input.required<AutocompleteConfig>();
    options = input<AutocompleteOption[]>([]);
    searchFn = input<(query: string) => Observable<AutocompleteOption[]>>();
    disabled = input<boolean>(false);
    required = input<boolean>(false);
    formControl = input<FormControl>();

    // Internal state
    searchControl = new FormControl('');
    loading = signal<boolean>(false);
    selectedOption = signal<AutocompleteOption | null>(null);

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
            debounceTime(this.config().debounceTime || 300),
            distinctUntilChanged()
        ),
        {initialValue: ''}
    );

    // Filtered options based on search
    filteredOptions = computed(() => {
        const query = this.searchQuery();
        const staticOptions = this.options();
        const searchFn = this.searchFn();

        // If we have a search function, use it for dynamic searching
        if (searchFn && typeof query === 'string' && query.length >= (this.config().searchMinLength || 1)) {
            // This will be handled by the search effect
            return [];
        }

        // Filter static options
        if (typeof query === 'string' && query.trim()) {
            return staticOptions.filter(option =>
                option.label.toLowerCase().includes(query.toLowerCase()) ||
                (option.subtitle && option.subtitle.toLowerCase().includes(query.toLowerCase()))
            );
        }

        return staticOptions;
    });

    constructor() {
        // Effect to handle dynamic search
        effect(() => {
            const query = this.searchQuery();
            const searchFn = this.searchFn();

            if (searchFn && typeof query === 'string' && query.length >= (this.config().searchMinLength || 1)) {
                this.loading.set(true);

                searchFn(query).subscribe({
                    next : (results) => {
                        // Update filteredOptions through a separate signal for dynamic results
                        this.loading.set(false);
                    },
                    error: (error) => {
                        console.error('Search error:', error);
                        this.loading.set(false);
                    }
                });
            }
        });
    }

    ngOnInit(): void {
        // Set up validation
        if (this.required()) {
            this.searchControl.addValidators(() => {
                const value = this.selectedOption();
                return value ? null : {required: true};
            });
        }
    }

    // ControlValueAccessor implementation
    writeValue(value: string | null): void {
        if (value) {
            // Find the option that matches the value
            const option = this.options().find(opt => opt.id === value);
            if (option) {
                this.selectedOption.set(option);
                this.searchControl.setValue(option.label, {emitEvent: false});
            }
        } else {
            this.selectedOption.set(null);
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
        const option = event.option.value as AutocompleteOption;
        this.selectedOption.set(option);
        this.onChange(option.id);
        this.onTouched();
        this.hasError.set(false);
    }

    displayFn = (option: AutocompleteOption | string): string => {
        if (typeof option === 'string') {
            return option;
        }
        return option ? option.label : '';
    };

    // Validation
    validate(): void {
        if (this.required() && !this.selectedOption()) {
            this.hasError.set(true);
            this.errorMessage.set('Este campo es requerido');
        } else {
            this.hasError.set(false);
            this.errorMessage.set('');
        }
    }
}
