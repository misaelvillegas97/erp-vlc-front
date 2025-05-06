import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { RouterLink }                                from '@angular/router';
import { NgClass, NgIf }                             from '@angular/common';

@Component({
    selector       : 'link-renderer',
    standalone     : true,
    imports        : [
        MatTooltipModule,
        RouterLink,
        NgClass,
        NgIf
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <!-- Internal link (using RouterLink) -->
        <a *ngIf="isInternalLink; else externalLink"
           [routerLink]="url"
           [matTooltip]="tooltip || ''"
           [ngClass]="linkClass"
           class="cursor-pointer hover:underline">
            {{ text }}
        </a>

        <!-- External link -->
        <ng-template #externalLink>
            <a [href]="url"
               [target]="target || '_blank'"
               [matTooltip]="tooltip || ''"
               [ngClass]="linkClass"
               class="cursor-pointer hover:underline">
                {{ text }}
            </a>
        </ng-template>
    `
})
export class LinkRendererComponent {
    @Input() text!: string;
    @Input() url!: string;
    @Input() target?: string = '_blank';
    @Input() tooltip?: string;
    @Input() linkClass?: string;

    get isInternalLink(): boolean {
        return this.url && !this.url.startsWith('http') && !this.url.startsWith('//');
    }
}
