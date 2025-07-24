import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule }                           from '@angular/material/button';
import { MatIconModule }                             from '@angular/material/icon';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { NgIf, NgSwitch, NgSwitchCase }              from '@angular/common';

@Component({
    selector       : 'button-renderer',
    standalone     : true,
    imports        : [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        NgSwitch,
        NgSwitchCase,
        NgIf,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <ng-container [ngSwitch]="buttonType">
            <!-- Icon button -->
            <button *ngSwitchCase="'icon'"
                    mat-icon-button
                    [color]="buttonColor"
                    [matTooltip]="tooltip || ''"
                    (click)="onClick && onClick()">
                <mat-icon svgIcon="mat_solid:{{ buttonIcon }}"></mat-icon>
            </button>

            <!-- FAB button -->
            <button *ngSwitchCase="'fab'"
                    mat-fab
                    [color]="buttonColor"
                    [matTooltip]="tooltip || ''"
                    (click)="onClick && onClick()">
                <mat-icon *ngIf="buttonIcon">{{ buttonIcon }}</mat-icon>
                <span *ngIf="!buttonIcon">{{ buttonLabel }}</span>
            </button>

            <!-- Mini FAB button -->
            <button *ngSwitchCase="'mini-fab'"
                    mat-mini-fab
                    [color]="buttonColor"
                    [matTooltip]="tooltip || ''"
                    (click)="onClick && onClick()">
                <mat-icon *ngIf="buttonIcon">{{ buttonIcon }}</mat-icon>
                <span *ngIf="!buttonIcon">{{ buttonLabel }}</span>
            </button>

            <!-- Raised button -->
            <button *ngSwitchCase="'raised'"
                    mat-raised-button
                    [color]="buttonColor"
                    [matTooltip]="tooltip || ''"
                    (click)="onClick && onClick()">
                <mat-icon *ngIf="buttonIcon">{{ buttonIcon }}</mat-icon>
                <span>{{ buttonLabel }}</span>
            </button>

            <!-- Stroked button -->
            <button *ngSwitchCase="'stroked'"
                    mat-stroked-button
                    [color]="buttonColor"
                    [matTooltip]="tooltip || ''"
                    (click)="onClick && onClick()">
                <mat-icon *ngIf="buttonIcon">{{ buttonIcon }}</mat-icon>
                <span>{{ buttonLabel }}</span>
            </button>

            <!-- Flat button -->
            <button *ngSwitchCase="'flat'"
                    mat-flat-button
                    [color]="buttonColor"
                    [matTooltip]="tooltip || ''"
                    (click)="onClick && onClick()">
                <mat-icon *ngIf="buttonIcon">{{ buttonIcon }}</mat-icon>
                <span>{{ buttonLabel }}</span>
            </button>

            <!-- Basic button (default) -->
            <button *ngSwitchDefault
                    mat-button
                    [color]="buttonColor"
                    [matTooltip]="tooltip || ''"
                    (click)="onClick && onClick()">
                <mat-icon *ngIf="buttonIcon">{{ buttonIcon }}</mat-icon>
                <span>{{ buttonLabel }}</span>
            </button>
        </ng-container>
    `
})
export class ButtonRendererComponent {
    @Input() buttonLabel!: string;
    @Input() buttonIcon?: string;
    @Input() buttonColor?: 'primary' | 'accent' | 'warn' = 'primary';
    @Input() buttonType?: 'basic' | 'raised' | 'stroked' | 'flat' | 'icon' | 'fab' | 'mini-fab' = 'basic';
    @Input() tooltip?: string;
    @Input() onClick?: () => void;
}
