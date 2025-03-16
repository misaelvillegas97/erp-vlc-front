import { Component, input }                 from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTime }                         from 'luxon';
import { MatFormFieldModule }               from '@angular/material/form-field';
import { MatInput }                         from '@angular/material/input';
import { MatDatepickerModule }              from '@angular/material/datepicker';

@Component({
    selector: 'date-filter-field',
    imports : [
        MatFormFieldModule,
        MatDatepickerModule,
        MatInput,
        ReactiveFormsModule
    ],
    template: `
        <mat-form-field class="fuse-mat-dense w-full" subscriptSizing="dynamic">
            <input
                matInput
                [matDatepicker]="picker"
                [formControl]="filterControl()"
                [min]="minDate()"
                [max]="maxDate()"
                placeholder="{{ placeholder() || 'Filtrar ' + header() }}"
            >
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
    `
})
export class DateFilterFieldComponent {
    header = input.required<string>();
    filterControl = input.required<FormControl<DateTime>>();
    minDate = input<DateTime>();
    maxDate = input<DateTime>();
    placeholder = input<string>();
}
