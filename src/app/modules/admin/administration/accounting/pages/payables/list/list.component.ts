import { AfterViewInit, Component, inject, resource, signal, WritableSignal } from '@angular/core';
import { MatIcon }                                                            from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                                       from '@angular/material/button';
import { PageHeaderComponent }                                                from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                from '@ngneat/transloco';
import { MatTooltip }                                                         from '@angular/material/tooltip';
import { RouterLink }                                                         from '@angular/router';
import { NotyfService }                                                       from '@shared/services/notyf.service';
import { AccountingService }                                                  from '@modules/admin/administration/accounting/accounting.service';
import { TableBuilderComponent }                                              from '@shared/components/table-builder/table-builder.component';
import { firstValueFrom }                                                     from 'rxjs';
import { ColumnConfig }                                                       from '@shared/components/table-builder/column.type';
import { SupplierInvoice }                                                    from '@modules/admin/administration/accounting/domain/models/supplier-invoice';
import { Supplier }                                                           from '@modules/admin/maintainers/suppliers/domain/model/supplier';
import { ExpenseType }                                                        from '@modules/admin/maintainers/expense-types/domain/model/expense-type';

@Component({
    selector   : 'app-list',
    imports: [
        TableBuilderComponent,
        MatIcon,
        MatIconAnchor,
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIconButton,
        TranslocoPipe,
    ],
    templateUrl: './list.component.html'
})
export class ListComponent implements AfterViewInit {
    readonly #ts = inject(TranslocoService);
    readonly #service = inject(AccountingService);
    readonly #notyf = inject(NotyfService);

    payablesResource = resource({
        loader: () => firstValueFrom(this.#service.getPayables())
    });

    columnsConfig: WritableSignal<ColumnConfig<SupplierInvoice>[]> = signal([]);

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    private buildColumnsConfig = (): ColumnConfig<SupplierInvoice>[] => [
        {
            key    : 'invoiceNumber',
            header : this.#ts.translate('operations.accounting.payables.fields.invoice-number'),
            visible: true
        },
        {
            key    : 'supplier',
            header : this.#ts.translate('operations.accounting.payables.fields.supplier'),
            display: {
                formatter: (supplier: Supplier) => supplier.fantasyName
            },
            visible: true,
        },
        {
            key    : 'expenseType',
            header : this.#ts.translate('operations.accounting.payables.fields.expense-type'),
            display: {
                formatter: (expenseType: ExpenseType) => expenseType.name
            },
            visible: true,
        },
        {
            key    : 'status',
            header : this.#ts.translate('operations.accounting.payables.fields.status'),
            visible: true
        },
        {
            key    : 'issueDate',
            header : this.#ts.translate('operations.accounting.payables.fields.issue-date'),
            display: {
                type       : 'date',
                pipeOptions: {format: 'dd-MM-yyyy'},
            },
            visible: true
        },
        {
            key    : 'dueDate',
            header : this.#ts.translate('operations.accounting.payables.fields.due-date'),
            display: {
                type       : 'date',
                pipeOptions: {format: 'dd-MM-yyyy'},
            },
            visible: true
        },
        // {
        //     key: 'actions',
        //     header: this.#ts.translate('operations.accounting.payables.actions'),
        //     display: {type: 'actions'},
        //     visible: true
        // }
    ];
}
