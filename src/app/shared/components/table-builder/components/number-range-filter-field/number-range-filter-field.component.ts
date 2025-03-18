import { Component, input }                            from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule }                          from '@angular/material/form-field';
import { MatInput }                                    from '@angular/material/input';

@Component({
    selector: 'number-range-filter-field',
    imports : [
        MatFormFieldModule,
        MatInput,
        ReactiveFormsModule
    ],
    template: `
        <div class="flex flex-row items-center gap-2" [formGroup]="filterGroup()">
            <mat-form-field class="w-1/2 fuse-mat-dense" subscriptSizing="dynamic">
                <input
                    matInput
                    [formControlName]="'from'"
                    [placeholder]="placeholder() || 'Desde'"
                    [min]="min()"
                    [max]="max()"
                >
            </mat-form-field>
            <mat-form-field class="w-1/2 fuse-mat-dense" subscriptSizing="dynamic">
                <input
                    matInput
                    [formControlName]="'to'"
                    [placeholder]="placeholder() || 'Hasta'"
                    [min]="min()"
                    [max]="max()"
                >
            </mat-form-field>
        </div>
    `
})
export class NumberRangeFilterFieldComponent {
    header = input.required<string>();
    filterGroup = input.required<FormGroup<{ from: FormControl<number>, to: FormControl<number> }>>();
    min = input<number>();
    max = input<number>();
    placeholder = input<string>();
}
