import { Component, input, OnInit }                                                                                                                     from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { MatSort }                                                                                                                                      from '@angular/material/sort';
import { CurrencyPipe, DatePipe, DecimalPipe, JsonPipe, NgTemplateOutlet }                                                                              from '@angular/common';
import { MatInputModule }                                                                                                                               from '@angular/material/input';
import { MatFormFieldModule }                                                                                                                           from '@angular/material/form-field';
import { ReactiveFormsModule }                                                                                                                          from '@angular/forms';
import { ColumnConfig }                                                                                                                                 from '@shared/components/table-builder/column.type';
import { BadgeComponent }                                                                                                                               from '@shared/components/badge/badge.component';
import { MatAutocomplete, MatAutocompleteTrigger }                                                                                                      from '@angular/material/autocomplete';
import { AutocompleteFilterFieldComponent }                                                                                                             from '@shared/components/autocomplete-filter-field/autocomplete-filter-field.component';
import { SelectFilterFieldComponent }                                                                                                                   from '@shared/components/table-builder/components/select-filter-field/select-filter-field.component';

@Component({
    selector   : 'table-builder',
    imports    : [
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
        MatAutocomplete,
        MatAutocompleteTrigger,
        AutocompleteFilterFieldComponent,
        SelectFilterFieldComponent,
        JsonPipe,
    ],
    templateUrl: './table-builder.component.html'
})
export class TableBuilderComponent implements OnInit {
    columns = input.required<ColumnConfig[]>();
    data = input.required<any[]>();

    displayedColumns: string[] = [];
    displayedFilterColumns: string[] = [];

    ngOnInit(): void {
        this.displayedColumns = this.columns().map(col => col.key);
        this.displayedFilterColumns = this.columns().map(col => col.key + 'Filter');
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
