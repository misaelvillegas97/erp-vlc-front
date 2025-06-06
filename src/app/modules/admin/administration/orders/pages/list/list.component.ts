import { Component, computed, inject, linkedSignal, OnDestroy, resource, Signal, signal, TemplateRef, viewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { BreakpointObserver, Breakpoints }                                                                                                          from '@angular/cdk/layout';
import { Overlay, OverlayRef }                                                                                                                      from '@angular/cdk/overlay';
import { toSignal }                                                                                                                                 from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule }                                                                                            from '@angular/forms';
import { MatSlideToggle }                                                                                                                           from '@angular/material/slide-toggle';
import { MatDialog }                                                                                                                                from '@angular/material/dialog';
import { MatFormFieldModule }                                                                                                                       from '@angular/material/form-field';
import { MatInputModule }                                                                                                                           from '@angular/material/input';
import { MatSelectModule }                                                                                                                          from '@angular/material/select';
import { MatIcon }                                                                                                                                  from '@angular/material/icon';
import { MatButton, MatButtonModule, MatIconAnchor }                                                                                                from '@angular/material/button';
import { MatTooltip }                                                                                                                               from '@angular/material/tooltip';
import { Router, RouterLink }                                                                                                                       from '@angular/router';

import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DateTime }                                            from 'luxon';
import { Notyf }                                               from 'notyf';
import { debounceTime, firstValueFrom, map }                   from 'rxjs';

import { trackByFn }           from '@libs/ui/utils/utils';
import { PageHeaderComponent } from '@layout/components/page-header/page-header.component';
import { OrdersService }       from '@modules/admin/administration/orders/orders.service';

import { Order }                              from '@modules/admin/administration/orders/domain/model/order';
import { OrderTypeEnum }                      from '@modules/admin/administration/orders/domain/enums/order-type.enum';
import { OrderStatusConfig, OrderStatusEnum } from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { InvoiceAddComponent }                from '@modules/admin/administration/orders/dialogs/invoice-add/invoice-add.component';
import { InvoiceDetailComponent }             from '@modules/admin/administration/invoices/dialogs/invoice-detail/invoice-detail.component';
import { OrderDetailDialog }                  from '@modules/admin/administration/orders/dialogs/order-detail/order-detail.dialog';
import { Client }                             from '@modules/admin/maintainers/clients/domain/model/client';
import { ClientService }                      from '@modules/admin/maintainers/clients/client.service';
import { Invoice }                            from '@modules/admin/administration/invoices/domains/model/invoice';
import { TableBuilderComponent }              from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                       from '@shared/components/table-builder/column.type';
import { openOverlay }                        from '@shared/utils/overlay.util';

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
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormsModule,
        TranslocoPipe,
        MatSlideToggle,
        TableBuilderComponent,
    ],
    templateUrl: './list.component.html',
    host       : {
        // Listen for client to press alt + n to add a new order
        '(document:keydown.Alt.n)': 'router.navigate(["/orders", "new"])'
    }
})
export class ListComponent implements OnDestroy {
    readonly #dialog = inject(MatDialog);
    readonly #ts = inject(TranslocoService);
    readonly #ordersService = inject(OrdersService);
    readonly #clientService = inject(ClientService);
    readonly #breakpointObserver = inject(BreakpointObserver);
    readonly #overlay = inject(Overlay);
    readonly #vcr = inject(ViewContainerRef);
    #overlayRef: OverlayRef;

    private _notyf = new Notyf();
    readonly router = inject(Router);
    readonly isMobile$ = this.#breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
    readonly today = DateTime.now().toISODate();

    orderNumberFormControl = new FormControl<string>(undefined);
    clientFormControl = new FormControl<Client[]>(undefined);
    typeFormControl = new FormControl<OrderTypeEnum[]>(undefined);
    statusFormControl = new FormControl<OrderStatusEnum[]>(undefined);
    invoiceFormControl = new FormControl<number>(undefined);
    deliveryLocationFormControl = new FormControl<string>(undefined);
    emissionDateFormControl = new FormControl<DateTime>(undefined);
    deliveryDateFormControl = new FormControl<DateTime>(undefined);
    amountFormControl = new FormControl<number>(undefined);
    isMobile = toSignal(this.isMobile$, {initialValue: false});

