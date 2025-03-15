import { Component, computed, inject, model, OnDestroy, resource, Signal, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { InvoicesService }                                                                                                   from '@modules/admin/administration/invoices/invoices.service';
import { InvoiceStatusConfig, InvoiceStatusEnum }                                                                            from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                                               from '@ngneat/transloco';
import { debounceTime, firstValueFrom, map }                                                                                 from 'rxjs';
import { PageHeaderComponent }                                                                                               from '@layout/components/page-header/page-header.component';
import { MatIcon }                                                                                                           from '@angular/material/icon';
import { MatButton, MatIconButton }                                                                                          from '@angular/material/button';
import { MatTooltip }                                                                                                        from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints }                                                                                   from '@angular/cdk/layout';
import { toSignal }                                                                                                          from '@angular/core/rxjs-interop';
import { MatTableModule }                                                                                                    from '@angular/material/table';
import { MatSortModule }                                                                                                     from '@angular/material/sort';
import { trackByFn }                                                                                                         from '@libs/ui/utils/utils';
import { MatInput }                                                                                                          from '@angular/material/input';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule }                                                          from '@angular/forms';
import { MatAutocompleteModule }                                                                                             from '@angular/material/autocomplete';
import { ClientService }                                                                                                     from '@modules/admin/maintainers/clients/client.service';
import { MatSelect }                                                                                                         from '@angular/material/select';
import { MatFormFieldModule }                                                                                                from '@angular/material/form-field';
import { CurrencyPipe, DatePipe }                                                                                            from '@angular/common';
import { MatDatepickerToggle, MatDateRangeInput, MatDateRangePicker, MatEndDate, MatStartDate }                              from '@angular/material/datepicker';
import { DateTime }                                                                                                          from 'luxon';
import { MatMenuModule }                                                                                                     from '@angular/material/menu';
import { Invoice }                                                                                                           from '@modules/admin/administration/invoices/domains/model/invoice';
import { MatDialog }                                                                                                         from '@angular/material/dialog';
import { UpdateInvoiceStatusDialog }                                                                                         from '@modules/admin/administration/invoices/dialogs/update-invoice-status/update-invoice-status.dialog';
import { Overlay, OverlayRef }                                                                                               from '@angular/cdk/overlay';
import { MatSlideToggle }                                                                                                    from '@angular/material/slide-toggle';
import { TemplatePortal }                                                                                                    from '@angular/cdk/portal';
import { BadgeComponent }                                                                                                    from '@shared/components/badge/badge.component';
import { OrderDetailDialog }                                                                                                 from '@modules/admin/administration/orders/dialogs/order-detail/order-detail.dialog';
import { Router }                                                                                                            from '@angular/router';
import { NotyfService }                                                                                                      from '@shared/services/notyf.service';
import { ReInvoiceDialog }                                                                                                   from '@modules/admin/administration/invoices/dialogs/re-invoice/re-invoice.dialog';
import { InvoiceDetailComponent }                                                                                            from '@modules/admin/administration/invoices/dialogs/invoice-detail/invoice-detail.component';

@Component({
    selector   : 'app-list',
    imports: [
        TranslocoDirective,
        PageHeaderComponent,
        MatIcon,
        MatIconButton,
        MatTooltip,
        MatTableModule,
        MatSortModule,
        MatInput,
        FormsModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        MatSelect,
        ReactiveFormsModule,
        TranslocoPipe,
        DatePipe,
        CurrencyPipe,
        MatStartDate,
        MatEndDate,
        MatDateRangeInput,
        MatDatepickerToggle,
        MatDateRangePicker,
        MatMenuModule,
        MatSlideToggle,
        BadgeComponent
    ],
    templateUrl: './list.component.html'
})
export class ListComponent implements OnDestroy {
    readonly #dialog = inject(MatDialog);
    readonly #translationService = inject(TranslocoService);
    readonly #clientService = inject(ClientService);
    readonly #overlay = inject(Overlay);
    readonly #vcr = inject(ViewContainerRef);
    readonly #invoicesService = inject(InvoicesService);
    readonly #router = inject(Router);
    readonly #notyf = inject(NotyfService);
    #overlayRef: OverlayRef;
    readonly breakpointObserver = inject(BreakpointObserver);
    readonly isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
    readonly today = DateTime.now().toISODate();

