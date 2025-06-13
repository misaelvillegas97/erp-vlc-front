import { AfterViewInit, Component, ContentChild, input, output }    from '@angular/core';
import { MatButton, MatFabButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatProgressSpinner }                                       from '@angular/material/progress-spinner';
import { MatIcon }                                                  from '@angular/material/icon';
import { MatTooltip }                                               from '@angular/material/tooltip';
import { NgSwitch, NgSwitchCase, NgTemplateOutlet }                 from '@angular/common';
import { animate, style, transition, trigger }                      from '@angular/animations';

export type ButtonVariant = 'flat' | 'raised' | 'stroked' | 'outlined' | 'icon' | 'fab' | 'mini-fab';
export type ButtonSize = 'default' | 'small' | 'large';

@Component({
    selector: 'loader-button',
    standalone: true,
    imports   : [
        MatButton,
        MatIconButton,
        MatFabButton,
        MatMiniFabButton,
        MatProgressSpinner,
        MatIcon,
        MatTooltip,
        NgSwitch,
        NgSwitchCase,
        NgTemplateOutlet
    ],
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({opacity: 0}),
                animate('150ms', style({opacity: 1})),
            ]),
            transition(':leave', [
                animate('150ms', style({opacity: 0})),
            ]),
        ]),
    ],
    template: `
        <!-- Reusable full button content -->
        <ng-template #buttonContent>
            <div class="flex items-center justify-center gap-2">
                @if (iconStart() && !loading()) {
                    <mat-icon [svgIcon]="iconStart()"></mat-icon>
                }
                @if (!loading()) {
                    <ng-content>{{ label() }}</ng-content>
                }
                @if (iconEnd() && !loading()) {
                    <mat-icon [svgIcon]="iconEnd()"></mat-icon>
                }
                @if (loading()) {
                    <mat-progress-spinner
                        @fadeInOut
                        mode="indeterminate"
                        [diameter]="spinnerDiameter()"
                        [strokeWidth]="3">
                    </mat-progress-spinner>
                }
            </div>
        </ng-template>

        <!-- Reusable icon-only button content -->
        <ng-template #buttonIconContent>
            <div class="flex items-center justify-center">
                @if (!loading()) {
                    <mat-icon [svgIcon]="iconStart() || 'heroicons_outline:plus'"></mat-icon>
                }
                @if (loading()) {
                    <mat-progress-spinner
                        @fadeInOut
                        mode="indeterminate"
                        [diameter]="spinnerDiameter()"
                        [strokeWidth]="3">
                    </mat-progress-spinner>
                }
            </div>
        </ng-template>

        <ng-container [ngSwitch]="variant()">
            <!-- Flat Button -->
            <button *ngSwitchCase="'flat'"
                    mat-flat-button
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
            </button>

            <!-- Raised Button -->
            <button *ngSwitchCase="'raised'"
                    mat-raised-button
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
            </button>

            <!-- Stroked Button -->
            <button *ngSwitchCase="'stroked'"
                    mat-stroked-button
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
            </button>

            <!-- Outlined Button -->
            <button *ngSwitchCase="'outlined'"
                    mat-stroked-button
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
            </button>

            <!-- Icon Button -->
            <button *ngSwitchCase="'icon'"
                    mat-icon-button
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonIconContent"></ng-container>
            </button>

            <!-- FAB Button -->
            <button *ngSwitchCase="'fab'"
                    mat-fab
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonIconContent"></ng-container>
            </button>

            <!-- Mini FAB Button -->
            <button *ngSwitchCase="'mini-fab'"
                    mat-mini-fab
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonIconContent"></ng-container>
            </button>

            <!-- Default to Flat Button -->
            <button *ngSwitchDefault
                    mat-flat-button
                    [class]="buttonClasses()"
                    [disabled]="disabled() || loading()"
                    [color]="color()"
                    [type]="buttonType()"
                    [matTooltip]="tooltip()"
                    [attr.aria-label]="ariaLabel()"
                    [attr.aria-disabled]="disabled() || loading()"
                    (click)="handleClick($event)">
                <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
            </button>
        </ng-container>
    `
})
export class LoaderButtonComponent implements AfterViewInit {
    // Existing inputs
    disabled = input(false);
    loading = input(false);
    label = input('button');
    color = input('primary');
    spinnerDiameter = input(20);
    buttonType = input('button');
    class = input('w-full');

    // New inputs
    variant = input<ButtonVariant>('flat');
    size = input<ButtonSize>('default');
    iconStart = input<string | null>(null);
    iconEnd = input<string | null>(null);
    tooltip = input<string | null>(null);
    ariaLabel = input<string | null>(null);

    // Output event
    buttonClick = output<Event>();

    @ContentChild('button-label') projectedTpl!: any;
    contentProjected = false;

    constructor() {
        setTimeout(() => {
            const element = document.querySelector('loader-button');
            if (element && element.childNodes.length > 0) {
                console.log(element.childNodes);
                this.contentProjected = true;
            }
        });
    }

    ngAfterViewInit() {
        console.log('content projected 2', this.projectedTpl);
    }

    handleClick(event: Event): void {
        this.buttonClick.emit(event);
    }

    buttonClasses(): string {
        let classes = this.class();
        if (this.size() === 'small') {
            classes += ' text-xs py-1 px-2';
        } else if (this.size() === 'large') {
            classes += ' text-lg py-3 px-6';
        }
        return classes;
    }
}
