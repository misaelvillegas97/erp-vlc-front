import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule }                             from '@angular/material/icon';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { NgClass }                                   from '@angular/common';

@Component({
    selector       : 'icon-renderer',
    standalone     : true,
    imports        : [
        MatIconModule,
        MatTooltipModule,
        NgClass
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <mat-icon
            [ngClass]="iconColor"
            [matTooltip]="tooltip || ''"
            [style.font-size]="iconSize"
            [style.height]="iconSize"
            [style.width]="iconSize"
            [style.line-height]="iconSize"
            (click)="onClick && onClick()"
        >
            {{ icon }}
        </mat-icon>
    `
})
export class IconRendererComponent {
    @Input() icon!: string;
    @Input() iconColor?: string;
    @Input() iconSize?: string = '24px';
    @Input() tooltip?: string;
    @Input() onClick?: () => void;
}
