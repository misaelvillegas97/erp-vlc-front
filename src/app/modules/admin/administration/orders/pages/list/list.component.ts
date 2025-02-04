import { Component, computed, inject, resource, signal, WritableSignal }                                                                                from '@angular/core';
import { PageHeaderComponent }                                                                                                                          from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoService }                                                                                                         from '@ngneat/transloco';
import { MatIcon }                                                                                                                                      from '@angular/material/icon';
import { MatButtonModule, MatIconAnchor }                                                                                                               from '@angular/material/button';
import { MatTooltip }                                                                                                                                   from '@angular/material/tooltip';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { Router, RouterLink }                                                                                                                           from '@angular/router';
import { Order }                                                                                                                                        from '@modules/admin/administration/orders/domain/model/order';
import { Notyf }                                                                                                                                        from 'notyf';
import { OrdersService }                                                                                                                                from '@modules/admin/administration/orders/orders.service';
import { CurrencyPipe, DatePipe }                                                                                                                       from '@angular/common';
import { MatSort, MatSortHeader }                                                                                                                       from '@angular/material/sort';
import { toSignal }                                                                                                                                     from '@angular/core/rxjs-interop';
import { MatDialog }                                                                                                                                    from '@angular/material/dialog';
import { MatFormFieldModule }                                                                                                                           from '@angular/material/form-field';
import { MatInputModule }                                                                                                                               from '@angular/material/input';
import { MatSelectModule }                                                                                                                              from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule }                                                                                                from '@angular/forms';
import { OrderTypeEnum }                                                                                                                                from '@modules/admin/administration/orders/domain/enums/order-type.enum';
import { OrderStatusEnum }                                                                                                                              from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { InvoiceAddComponent }                                                                                                                          from '@modules/admin/administration/orders/dialogs/invoice-add/invoice-add.component';
import { InvoiceDetailComponent }                                                                                                                       from '@modules/admin/administration/orders/dialogs/invoice-detail/invoice-detail.component';
import { OrderDetailDialog }                                                                                                                            from '@modules/admin/administration/orders/dialogs/order-detail/order-detail.dialog';
import { trackByFn }                                                                                                                                    from '@libs/ui/utils/utils';
import { round }                                                                                                                                        from 'lodash-es';
import { BreakpointObserver, Breakpoints }                                                                                                              from '@angular/cdk/layout';
import { debounceTime, firstValueFrom, map }                                                                                                            from 'rxjs';
import { Client }                                                                                                                                       from '@modules/admin/maintainers/clients/domain/model/client';
import { ClientService }                                                                                                                                from '@modules/admin/maintainers/clients/client.service';

@Component({
    selector   : 'app-list',
    imports: [
        ReactiveFormsModule,
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
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormsModule,
        DatePipe,

    ],
    templateUrl: './list.component.html',
    host       : {
        // Listen for client to press alt + n to add a new order
        '(document:keydown.Alt.n)': 'router.navigate(["/orders", "new"])'
    }
})
export class ListComponent {
    readonly #dialog = inject(MatDialog);
    readonly #translationService = inject(TranslocoService);
    readonly #ordersService = inject(OrdersService);
    readonly #clientService = inject(ClientService);
    readonly #breakpointObserver = inject(BreakpointObserver);
    readonly router = inject(Router);
    readonly isMobile$ = this.#breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));

    orderNumberFormControl = new FormControl<string>(undefined);
    clientFormControl = new FormControl<Client[]>(undefined);
    typeFormControl = new FormControl<OrderTypeEnum[]>(undefined);
    statusFormControl = new FormControl<OrderStatusEnum[]>(undefined);
    invoiceFormControl = new FormControl<number>(undefined);
    deliveryLocationFormControl = new FormControl<string>(undefined);
    emissionDateFormControl = new FormControl<string>(undefined);
    deliveryDateFormControl = new FormControl<string>(undefined);
    amountFormControl = new FormControl<number>(undefined);

    isMobile = toSignal(this.isMobile$, {initialValue: false});
    readonly displayedColumns: string[] = [ 'orderNumber', 'businessName', 'type', 'status', 'invoice', 'deliveryLocation', 'deliveryDate', 'emissionDate', 'amount', 'actions' ];
    readonly displayedFilterColumns: string[] = this.displayedColumns.map((column) => column + 'Filter');
    orderNumberFilter = toSignal(this.orderNumberFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    businessNameFilter = toSignal(this.clientFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    typeFilter = toSignal(this.typeFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    statusFilter = toSignal(this.statusFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    deliveryLocationFilter = toSignal(this.deliveryLocationFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    emissionDateFilter = toSignal(this.emissionDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    deliveryDateFilter = toSignal(this.deliveryDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    amountFilter = toSignal(this.amountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    invoiceFilter = toSignal(this.invoiceFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});

    showMobileFilters: WritableSignal<boolean> = signal<boolean>(false);

    filters = computed(() => {
        const filter = {};

        if (this.orderNumberFilter()?.length >= 0)
            filter['orderNumber'] = this.orderNumberFilter();

        if (this.businessNameFilter()?.length > 0)
            filter['clientId'] = this.businessNameFilter().map((client: Client) => client.id);

        if (this.typeFilter()?.length > 0)
            filter['type'] = this.typeFilter();

        if (this.statusFilter()?.length > 0)
            filter['status'] = this.statusFilter();

        if (this.deliveryLocationFilter()?.length > 0)
            filter['deliveryLocation'] = this.deliveryLocationFilter();

        if (this.emissionDateFilter()?.length > 0)
            filter['emissionDate'] = this.emissionDateFilter();

        if (this.deliveryDateFilter()?.length > 0)
            filter['deliveryDate'] = this.deliveryDateFilter();

        if (this.amountFilter() && this.amountFilter() >= 0)
            filter['amount'] = this.amountFilter();

        if (this.invoiceFilter() && this.invoiceFilter() >= 0)
            filter['invoice'] = this.invoiceFilter();

        return filter;
    });

    ordersResource = resource({
        request: () => this.filters(),
        loader : () => firstValueFrom(this.#ordersService.findAll(this.filters()))
    });

    translatedSelectedStatus = computed(() => {
        const mapped = this.statusFilter() ? this.statusFilter().map((status) => this.#translationService.translate('enums.order-status.' + status)) : [];
        return mapped.join(',\n ');
    });

    clientsResource = resource({
        loader: () => firstValueFrom(this.#clientService.findAll({}, 'COMPACT'))
    });


    private _notyf = new Notyf();

    view(order: Order) {
        this.#dialog.open(OrderDetailDialog, {data: {order}});
    }

    openAddInvoiceDialog(order: Order): void {
        const invoiceDialog = this.#dialog.open(InvoiceAddComponent, {
            data: {order},
            width: '500px'
        });

        invoiceDialog.afterClosed().subscribe((result) => {
            console.log(result);
            if (result) {
                this._notyf.success(this.#translationService.translate('operations.orders.invoice.added', {invoiceNumber: result.invoiceNumber}));
                this.ordersResource.reload();
            }
        });
    }

    openInvoiceDetail(order: Order) {
        this.#dialog.open(InvoiceDetailComponent, {
            data: {order}
        });
    }

    protected readonly trackByFn = trackByFn;
    protected readonly round = round;
}
