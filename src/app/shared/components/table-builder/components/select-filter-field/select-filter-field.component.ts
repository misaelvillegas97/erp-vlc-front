import { Component, input }                 from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule }               from '@angular/material/form-field';
import { MatSelectModule }                  from '@angular/material/select';

@Component({
    selector: 'select-filter-field',
    imports : [
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule
    ],
    template: `
        <mat-form-field class="fuse-mat-dense w-full" subscriptSizing="dynamic">
            <mat-select
                [formControl]="filterControl()" placeholder="Filtrar {{ header() }}"
                [multiple]="multiple"
            >
                @for (option of filterOptions(); track option) {
                    <mat-option [value]="option.value">
                        {{ option.viewValue }}
                    </mat-option>
                }
            </mat-select>
        </mat-form-field>
    `
})
export class SelectFilterFieldComponent {
    header = input.required<string>();
    filterControl = input.required<FormControl>();
    filterOptions = input.required<{ value, viewValue }[]>();
    multiple = input<boolean>(false);
}
