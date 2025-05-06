import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatProgressBarModule }                      from '@angular/material/progress-bar';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { NgIf }                                      from '@angular/common';

@Component({
    selector       : 'progress-renderer',
    standalone     : true,
    imports        : [
        MatProgressBarModule,
        MatTooltipModule,
        NgIf
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col">
            <mat-progress-bar
                [value]="value"
                [color]="color || 'primary'"
                [mode]="mode || 'determinate'"
                [matTooltip]="tooltip || value + '%'"
            ></mat-progress-bar>
            <span *ngIf="showValue" class="text-xs text-center mt-1">{{ value }}%</span>
        </div>
    `
})
export class ProgressRendererComponent {
    @Input() value!: number;
    @Input() color?: 'primary' | 'accent' | 'warn' = 'primary';
    @Input() mode?: 'determinate' | 'indeterminate' | 'buffer' | 'query' = 'determinate';
    @Input() tooltip?: string;
    @Input() showValue?: boolean = false;
}
