import { ChangeDetectionStrategy, Component, computed, input }                                                                                          from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { MatSort }                                                                                                                                      from '@angular/material/sort';
import { CurrencyPipe, DatePipe, DecimalPipe, NgStyle, NgTemplateOutlet }                                                                               from '@angular/common';
import { MatInputModule }                                                                                                                               from '@angular/material/input';
import { MatFormFieldModule }                                                                                                                           from '@angular/material/form-field';
import { ReactiveFormsModule }                                                                                                                          from '@angular/forms';
import { ColumnConfig }                                                                                                                                 from '@shared/components/table-builder/column.type';
import { BadgeComponent }                                                                                                                               from '@shared/components/badge/badge.component';
import { AutocompleteFilterFieldComponent }                                                                                                             from '@shared/components/table-builder/components/autocomplete-filter-field/autocomplete-filter-field.component';
import { SelectFilterFieldComponent }                                                                                                                   from '@shared/components/table-builder/components/select-filter-field/select-filter-field.component';
import { DateRangeFilterFieldComponent }                                                                                                                from '@shared/components/table-builder/components/date-range-filter-field/date-range-filter-field.component';
import { DateFilterFieldComponent }                                                                                                                     from '@shared/components/table-builder/components/date-filter-field/date-filter-field.component';
import { CellRendererComponent }                                                                                                                        from '@shared/components/table-builder/components/cell-renderer/cell-renderer.component';

@Component({
    selector   : 'table-builder',
    imports: [
        MatTable,
        MatSort,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCell,
        MatCellDef,
        NgTemplateOutlet,
        MatInputModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatHeaderRowDef,
        MatRowDef,
        MatHeaderRow,
        MatRow,
        MatNoDataRow,
        DatePipe,
        CurrencyPipe,
        DecimalPipe,
        BadgeComponent,
        AutocompleteFilterFieldComponent,
        SelectFilterFieldComponent,
        DateRangeFilterFieldComponent,
        DateFilterFieldComponent,
        CellRendererComponent,
        NgStyle,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './table-builder.component.html'
})
export class TableBuilderComponent<T> {
    columns = input.required<ColumnConfig[], ColumnConfig[]>({
        transform: (columns: ColumnConfig[]) => columns.filter(column => column.visible)
    });
    data = input.required<T[]>();

    displayedColumns = computed(() => this.columns().map(col => col.key));
    displayedFilterColumns = computed(() => this.columns().map(col => col.key + 'Filter'));

    computedContainerClasses = (column: ColumnConfig, row: T): string => {
        return typeof column.display.containerClasses === 'function' ? column.display.containerClasses(row) : column.display.containerClasses || '';
    }
}
