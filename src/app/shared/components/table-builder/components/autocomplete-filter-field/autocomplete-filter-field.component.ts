import { Component, input }                 from '@angular/core';
import { MatFormFieldModule }               from '@angular/material/form-field';
import { MatAutocompleteModule }            from '@angular/material/autocomplete';
import { MatInput }                         from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'autocomplete-filter-field',
    imports : [
        MatFormFieldModule,
        MatAutocompleteModule,
        MatInput,
        ReactiveFormsModule
    ],
    template: `
        <mat-form-field class="fuse-mat-dense w-full" subscriptSizing="dynamic">
            <input
                matInput
                [formControl]="filterControl()"
                [matAutocomplete]="auto"
                placeholder="Filtrar {{ header() }}"
            >
            <mat-autocomplete #auto="matAutocomplete" [displayWith]="filterDisplayWith()">
                @for (option of filterOptions(); track option) {
                    <mat-option [value]="option.value">
                        {{ option.viewValue }}
                    </mat-option>
                }
            </mat-autocomplete>
        </mat-form-field>
    `
})
export class AutocompleteFilterFieldComponent {
    header = input.required<string>();
    filterControl = input.required<FormControl>();
    filterOptions = input.required<{ value, viewValue }[]>();
    filterDisplayWith = input.required<(value: any) => string>();
}
