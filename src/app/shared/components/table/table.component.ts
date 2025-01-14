import { AfterContentInit, Component, ContentChildren, EventEmitter, Input, OnInit, Output, QueryList, ViewChild }    from '@angular/core';
import { MatSort, Sort }                                                                                              from '@angular/material/sort';
import { MatColumnDef, MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator }                                                                                               from '@angular/material/paginator';

import { TranslocoDirective } from '@ngneat/transloco';
import { Observable }         from 'rxjs';

import { trackByFn } from '@libs/ui/utils/utils';

@Component({
    selector   : 'wwt-table',
    standalone : true,
    imports    : [
        MatSort,
        MatTable,
        TranslocoDirective,
        MatHeaderRow,
        MatHeaderRowDef,
        MatRow,
        MatRowDef,
        MatNoDataRow
    ],
    styleUrls  : [ './table.component.scss' ],
    templateUrl: './table.component.html',
    styles     : [ `:host {
    position: relative;
    display: block;
  }` ]
})
export class Table<T> implements OnInit, AfterContentInit {
    @Input('data') data$!: Observable<T[]>;
    @Input() displayedColumns!: Array<keyof T | string>;
    @Input() messageNoData: string = 'No hay resultados que mostrar';
    @Input() loading: Observable<boolean> = new Observable<boolean>();
    @Input() pageable: any;
    @Output() rowClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() sortChange: EventEmitter<Sort> = new EventEmitter<Sort>();
    @Output() contextMenu: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild(MatTable, {static: true}) table!: MatTable<any>;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;

    public dataSource = new MatTableDataSource<T>();

    protected readonly trackByFn = trackByFn;

    constructor() {}

    ngOnInit() {
        this.data$.subscribe(data => this.dataSource.data = data);
    }

    ngAfterContentInit() {
        this.columnDefs.forEach(columnDef => this.table.addColumnDef(columnDef));
        this.dataSource.paginator = this.paginator;
    }
}
