import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatSlideToggleModule }                      from '@angular/material/slide-toggle';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { FormsModule }                               from '@angular/forms';

@Component({
    selector       : 'toggle-renderer',
    standalone     : true,
    imports        : [
        MatSlideToggleModule,
        MatTooltipModule,
        FormsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <mat-slide-toggle
            [checked]="checked"
            [disabled]="disabled"
            [matTooltip]="tooltip || ''"
            (change)="onChange($event.checked)"
            color="primary"
        ></mat-slide-toggle>
    `
})
export class ToggleRendererComponent {
    @Input() checked!: boolean;
    @Input() disabled?: boolean = false;
    @Input() tooltip?: string;
    @Input() onChange?: (checked: boolean) => void = () => {};
}
