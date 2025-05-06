import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCheckboxModule }                         from '@angular/material/checkbox';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { FormsModule }                               from '@angular/forms';

@Component({
    selector       : 'checkbox-renderer',
    standalone     : true,
    imports        : [
        MatCheckboxModule,
        MatTooltipModule,
        FormsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <mat-checkbox
            [checked]="checked"
            [disabled]="disabled"
            [matTooltip]="tooltip || ''"
            (change)="onChange($event.checked)"
            color="primary"
        ></mat-checkbox>
    `
})
export class CheckboxRendererComponent {
    @Input() checked!: boolean;
    @Input() disabled?: boolean = false;
    @Input() tooltip?: string;
    @Input() onChange?: (checked: boolean) => void = () => {};
}