    isMobile = toSignal(this.isMobile$, {initialValue: false});

    // Fields from query params
    readonly invoiceNumberQP = model(undefined, {alias: 'invoiceNumber'});

    // Table
    displayedColumns = [ 'invoiceNumber', 'orderNumber', 'client', 'status', 'isPaid', 'emissionDate', 'dueDate', 'netAmount', 'taxAmount', 'totalAmount', 'actions' ];
    displayedColumnsFilters = this.displayedColumns.map((column) => column + 'Filter');
    // formControls
    invoiceNumberFormControl = new FormControl<number>(undefined);
    orderNumberFormControl = new FormControl();
    clientFormControl = new FormControl();
    statusFormControl = new FormControl();
    isPaidFormControl = new FormControl();
    emissionDateFormControl = new FormGroup({
        from: new FormControl<DateTime>(undefined),
        to  : new FormControl<DateTime>(undefined),
    });
    dueDateFormControl = new FormGroup({
        from: new FormControl<DateTime>(undefined),
        to  : new FormControl<DateTime>(undefined),
    });
    netAmountFormControl = new FormGroup({
        from: new FormControl<number>(undefined),
        to  : new FormControl<number>(undefined),
    });
    taxAmountFormControl = new FormGroup({
        from: new FormControl<number>(undefined),
        to  : new FormControl<number>(undefined),
    });
    totalAmountFormControl = new FormGroup({
        from: new FormControl<number>(undefined),
        to  : new FormControl<number>(undefined),
    });
    deliveryAssignmentFormControl = new FormControl();

