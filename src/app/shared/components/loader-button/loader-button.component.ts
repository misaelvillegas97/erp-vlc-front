import { Component, input }   from '@angular/core';
import { MatButton }          from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'loader-button',
    imports : [
        MatButton,
        MatProgressSpinner
    ],
    template: `
        <button
            mat-raised-button
            [disabled]="disable() || loading()"
            [type]="buttonType()">
            @if (loading()) {
                <mat-progress-spinner
                    mode="indeterminate"
                    [diameter]="spinnerDiameter()"
                    [strokeWidth]="3">
                </mat-progress-spinner>
            } @else {
                {{ label() }}
            }
        </button>
    `
})
export class LoaderButtonComponent {
    disable = input(false);
    loading = input(false);
    label = input('button');
    spinnerDiameter = input(20);
    buttonType = input('button');
}
