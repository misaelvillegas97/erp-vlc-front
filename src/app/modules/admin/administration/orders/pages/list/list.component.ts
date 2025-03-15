import { Component, computed, inject, OnDestroy, resource, Signal, signal, TemplateRef, viewChild, ViewContainerRef, WritableSignal }                   from '@angular/core';
import { BreakpointObserver, Breakpoints }                                                                                                              from '@angular/cdk/layout';
import { Overlay, OverlayRef }                                                                                                                          from '@angular/cdk/overlay';
import { TemplatePortal }                                                                                                                               from '@angular/cdk/portal';
import { CurrencyPipe, DatePipe }                                                                                                                       from '@angular/common';
import { toSignal }                                                                                                                                     from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule }                                                                                                from '@angular/forms';
import { MatSlideToggle }                                                                                                                               from '@angular/material/slide-toggle';
import { MatSort, MatSortHeader }                                                                                                                       from '@angular/material/sort';
import { MatDialog }                                                                                                                                    from '@angular/material/dialog';
import { MatFormFieldModule }                                                                                                                           from '@angular/material/form-field';
import { MatInputModule }                                                                                                                               from '@angular/material/input';
import { MatSelectModule }                                                                                                                              from '@angular/material/select';
import { MatIcon }                                                                                                                                      from '@angular/material/icon';
import { MatButton, MatButtonModule, MatIconAnchor }                                                                                                    from '@angular/material/button';
import { MatTooltip }                                                                                                                                   from '@angular/material/tooltip';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { Router, RouterLink }                                                                                                                           from '@angular/router';

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
import { BadgeComponent }                     from '@shared/components/badge/badge.component';
import { Invoice }                            from '@modules/admin/administration/invoices/domains/model/invoice';

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
        TranslocoPipe,
        MatSlideToggle,
        BadgeComponent,


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
    emissionDateFormControl = new FormControl<string>(undefined);
    deliveryDateFormControl = new FormControl<string>(undefined);
    amountFormControl = new FormControl<number>(undefined);
    isMobile = toSignal(this.isMobile$, {initialValue: false});

    readonly displayedColumns: string[] = [ 'info', 'orderNumber', 'businessName', 'type', 'status', 'invoice', 'deliveryLocation', 'deliveryDate', 'emissionDate', 'amount', 'actions' ];
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

    // Additional signals
    columnsOverlay: Signal<TemplateRef<any>> = viewChild('columnsOverlay');
    columnsOverlayButton: Signal<MatButton> = viewChild('columnsOverlayButton');
    showMobileFilters: WritableSignal<boolean> = signal<boolean>(false);
    showColumnsOverlay = signal(false);
    localStorageColumns = signal<string[] | undefined>(localStorage.getItem('ordersListColumnsConfig') ? JSON.parse(localStorage.getItem('ordersListColumnsConfig')) : undefined);
    localStorageFilterColumns = signal<string[] | undefined>(localStorage.getItem('ordersListColumnsFilterConfig') ? JSON.parse(localStorage.getItem('ordersListColumnsFilterConfig')) : undefined);
    columns = signal(this.localStorageColumns() ?? [ ...this.displayedColumns ]);
    filterColumns = signal(this.localStorageFilterColumns() ?? [ ...this.displayedFilterColumns ]);

    translatedSelectedStatus = computed(() => {
        return this.statusFilter() ? this.statusFilter().map((status) => this.#ts.translate('enums.order-status.' + status)).join(',\n ') : [];
    });
    filters = computed(() => {
        const filter = {};

        if (this.orderNumberFilter()?.toString().length > 0) filter['orderNumber'] = this.orderNumberFilter();
        if (this.businessNameFilter()?.length > 0) filter['clientId'] = this.businessNameFilter().map((client: Client) => client.id);
        if (this.typeFilter()?.length > 0) filter['type'] = this.typeFilter();
        if (this.statusFilter()?.length > 0) filter['status'] = this.statusFilter();
        if (this.deliveryLocationFilter()?.length > 0) filter['deliveryLocation'] = this.deliveryLocationFilter();
        if (this.emissionDateFilter()?.length > 0) filter['emissionDate'] = this.emissionDateFilter();
        if (this.deliveryDateFilter()?.length > 0) filter['deliveryDate'] = this.deliveryDateFilter();
        if (this.amountFilter() && this.amountFilter() >= 0) filter['amount'] = this.amountFilter();
        if (this.invoiceFilter() && this.invoiceFilter() >= 0) filter['invoice'] = this.invoiceFilter();

        return filter;
    });

    ordersResource = resource({
        request: () => this.filters(),
        loader : () => firstValueFrom(this.#ordersService.findAll(this.filters()))
    });

    clientsResource = resource({
        loader: () => firstValueFrom(this.#clientService.findAll({}, 'COMPACT'))
    });

    protected readonly OrderStatusEnum = OrderStatusEnum;
    protected readonly OrderStatusEnumValues = Object.values(OrderStatusEnum);
    protected readonly trackByFn = trackByFn;
    protected readonly Date = Date;
    protected readonly OrderStatusConfig = OrderStatusConfig;

    ngOnDestroy() {
        if (this.#overlayRef) this.#overlayRef.detach();
    }

    toggleColumn = (column: string) => {
        const originalOrder = [ ...this.displayedColumns ];
        const columns = this.columns();
        const filterColumns = this.filterColumns();
        const index = columns.indexOf(column);

        if (index > -1) {
            columns.splice(index, 1);
            filterColumns.splice(index, 1);
        } else {
            columns.push(column);
            filterColumns.push(column + 'Filter');
            columns.sort((a, b) => originalOrder.indexOf(a) - originalOrder.indexOf(b));
            filterColumns.sort((a, b) =>
                originalOrder.indexOf(a.replace('Filter', '')) - originalOrder.indexOf(b.replace('Filter', '')));
        }

        this.columns.set(columns);
        this.filterColumns.set(filterColumns);
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
            data: {order},
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
        this.#overlayRef = this.#overlay.create({
            backdropClass   : '',
            hasBackdrop     : true,
            scrollStrategy  : this.#overlay.scrollStrategies.block(),
            positionStrategy: this.#overlay
                .position()
                .flexibleConnectedTo(
                    this.columnsOverlayButton()._elementRef.nativeElement
                )
                .withFlexibleDimensions(true)
                .withViewportMargin(16)
                .withLockedPosition(true)
                .withPositions([
                    {
                        originX : 'start',
                        originY : 'bottom',
                        overlayX: 'start',
                        overlayY: 'top',
                    },
                    {
                        originX : 'start',
                        originY : 'top',
                        overlayX: 'start',
                        overlayY: 'bottom',
                    },
                    {
                        originX : 'end',
                        originY : 'bottom',
                        overlayX: 'end',
                        overlayY: 'top',
                    },
                    {
                        originX : 'end',
                        originY : 'top',
                        overlayX: 'end',
                        overlayY: 'bottom',
                    },
                ]),
        });

        // Create a portal from the template
        const templatePortal = new TemplatePortal(this.columnsOverlay(), this.#vcr);

        this.#overlayRef.attach(templatePortal);

        this.#overlayRef.backdropClick().subscribe(() => {
            this.#overlayRef.detach();
        });

        if (templatePortal && templatePortal.isAttached) {
            // Detach it
            templatePortal.detach();
        }
    };

    openInvoiceDetail = (order: Order, invoice: Invoice) => {
        this.#dialog.open(InvoiceDetailComponent, {
            data: {order, invoice}
        });
    };

    persistColumnsConfiguration = (): void => {
        localStorage.setItem('ordersListColumnsConfig', JSON.stringify(this.columns()));
        localStorage.setItem('ordersListColumnsFilterConfig', JSON.stringify(this.filterColumns()));
    };

    findActiveInvoice = (invoices: Invoice[]) => invoices.find((invoice) => invoice.isActive);
}