    orderNumberFilter = toSignal(this.orderNumberFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    businessNameFilter = toSignal(this.clientFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    typeFilter = toSignal(this.typeFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    statusFilter = toSignal(this.statusFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    deliveryLocationFilter = toSignal(this.deliveryLocationFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    emissionDateFilter = toSignal(this.emissionDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    deliveryDateFilter = toSignal(this.deliveryDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    amountFilter = toSignal(this.amountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    invoiceFilter = toSignal(this.invoiceFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});

    // Additional signals
    columnsOverlay: Signal<TemplateRef<any>> = viewChild('columnsOverlay');
    columnsOverlayButton: Signal<MatButton> = viewChild('columnsOverlayButton');

    // Columns
    customInfoColumn = viewChild<TemplateRef<any>>('infoCell');
    customInvoiceColumn = viewChild<TemplateRef<any>>('invoiceCell');
    customActionsColumn = viewChild<TemplateRef<any>>('actionsCell');
    showColumnsOverlay = signal(false);

    // Pagination
    pagination = signal({page: 1, limit: 10, totalElements: 0, totalPages: 0, disabled: true});

    filters = computed(() => {
        const filter = {};

        if (this.orderNumberFilter()?.toString().length > 0) filter['orderNumber'] = this.orderNumberFilter();
        if (this.businessNameFilter()?.length > 0) filter['clientId'] = this.businessNameFilter().map((client: Client) => client.id);
        if (this.typeFilter()?.length > 0) filter['type'] = this.typeFilter();
        if (this.statusFilter()?.length > 0) filter['status'] = this.statusFilter();
        if (this.deliveryLocationFilter()?.length > 0) filter['deliveryLocation'] = this.deliveryLocationFilter();
        if (this.emissionDateFilter()?.toISODate()) filter['emissionDate'] = this.emissionDateFilter()?.toISODate();
        if (this.deliveryDateFilter()?.toISODate()) filter['deliveryDate'] = this.deliveryDateFilter()?.toISODate();
        if (this.amountFilter() && this.amountFilter() >= 0) filter['amount'] = this.amountFilter();
        if (this.invoiceFilter() && this.invoiceFilter() >= 0) filter['invoice'] = this.invoiceFilter();

        // TODO: check if this computed it is called even on reload method of resource.

        return filter;
    });

    columnsConfig: WritableSignal<ColumnConfig<Order>[]> = linkedSignal(() => {
        const persistedOrder: string[] = localStorage.getItem('ordersListColumnsConfig') && JSON.parse(localStorage.getItem('ordersListColumnsConfig'));

        const columns: ColumnConfig<Order>[] = [
            {
                key    : 'info',
                header : '',
                display: {
                    customTemplate  : this.customInfoColumn(),
                    containerClasses: 'block w-8'
                },
                visible: true
            },
            {
                key    : 'orderNumber',
                header : this.#ts.translate('operations.orders.list.table.order-number'),
                display: {
                    classes: 'text-sm text-blue-500 cursor-pointer hover:underline',
                    type   : 'text',
                    onClick: (row) => this.view(row)
                },
                filter : {
                    control: this.orderNumberFormControl,
                    type   : 'text'
                },
                visible: true
            },
            {
                key    : 'client',
                header : this.#ts.translate('operations.orders.list.table.client'),
                display: {
                    type     : 'text',
                    classes  : 'text-sm',
                    label: (client: Client, row) => client.fantasyName
                },
                filter : {
                    control : this.clientFormControl,
                    type    : 'select',
                    options : this.clientsResource.value()?.map((client) => ({
                        value    : client,
                        viewValue: client.fantasyName
                    })),
                    multiple: true
                },
                visible: true
            },
            {
                key    : 'type',
                header : this.#ts.translate('operations.orders.list.table.type'),
                display: {
                    classes  : 'text-sm',
                    type     : 'text',
                    label: (value: string) => this.#ts.translate('enums.order-type.' + value)
                },
                filter : {
                    control : this.typeFormControl,
                    type    : 'select',
                    options : Object.values(OrderTypeEnum).map((type) => ({
                        value    : type,
                        viewValue: this.#ts.translate('enums.order-type.' + type)
                    })),
                    multiple: true
                },
                visible: true
            },
            {
                key    : 'status',
                header : this.#ts.translate('operations.orders.list.table.status'),
                display: {
                    classes    : 'text-sm',
                    type       : 'badge',
                    color: (status: OrderStatusEnum) => OrderStatusConfig[status].color,
                    label: (status: OrderStatusEnum) => this.#ts.translate('enums.order-status.' + status)
                },
                filter : {
                    control : this.statusFormControl,
                    type    : 'select',
                    options : Object.values(OrderStatusEnum).map((status) => ({
                        value    : status,
                        viewValue: this.#ts.translate('enums.order-status.' + status)
                    })),
                    multiple: true
                },
                visible: true
            },
            {
                key    : 'invoice',
                header : this.#ts.translate('operations.orders.list.table.invoice'),
                display: {
                    type          : 'custom',
                    customTemplate: this.customInvoiceColumn()
                },
                filter : {
                    control: this.invoiceFormControl,
                    type   : 'number'
                },
                visible: true
            },
            {
                key    : 'deliveryLocation',
                header : this.#ts.translate('operations.orders.list.table.delivery-location'),
                display: {
                    classes: 'text-sm line-clamp-1',
                    type   : 'text'
                },
                filter : {
                    control: this.deliveryLocationFormControl,
                    type   : 'text'
                },
                visible: true
            },
            {
                key    : 'deliveryDate',
                header : this.#ts.translate('operations.orders.list.table.delivery-date'),
                display: {
                    classes    : (row) => {
                        return row.deliveryDate && DateTime.fromISO(row.deliveryDate).toMillis() < DateTime.now().toMillis() ? 'text-sm text-red-500' : 'text-sm';
                    },
                    type       : 'date',
                    pipeOptions: {format: 'dd-MM-yyyy'}
                },
                filter : {
                    control: this.deliveryDateFormControl,
                    type   : 'date'
                },
                visible: true
            },
            {
                key    : 'emissionDate',
                header : this.#ts.translate('operations.orders.list.table.emission-date'),
                display: {
                    classes    : 'text-sm',
                    type       : 'date',
                    pipeOptions: {format: 'dd-MM-yyyy'}
                },
                filter : {
                    control: this.emissionDateFormControl,
                    type   : 'date'
                },
                visible: true
            },
            {
                key    : 'totalAmount',
                header : this.#ts.translate('operations.orders.list.table.amount'),
                display: {
                    classes    : 'text-sm',
                    type       : 'currency',
                    pipeOptions: {currency: 'CLP', symbolDisplay: 'symbol-narrow'}
                },
                filter : {
                    control: this.amountFormControl,
                    type   : 'number'
                },
                visible: true
            },
            // {
            //   key: 'actions',
            //   header: this.#ts.translate('operations.orders.list.table.actions'),
            //   display: {
            //     type: 'custom',
            //     customTemplate: this.customActionsColumn()
            //   }
            // }
        ];

        return persistedOrder ? columns.map((column) => {
            const foundColumn = persistedOrder.find((col) => col === column.key);
            return foundColumn ? column : {...column, visible: false};
        }) : columns;
    });

    columns = computed(() => this.columnsConfig().filter(col => col.visible).map((column) => column.key));

    ordersResource = resource({
        request: () => ({filters: this.filters(), pagination: this.pagination()}),
        loader : async ({request}) => {
            const paginationOrders = await firstValueFrom(this.#ordersService.findAll(request.filters, {
                page : request.pagination.page,
                limit: request.pagination.limit
            }));

            this.pagination.set({
                page         : paginationOrders.page,
                limit        : paginationOrders.limit,
                totalElements: paginationOrders.totalElements,
                totalPages   : paginationOrders.totalPages,
                disabled     : false
            });

            return paginationOrders.items;
        }
    });

    clientsResource = resource({
        loader: () => firstValueFrom(this.#clientService.findAll({}, 'COMPACT'))
    });
    protected readonly OrderStatusEnum = OrderStatusEnum;
    protected readonly trackByFn = trackByFn;
    protected readonly Date = Date;

    ngOnDestroy() {
        if (this.#overlayRef) this.#overlayRef.detach();
    }

    toggleColumn = (columnKey: string) => {
        const currentConfig = this.columnsConfig();
        const index = currentConfig.findIndex((col) => col.key === columnKey);

        if (index !== -1) {
            const updatedColumn = {
                ...currentConfig[index],
                visible: !currentConfig[index].visible
            };

            const newConfig = [ ...currentConfig ];
            newConfig[index] = updatedColumn;

            this.columnsConfig.set(newConfig);
        }

        this.persistColumnsConfiguration();
    };

    clearFilters = () => {
        this.orderNumberFormControl.setValue(undefined);
        this.clientFormControl.setValue(undefined);
        this.typeFormControl.setValue(undefined);
        this.statusFormControl.setValue(undefined);
        this.invoiceFormControl.setValue(undefined);
        this.deliveryLocationFormControl.setValue(undefined);
        this.emissionDateFormControl.setValue(undefined);
        this.deliveryDateFormControl.setValue(undefined);
        this.amountFormControl.setValue(undefined);
    };

    view = (order: Order) => {
        this.#dialog.open(OrderDetailDialog, {data: {id: order.id}});
    };

    openAddInvoiceDialog = (order: Order): void => {
        const invoiceDialog = this.#dialog.open(InvoiceAddComponent, {
            data : {order},
            width: '500px'
        });

        invoiceDialog.afterClosed().subscribe((result) => {
            if (result) {
                this._notyf.success(this.#ts.translate('operations.orders.invoice.added', {invoiceNumber: result.invoiceNumber}));
                this.ordersResource.reload();
            }
        });
    };

    openColumnsOverlay = (event: MouseEvent) => {
        this.#overlayRef = openOverlay(
            this.#overlay,
            this.#vcr,
            this.columnsOverlayButton()._elementRef.nativeElement,
            this.columnsOverlay()
        );
    };

    openInvoiceDetail = (order: Order, invoice: Invoice) => {
        this.#dialog.open(InvoiceDetailComponent, {
            data: {order, invoice}
        });
    };

    persistColumnsConfiguration = (): void => localStorage.setItem('ordersListColumnsConfig', JSON.stringify(this.columns()));

    handlePagination = (event) => {
        this.pagination.update((value) => ({
            ...value,
            page    : event.pageIndex + 1,
            limit   : event.pageSize,
            disabled: true
        }));
    };
}
