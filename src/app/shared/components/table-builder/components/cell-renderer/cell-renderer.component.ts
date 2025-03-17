// src/app/components/table-builder/cell-renderer.component.ts
import { ChangeDetectionStrategy, Component, Input }             from '@angular/core';
import { ColumnConfig }                                          from '@shared/components/table-builder/column.type';
import { BadgeComponent }                                        from '@shared/components/badge/badge.component';
import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';

@Component({
    selector       : 'cell-renderer',
    imports        : [
        BadgeComponent,
        CurrencyPipe,
        DatePipe,
        DecimalPipe,
        NgTemplateOutlet
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        @if (column.display.customTemplate) {
            <ng-container *ngTemplateOutlet="column.display.customTemplate; context: { $implicit: row[column.key], row: row }"></ng-container>
        } @else {
            @switch (column.display.type) {
                @case ('date') {
                    <span (click)="handleClick()" [class]="computedClasses">{{ row[column.key] | date:(column.display.pipeOptions?.format || 'shortDate') }}</span>
                }
                @case ('currency') {
                    <span (click)="handleClick()" [class]="computedClasses">{{ row[column.key] | currency:(column.display.pipeOptions?.currency || 'USD'):column.display.pipeOptions?.symbolDisplay }}</span>
                }
                @case ('number') {
                    <span (click)="handleClick()" [class]="computedClasses">{{ row[column.key] | number:(column.display.pipeOptions?.digitsInfo || '1.0-0') }}</span>
                }
                @case ('badge') {
                    <badge
                        (click)="handleClick()"
                        [class]="computedClasses"
                        [color]="column.display.pipeOptions?.color(row[column.key], row)"
                        [label]="column.display.formatter(row[column.key], row)"></badge>
                }
                @default {
                    <span (click)="handleClick()" [class]="computedClasses">{{ column.display.formatter ? column.display.formatter(row[column.key], row) : row[column.key] }}</span>
                }
            }

        }
    `
})
export class CellRendererComponent {
    @Input() column!: ColumnConfig;
    @Input() row: any;

    // Getter para calcular las clases basadas en la configuración de la columna y la fila actual
    get computedClasses(): string {
        return typeof this.column.display.classes === 'function'
            ? this.column.display.classes(this.row)
            : this.column.display.classes || '';
    }

    handleClick = (): void => this.column.display.onClick && this.column.display.onClick(this.row);
}
