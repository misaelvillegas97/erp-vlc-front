import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild }                                                               from '@angular/core';
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
import { MatPaginator }                                                                                                                                 from '@angular/material/paginator';
import { TranslocoService }                                                                                                                             from '@ngneat/transloco';
import { NumberRangeFilterFieldComponent }                                                                                                              from '@shared/components/table-builder/components/number-range-filter-field/number-range-filter-field.component';

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
        MatPaginator,
        NumberRangeFilterFieldComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './table-builder.component.html'
})
export class TableBuilderComponent<T> {
    readonly #ts = inject(TranslocoService);

    columns = input.required<ColumnConfig[], ColumnConfig[]>({
        transform: (columns: ColumnConfig[]) => columns.filter(column => column.visible)
    });
    data = input.required<T[]>();
    pagination = input<{ limit: number, totalPages: number, disabled: boolean, page: number, totalElements: number }>();
    paginationChange = output<any>();
    itemsPerPageLabel = input<string>(this.#ts.translate('table.paginator.items-per-page'));

    displayedColumns = computed(() => this.columns().map(col => col.key));
    displayedFilterColumns = computed(() => this.columns().map(col => col.key + 'Filter'));

    matPaginator = viewChild<MatPaginator>('paginator');

    ngAfterViewInit(): void {
        if (this.pagination()) {
            this.matPaginator()._intl.itemsPerPageLabel = this.itemsPerPageLabel();
            this.matPaginator()._intl.firstPageLabel = this.#ts.translate('table.paginator.first-page');
            this.matPaginator()._intl.lastPageLabel = this.#ts.translate('table.paginator.last-page');
            this.matPaginator()._intl.nextPageLabel = this.#ts.translate('table.paginator.next-page');
            this.matPaginator()._intl.previousPageLabel = this.#ts.translate('table.paginator.previous-page');
            this.matPaginator()._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
                if (length === 0 || pageSize === 0) return this.#ts.translate('table.paginator.range-label', {length});

                length = Math.max(length, 0);

                const startIndex = page * pageSize;
                const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;

                return this.#ts.translate('table.paginator.range-label', {startIndex: startIndex + 1, endIndex, length});
            };
        }
    }

    computedContainerClasses = (column: ColumnConfig, row: T): string => {
        return typeof column.display.containerClasses === 'function' ? column.display.containerClasses(row) : column.display.containerClasses || '';
    }
}
