import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { NgClass }                                   from '@angular/common';

@Component({
    selector       : 'image-renderer',
    standalone     : true,
    imports        : [
        MatTooltipModule,
        NgClass
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <img
            [src]="src"
            [alt]="alt || ''"
            [width]="width"
            [height]="height"
            [matTooltip]="tooltip || alt || ''"
            [ngClass]="imageClass"
            (error)="onImageError($event)"
            class="object-cover"
        />
    `
})
export class ImageRendererComponent {
    @Input() src!: string;
    @Input() alt?: string;
    @Input() fallbackSrc?: string;
    @Input() width?: string = '40px';
    @Input() height?: string = '40px';
    @Input() tooltip?: string;
    @Input() imageClass?: string;

    onImageError(event: Event): void {
        if (this.fallbackSrc) {
            (event.target as HTMLImageElement).src = this.fallbackSrc;
        }
    }
}