    // signals from formControls
    invoiceNumberFilter = toSignal(this.invoiceNumberFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: undefined});
    orderNumberFilter = toSignal(this.orderNumberFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    clientFilter = toSignal(this.clientFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    statusFilter = toSignal(this.statusFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    isPaidFilter = toSignal(this.isPaidFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: false});
    emissionDateFilter = toSignal(this.emissionDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    dueDateFilter = toSignal(this.dueDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    netAmountFilter = toSignal(this.netAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    taxAmountFilter = toSignal(this.taxAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    totalAmountFilter = toSignal(this.totalAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    deliveryAssignmentFilter = toSignal(this.deliveryAssignmentFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});

    // Additional signals
    showMobileFilters = signal<boolean>(false);
    showColumnsOverlay = signal(false);

    localStorageColumns = signal<string[] | undefined>(localStorage.getItem('invoiceListColumnsConfig') ? JSON.parse(localStorage.getItem('invoiceListColumnsConfig')) : undefined);
    localStorageFilterColumns = signal<string[] | undefined>(localStorage.getItem('invoiceListColumnsFilterConfig') ? JSON.parse(localStorage.getItem('invoiceListColumnsFilterConfig')) : undefined);
    columns = signal(this.localStorageColumns() ?? [ ...this.displayedColumns ]);
    filterColumns = signal(this.localStorageFilterColumns() ?? [ ...this.displayedColumnsFilters ]);

    filters = computed(() => {
        const filter = {};

        if (this.invoiceNumberFilter()) filter['invoiceNumber'] = this.invoiceNumberFilter();
        if (this.orderNumberFilter()) filter['orderNumber'] = this.orderNumberFilter();
        if (this.clientFilter()) filter['clientId'] = this.clientFilter().map((client) => client.id);
        if (this.statusFilter()) filter['status'] = this.statusFilter();
        if (this.isPaidFilter()) filter['isPaid'] = this.isPaidFilter();
        if (this.emissionDateFilter()?.from || this.emissionDateFilter()?.to) filter['emissionDate'] = JSON.stringify({
            from: this.emissionDateFilter()?.from && this.emissionDateFilter()?.from.toISODate(),
            to  : this.emissionDateFilter()?.to && this.emissionDateFilter()?.to.toISODate()
        });
        if (this.dueDateFilter()?.from || this.dueDateFilter()?.to) filter['dueDate'] = JSON.stringify({
            from: this.dueDateFilter()?.from && this.dueDateFilter()?.from.toISODate(),
            to  : this.dueDateFilter()?.to && this.dueDateFilter()?.to.toISODate()
        });
        if (this.netAmountFilter()?.from || this.netAmountFilter()?.to) filter['netAmount'] = JSON.stringify(this.netAmountFilter());
        if (this.taxAmountFilter()?.from || this.taxAmountFilter()?.to) filter['taxAmount'] = JSON.stringify(this.taxAmountFilter());
        if (this.totalAmountFilter()?.from || this.totalAmountFilter()?.to) filter['totalAmount'] = JSON.stringify(this.totalAmountFilter());
        if (this.deliveryAssignmentFilter()) filter['deliveryAssignment'] = this.deliveryAssignmentFilter();

        return filter;
    });
    translatedSelectedStatus = computed(() => {
        return this.statusFilter()?.map((status) => this.#translationService.translate(`enums.invoice-status.${ status }`)).join(',\n ');
    });
    clientsResource = resource({
        loader: () => firstValueFrom(this.#clientService.findAll({}, 'COMPACT'))
    });
    invoicesResource = resource({
        request: () => this.filters(),
        loader: async () => firstValueFrom(this.#invoicesService.findAll(this.filters()))
    });
    columnsOverlay: Signal<TemplateRef<any>> = viewChild('columnsOverlay');
    columnsOverlayButton: Signal<MatButton> = viewChild('columnsOverlayButton');

    protected readonly trackByFn = trackByFn;
    protected readonly invoiceStatuses = Object.values(InvoiceStatusEnum);
    protected readonly InvoiceStatusEnum = InvoiceStatusEnum;
    protected readonly InvoiceStatusConfig = InvoiceStatusConfig;

    ngOnInit() {
        if (this.invoiceNumberQP()) this.invoiceNumberFormControl.setValue(this.invoiceNumberQP());

        // remove invoiceNumber from query params
        this.#router.navigate([], {queryParams: {invoiceNumber: null}, queryParamsHandling: 'merge'});
    }

    ngOnDestroy() {
        if (this.#overlayRef) this.#overlayRef.detach();
    }
    protected readonly DateTime = DateTime;

    // Toggle column visibility, keeping the order from the original displayedColumns array
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

    openColumnsOverlay = () => {
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

    viewOrderDetail = (invoice: Invoice) => {
        this.#dialog.open(OrderDetailDialog, {data: {id: invoice.order.id}, maxWidth: '900px'});
    };

    updateStatusInvoice = (invoice: Invoice) => {
        if (invoice.isPaid) {
            this.#notyf.warning('Factura en estado final, no se puede modificar.');
            return;
        }

        if (invoice.status === InvoiceStatusEnum.RE_INVOICED) {
            this.#notyf.warning('Estado de factura no permitido para modificación.');
            return;
        }


        const dialog = this.#dialog.open(UpdateInvoiceStatusDialog, {
            data : {invoice},
            width: '400px'
        });

        dialog.afterClosed().subscribe((result) => {
            if (result) {
                this.invoicesResource.reload();
            }
        });
    };

    persistColumnsConfiguration = (): void => {
        localStorage.setItem('invoiceListColumnsConfig', JSON.stringify(this.columns()));
        localStorage.setItem('invoiceListColumnsFilterConfig', JSON.stringify(this.filterColumns()));
    };

    reInvoice = (invoice: Invoice) => {
        const dialog = this.#dialog.open(ReInvoiceDialog, {data: {invoice, width: '500px'}});

        dialog.afterClosed().subscribe((result) => result && this.invoicesResource.reload());
    };

    isLessThan6Months = (emissionDate: any) => {
        return DateTime.fromISO(emissionDate).diffNow('months').months < 6;
    };

    getPayments = (invoice) => {
        const totalPayments = invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
        const percentagePaid = Math.round((totalPayments / invoice.totalAmount) * 100 * 100) / 100;

        return {totalPayments, percentagePaid};
    };

    openDetail(invoice: Invoice) {
        this.#dialog.open(InvoiceDetailComponent, {
            data : {invoiceId: invoice.id},
            width: '900px'
        });
    }
}

