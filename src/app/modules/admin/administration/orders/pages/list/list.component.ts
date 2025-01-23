import { Component, computed, inject, signal, WritableSignal }                                                                                          from '@angular/core';
import { PageHeaderComponent }                                                                                                                          from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoService }                                                                                                         from '@ngneat/transloco';
import { MatIcon }                                                                                                                                      from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                                                                                                                 from '@angular/material/button';
import { MatTooltip }                                                                                                                                   from '@angular/material/tooltip';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { RouterLink }                                                                                                                                   from '@angular/router';
import { Order }                                                                                                                                        from '@modules/admin/administration/orders/domain/model/order';
import { Notyf }                                                                                                                                        from 'notyf';
import { FuseConfirmationService }                                                                                                                      from '../../../../../../../@fuse/services/confirmation';
import { OrdersService }                                                                                                                                from '@modules/admin/administration/orders/orders.service';
import { CurrencyPipe }                                                                                                                                 from '@angular/common';
import { MatSort, MatSortHeader }                                                                                                                       from '@angular/material/sort';
import { takeUntilDestroyed }                                                                                                                           from '@angular/core/rxjs-interop';
import { MatDialog }                                                                                                                                    from '@angular/material/dialog';
import { AddInvoiceComponent }                                                                                                                          from '@modules/admin/administration/orders/dialogs/add-invoice/add-invoice.component';
import { MatFormFieldModule }                                                                                                                           from '@angular/material/form-field';
import { MatInputModule }                                                                                                                               from '@angular/material/input';
import { MatSelectModule }                                                                                                                              from '@angular/material/select';
import { FormsModule }                                                                                                                                  from '@angular/forms';
import { OrderTypeEnum }                                                                                                                                from '@modules/admin/administration/orders/domain/enums/order-type.enum';
import { OrderStatusEnum }                                                                                                                              from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { CdkTextareaAutosize }                                                                                                                          from '@angular/cdk/text-field';

@Component({
    selector   : 'app-list',
    imports: [
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
        MatIconButton,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormsModule,
        CdkTextareaAutosize
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly dialog = inject(MatDialog);
    public orders = signal<Order[]>([]);
    public readonly displayedColumns: string[] = [ 'orderNumber', 'businessName', 'type', 'status', 'invoice', 'deliveryLocation', 'deliveryDate', 'emissionDate', 'amount', 'actions' ];
    public readonly displayedFilterColumns: string[] = this.displayedColumns.map((column) => column + 'Filter');
    public orderNumberFilter: WritableSignal<number> = signal<number>(undefined);
    public businessNameFilter: WritableSignal<string> = signal<string>(undefined);
    public typeFilter: WritableSignal<OrderTypeEnum[]> = signal<OrderTypeEnum[]>(undefined);
    public statusFilter: WritableSignal<OrderStatusEnum[]> = signal<OrderStatusEnum[]>(undefined);
    public deliveryLocationFilter: WritableSignal<string> = signal<string>(undefined);
    public emissionDateFilter: WritableSignal<string> = signal<string>(undefined);
    public deliveryDateFilter: WritableSignal<string> = signal<string>(undefined);
    public amountFilter: WritableSignal<number> = signal<number>(undefined);
    public invoiceFilter: WritableSignal<number> = signal<number>(undefined);
    public filters = computed(() => {
        const filter = {};

        if (this.orderNumberFilter() && this.orderNumberFilter() >= 0)
            filter['orderNumber'] = this.orderNumberFilter();

        if (this.businessNameFilter() && this.businessNameFilter().length > 0)
            filter['businessName'] = this.businessNameFilter();

        if (this.typeFilter() && this.typeFilter().length > 0)
            filter['type'] = this.typeFilter();

        if (this.statusFilter() && this.statusFilter().length > 0)
            filter['status'] = this.statusFilter();

        if (this.deliveryLocationFilter() && this.deliveryLocationFilter().length > 0)
            filter['deliveryLocation'] = this.deliveryLocationFilter();

        if (this.emissionDateFilter() && this.emissionDateFilter().length > 0)
            filter['emissionDate'] = this.emissionDateFilter();

        if (this.deliveryDateFilter() && this.deliveryDateFilter().length > 0)
            filter['deliveryDate'] = this.deliveryDateFilter();

        if (this.amountFilter() && this.amountFilter() >= 0)
            filter['amount'] = this.amountFilter();

        if (this.invoiceFilter() && this.invoiceFilter() >= 0)
            filter['invoice'] = this.invoiceFilter();

        return filter;
    });
    public translatedSelectedStatus = computed(() => {
        const mapped = this.statusFilter() ? this.statusFilter().map((status) => this._translationService.translate('enums.order-status.' + status)) : [];
        return mapped.join(',\n ');
    });


    private _notyf = new Notyf();

    constructor(
        private readonly _fuseConfirmationService: FuseConfirmationService,
        private readonly _orderService: OrdersService,
        private readonly _translationService: TranslocoService,
    ) {
        this._orderService.orders$
            .pipe(takeUntilDestroyed())
            .subscribe((orders) => this.orders.set(orders));
    }

    openAddInvoiceDialog(order: Order): void {
        const invoiceDialog = this.dialog.open(AddInvoiceComponent, {
            data: {order},
            width: '500px'
        });

        invoiceDialog.afterClosed().subscribe((result) => {
            if (result) {
                console.log(result);
                this._notyf.success(this._translationService.translate('operations.orders.invoice.added', {invoiceNumber: result.invoiceNumber}));
            }
        });
    }

    filterOrders(): void {
        const filters = this.filters();

        this._orderService.getAll(filters);
    }
}
