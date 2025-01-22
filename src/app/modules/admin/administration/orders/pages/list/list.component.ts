import { Component, inject }                                                                                                                            from '@angular/core';
import { PageHeaderComponent }                                                                                                                          from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoService }                                                                                                         from '@ngneat/transloco';
import { MatIcon }                                                                                                                                      from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                                                                                                                 from '@angular/material/button';
import { MatTooltip }                                                                                                                                   from '@angular/material/tooltip';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { RouterLink }                                                                                                                                   from '@angular/router';
import { BehaviorSubject }                                                                                                                              from 'rxjs';
import { Order }                                                                                                                                        from '@modules/admin/administration/orders/domain/model/order';
import { Notyf }                                                                                                                                        from 'notyf';
import { FuseConfirmationService }                                                                                                                      from '../../../../../../../@fuse/services/confirmation';
import { OrdersService }                                                                                                                                from '@modules/admin/administration/orders/orders.service';
import { CurrencyPipe }                                                                                                                                 from '@angular/common';
import { MatSort, MatSortHeader }                                                                                                                       from '@angular/material/sort';
import { takeUntilDestroyed }                                                                                                                           from '@angular/core/rxjs-interop';
import { MatDialog }                                                                                                                                    from '@angular/material/dialog';
import { AddInvoiceComponent }                                                                                                                          from '@modules/admin/administration/orders/dialogs/add-invoice/add-invoice.component';

@Component({
    selector   : 'app-list',
    imports    : [
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIconAnchor,
        MatIcon,
        MatTable,
        MatSort,
        MatSortHeader,
        MatColumnDef,
        MatHeaderCell,
        MatCell,
        MatHeaderCellDef,
        MatCellDef,
        CurrencyPipe,
        MatHeaderRowDef,
        MatRowDef,
        MatNoDataRow,
        MatHeaderRow,
        MatRow,
        MatIconButton
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly dialog = inject(MatDialog);

    public orders$: BehaviorSubject<Order[]> = new BehaviorSubject<Order[]>(null);
    public readonly displayedColumns: string[] = [ 'orderNumber', 'businessName', 'type', 'status', 'invoice', 'deliveryLocation', 'deliveryDate', 'emissionDate', 'amount', 'actions' ];

    private _notyf = new Notyf();

    constructor(
        private readonly _fuseConfirmationService: FuseConfirmationService,
        private readonly _orderService: OrdersService,
        private readonly _translationService: TranslocoService,
    ) {
        this._orderService.orders$
            .pipe(takeUntilDestroyed())
            .subscribe((orders) => this.orders$.next(orders));

    }

    openAddInvoiceDialog(order: Order): void {
        const invoiceDialog = this.dialog.open(AddInvoiceComponent, {
            data : order,
            width: '500px'
        });

        invoiceDialog.afterClosed().subscribe((result) => {
            if (result) {
                this._notyf.success(this._translationService.translate('operations.orders.invoice.added'));
            }
        });
    }
}
