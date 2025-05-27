// src/app/components/table-builder/cell-renderer.component.ts
import { ChangeDetectionStrategy, Component, Input }             from '@angular/core';
import { ColumnConfig }                                          from '@shared/components/table-builder/column.type';
import { BadgeComponent }                                        from '@shared/components/badge/badge.component';
import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { IconRendererComponent }                                 from './icon-renderer/icon-renderer.component';
import { ButtonRendererComponent }                               from './button-renderer/button-renderer.component';
import { ActionsRendererComponent }                              from './actions-renderer/actions-renderer.component';
import { ProgressRendererComponent }                             from './progress-renderer/progress-renderer.component';
import { ToggleRendererComponent }                               from './toggle-renderer/toggle-renderer.component';
import { CheckboxRendererComponent }                             from './checkbox-renderer/checkbox-renderer.component';
import { LinkRendererComponent }                                 from './link-renderer/link-renderer.component';
import { ImageRendererComponent }                                from './image-renderer/image-renderer.component';
import { MatTooltipModule }                                      from '@angular/material/tooltip';

@Component({
    selector       : 'cell-renderer',
    imports        : [
        BadgeComponent,
        CurrencyPipe,
        DatePipe,
        DecimalPipe,
        NgTemplateOutlet,
        IconRendererComponent,
        ButtonRendererComponent,
        ActionsRendererComponent,
        ProgressRendererComponent,
        ToggleRendererComponent,
        CheckboxRendererComponent,
        LinkRendererComponent,
        ImageRendererComponent,
        MatTooltipModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        @if (column.display?.type === 'custom' && column.display.customTemplate) {
            <ng-container *ngTemplateOutlet="column.display.customTemplate; context: { $implicit: row[column.key], row: row }"></ng-container>
        } @else {
            @switch (column.display?.type) {
                @case ('date') {
                    <span 
                        (click)="handleClick()" 
                        [class]="computedClasses"
                        [matTooltip]="getTooltip()">
                        {{ row[column.key] | date:(column.display.pipeOptions?.format || 'shortDate') }}
                    </span>
                }
                @case ('currency') {
                    <span 
                        (click)="handleClick()" 
                        [class]="computedClasses"
                        [matTooltip]="getTooltip()">
                        {{ row[column.key] | currency:(column.display.pipeOptions?.currency || 'USD'):column.display.pipeOptions?.symbolDisplay }}
                    </span>
                }
                @case ('number') {
                    <span 
                        (click)="handleClick()" 
                        [class]="computedClasses"
                        [matTooltip]="getTooltip()">
                        {{ row[column.key] | number:(column.display.pipeOptions?.digitsInfo || '1.0-0') }}
                    </span>
                }
                @case ('badge') {
                    <badge
                        (click)="handleClick()"
                        [class]="computedClasses"
                        [color]="column.display.color?.(row[column.key], row) || 'gray'"
                        [label]="column.display.label(row[column.key], row)"></badge>
                }
                @case ('icon') {
                    <icon-renderer
                        [icon]="getIconName()"
                        [iconColor]="getIconColor()"
                        [iconSize]="column.display?.iconSize"
                        [tooltip]="getTooltip()"
                        [onClick]="handleClick"
                    ></icon-renderer>
                }
                @case ('button') {
                    <button-renderer
                        [buttonLabel]="getButtonLabel()"
                        [buttonIcon]="getButtonIcon()"
                        [buttonColor]="getButtonColor()"
                        [buttonType]="column.display?.buttonType"
                        [tooltip]="getTooltip()"
                        [onClick]="handleClick"
                    ></button-renderer>
                }
                @case ('actions') {
                    <actions-renderer
                        [actions]="column.display?.actions"
                        [onAction]="handleAction"
                    ></actions-renderer>
                }
                @case ('progress') {
                    <progress-renderer
                        [value]="row[column.key]"
                        [color]="getProgressColor()"
                        [mode]="column.display?.progressMode"
                        [tooltip]="getTooltip()"
                        [showValue]="true"
                    ></progress-renderer>
                }
                @case ('toggle') {
                    <toggle-renderer
                        [checked]="row[column.key]"
                        [disabled]="isToggleDisabled()"
                        [tooltip]="getTooltip()"
                        [onChange]="handleToggleChange"
                    ></toggle-renderer>
                }
                @case ('checkbox') {
                    <checkbox-renderer
                        [checked]="row[column.key]"
                        [disabled]="isCheckboxDisabled()"
                        [tooltip]="getTooltip()"
                        [onChange]="handleCheckboxChange"
                    ></checkbox-renderer>
                }
                @case ('link') {
                    <link-renderer
                        [text]="getLinkText()"
                        [url]="getLinkUrl()"
                        [target]="getLinkTarget()"
                        [tooltip]="getTooltip()"
                        [linkClass]="computedClasses"
                    ></link-renderer>
                }
                @case ('image') {
                    <image-renderer
                        [src]="row[column.key]"
                        [alt]="getImageAlt()"
                        [fallbackSrc]="column.display?.imageFallback"
                        [width]="column.display?.imageWidth"
                        [height]="column.display?.imageHeight"
                        [tooltip]="getTooltip()"
                        [imageClass]="computedClasses"
                    ></image-renderer>
                }
                @default {
                    <span 
                        (click)="handleClick()" 
                        [class]="computedClasses"
                        [matTooltip]="getTooltip()">
                        {{ column.display?.formatter ? column.display.formatter(row[column.key], row) : row[column.key] }}
                    </span>
                }
            }
        }
    `
})
export class CellRendererComponent<T> {
    @Input() column!: ColumnConfig<T>;
    @Input() row: any;

    // Getter para calcular las clases basadas en la configuración de la columna y la fila actual
    get computedClasses(): string {
        return typeof this.column.display?.classes === 'function'
            ? this.column.display?.classes(this.row)
            : this.column.display?.classes || '';
    }

    // Helper methods for click handling
    handleClick = (): void => this.column.display?.onClick && this.column.display.onClick(this.row);

    handleAction = (action: string): void => {
        if (this.column.display?.action) {
            this.column.display.action(action, this.row);
        }
    };

    // Helper methods for toggle and checkbox
    handleToggleChange = (checked: boolean): void => {
        if (this.column.display?.toggleChange) {
            this.column.display.toggleChange(checked, this.row);
        }
    };

    handleCheckboxChange = (checked: boolean): void => {
        if (this.column.display?.checkboxChange) {
            this.column.display.checkboxChange(checked, this.row);
        }
    };

    isToggleDisabled(): boolean {
        if (typeof this.column.display?.toggleDisabled === 'function') {
            return this.column.display.toggleDisabled(this.row);
        }
        return !!this.column.display?.toggleDisabled;
    }

    isCheckboxDisabled(): boolean {
        if (typeof this.column.display?.checkboxDisabled === 'function') {
            return this.column.display.checkboxDisabled(this.row);
        }
        return !!this.column.display?.checkboxDisabled;
    }

    // Helper methods for tooltips
    getTooltip(): string {
        if (typeof this.column.display?.tooltip === 'function') {
            return this.column.display.tooltip(this.row[this.column.key], this.row) || '';
        }
        return this.column.display?.tooltip || '';
    }

    // Helper methods for icons
    getIconName(): string {
        if (typeof this.column.display?.icon === 'function') {
            return this.column.display.icon(this.row[this.column.key], this.row) || '';
        }
        return this.column.display?.icon || '';
    }

    getIconColor(): string {
        if (typeof this.column.display?.iconColor === 'function') {
            return this.column.display.iconColor(this.row[this.column.key], this.row) || '';
        }
        return this.column.display?.iconColor || '';
    }

    // Helper methods for buttons
    getButtonLabel(): string {
        if (typeof this.column.display?.buttonLabel === 'function') {
            return this.column.display.buttonLabel(this.row[this.column.key], this.row) || '';
        }
        return this.column.display?.buttonLabel || '';
    }

    getButtonIcon(): string {
        if (typeof this.column.display?.buttonIcon === 'function') {
            return this.column.display.buttonIcon(this.row[this.column.key], this.row) || '';
        }
        return this.column.display?.buttonIcon || '';
    }

    getButtonColor(): 'primary' | 'accent' | 'warn' {
        if (typeof this.column.display?.buttonColor === 'function') {
            return this.column.display.buttonColor(this.row[this.column.key], this.row) || 'primary';
        }
        return this.column.display?.buttonColor || 'primary';
    }

    // Helper methods for progress
    getProgressColor(): 'primary' | 'accent' | 'warn' {
        if (typeof this.column.display?.progressColor === 'function') {
            return this.column.display.progressColor(this.row[this.column.key], this.row) || 'primary';
        }
        return this.column.display?.progressColor || 'primary';
    }

    // Helper methods for links
    getLinkText(): string {
        if (this.column.display?.label) {
            return this.column.display.label(this.row[this.column.key], this.row);
        }
        return this.row[this.column.key] || '';
    }

    getLinkUrl(): string {
        if (typeof this.column.display?.linkUrl === 'function') {
            return this.column.display.linkUrl(this.row[this.column.key], this.row) || '';
        }
        return this.column.display?.linkUrl || '';
    }

    getLinkTarget(): string {
        if (typeof this.column.display?.linkTarget === 'function') {
            return this.column.display.linkTarget(this.row[this.column.key], this.row) || '_blank';
        }
        return this.column.display?.linkTarget || '_blank';
    }

    // Helper methods for images
    getImageAlt(): string {
        if (typeof this.column.display?.imageAlt === 'function') {
            return this.column.display.imageAlt(this.row[this.column.key], this.row) || '';
        }
        return this.column.display?.imageAlt || '';
    }
}
