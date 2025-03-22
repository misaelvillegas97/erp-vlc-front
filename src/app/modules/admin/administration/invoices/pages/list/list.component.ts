import { Component, computed, inject, linkedSignal, model, OnDestroy, resource, Signal, signal, TemplateRef, viewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { InvoicesService }                                                                                                                                 from '@modules/admin/administration/invoices/invoices.service';
import { InvoiceStatusConfig, InvoiceStatusEnum }                                                                                                          from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                                                                             from '@ngneat/transloco';
import { debounceTime, firstValueFrom }                                                                                                                    from 'rxjs';
import { PageHeaderComponent }                                                                                                                             from '@layout/components/page-header/page-header.component';
import { MatIcon }                                                                                                                                         from '@angular/material/icon';
import { MatButton, MatIconButton }                                                                                                                        from '@angular/material/button';
import { MatTooltip }                                                                                                                                      from '@angular/material/tooltip';
import { toSignal }                                                                                                                                        from '@angular/core/rxjs-interop';
import { MatTableModule }                                                                                                                                  from '@angular/material/table';
import { MatSortModule }                                                                                                                                   from '@angular/material/sort';
import { trackByFn }                                                                                                                                       from '@libs/ui/utils/utils';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule }                                                                                        from '@angular/forms';
import { MatAutocompleteModule }                                                                                                                           from '@angular/material/autocomplete';
import { ClientService }                                                                                                                                   from '@modules/admin/maintainers/clients/client.service';
import { MatFormFieldModule }                                                                                                                              from '@angular/material/form-field';
import { DateTime }                                                                                                                                        from 'luxon';
import { MatMenuModule }                                                                                                                                   from '@angular/material/menu';
import { Invoice }                                                                                                                                         from '@modules/admin/administration/invoices/domains/model/invoice';
import { MatDialog }                                                                                                                                       from '@angular/material/dialog';
import { UpdateInvoiceStatusDialog }                                                                                                                       from '@modules/admin/administration/invoices/dialogs/update-invoice-status/update-invoice-status.dialog';
import { Overlay, OverlayRef }                                                                                                                             from '@angular/cdk/overlay';
import { MatSlideToggle }                                                                                                                                  from '@angular/material/slide-toggle';
import { OrderDetailDialog }                                                                                                                               from '@modules/admin/administration/orders/dialogs/order-detail/order-detail.dialog';
import { Router }                                                                                                                                          from '@angular/router';
import { NotyfService }                                                                                                                                    from '@shared/services/notyf.service';
import { ReInvoiceDialog }                                                                                                                                 from '@modules/admin/administration/invoices/dialogs/re-invoice/re-invoice.dialog';
import { InvoiceDetailComponent }                                                                                                                          from '@modules/admin/administration/invoices/dialogs/invoice-detail/invoice-detail.component';
import { openOverlay }                                                                                                                                     from '@shared/utils/overlay.util';
import { ColumnConfig }                                                                                                                                    from '@shared/components/table-builder/column.type';
import { Client }                                                                                                                                          from '@modules/admin/maintainers/clients/domain/model/client';
import { toggleColumn }                                                                                                                                    from '@shared/utils/column.util';
import { TableBuilderComponent }                                                                                                                           from '@shared/components/table-builder/table-builder.component';
import { Order }                                                                                                                                           from '@modules/admin/administration/orders/domain/model/order';

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
        FormsModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        TranslocoPipe,
        MatMenuModule,
        MatSlideToggle,
        TableBuilderComponent
    ],
    templateUrl: './list.component.html'
})
export class ListComponent implements OnDestroy {
    readonly #dialog = inject(MatDialog);
    readonly #ts = inject(TranslocoService);
    readonly #clientService = inject(ClientService);
    readonly #overlay = inject(Overlay);
    readonly #vcr = inject(ViewContainerRef);
    readonly #invoicesService = inject(InvoicesService);
    readonly #router = inject(Router);
    readonly #notyf = inject(NotyfService);
    #overlayRef: OverlayRef;
    readonly today = DateTime.now().toISODate();
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
    showColumnsOverlay = signal(false);

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

    clientsResource = resource({
        loader: () => firstValueFrom(this.#clientService.findAll({}, 'COMPACT'))
    });

    invoicesResource = resource({
        request: () => this.filters(),
        loader: async () => firstValueFrom(this.#invoicesService.findAll(this.filters()))
    });

    columnsOverlay: Signal<TemplateRef<any>> = viewChild('columnsOverlay');
    columnsOverlayButton: Signal<MatButton> = viewChild('columnsOverlayButton');
    actionsCellTemplate: Signal<TemplateRef<any>> = viewChild('actionsCell');

    protected readonly trackByFn = trackByFn;
    protected readonly invoiceStatuses = Object.values(InvoiceStatusEnum);
    protected readonly InvoiceStatusEnum = InvoiceStatusEnum;
    protected readonly InvoiceStatusConfig = InvoiceStatusConfig;
    columns = computed(() => this.columnsConfig().filter(col => col.visible).map((column) => column.key));

    ngOnInit() {
        if (this.invoiceNumberQP()) this.invoiceNumberFormControl.setValue(this.invoiceNumberQP());

        // remove invoiceNumber from query params
        this.#router.navigate([], {queryParams: {invoiceNumber: null}, queryParamsHandling: 'merge'});
    }

    ngOnDestroy() {
        if (this.#overlayRef) this.#overlayRef.detach();
    }

    protected readonly DateTime = DateTime;

    toggleColumn = (columnKey: string) => toggleColumn(columnKey, this.columnsConfig, this.persistColumnsConfiguration);

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
    };

    reInvoice = (invoice: Invoice) => {
        const dialog = this.#dialog.open(ReInvoiceDialog, {data: {invoice, width: '500px'}});

        dialog.afterClosed().subscribe((result) => result && this.invoicesResource.reload());
    };

    openColumnsOverlay = () => {
        this.#overlayRef = openOverlay(
            this.#overlay,
            this.#vcr,
            this.columnsOverlayButton()._elementRef.nativeElement,
            this.columnsOverlay()
        );
    };

    isLessThan6Months = (emissionDate: any) => DateTime.fromISO(emissionDate).diffNow('months').months < 6;

    getPayments = (invoice: Invoice) => {
        const totalPayments = invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
        const percentagePaid = Math.round((totalPayments / invoice.totalAmount) * 100 * 100) / 100;

        return {totalPayments, percentagePaid};
    };

    view(invoice: Invoice) {
        this.#dialog.open(InvoiceDetailComponent, {
            data : {invoiceId: invoice.id},
            width: '900px'
        });
    }

    buildColumnsConfig = (): ColumnConfig[] => ([
        {
            key    : 'invoiceNumber',
            header : this.#ts.translate('operations.invoices.fields.invoice-number'),
            visible: true,
            display: {
                type   : 'text',
                classes: 'text-sm text-blue-500 cursor-pointer hover:underline',
                onClick: (row) => this.view(row)
            },
            filter : {
                type   : 'number',
                control: this.invoiceNumberFormControl,
            }
        },
        {
            key    : 'order',
            header : this.#ts.translate('operations.invoices.fields.order-number'),
            visible: true,
            display: {
                type     : 'text',
                classes  : 'text-sm text-blue-500 cursor-pointer hover:underline',
                formatter: (order: Order) => order.orderNumber,
                onClick  : (row) => this.viewOrderDetail(row)
            },
            filter : {
                type   : 'text',
                control: this.orderNumberFormControl,
            }
        },
        {
            key    : 'client',
            header : this.#ts.translate('operations.invoices.fields.client'),
            visible: true,
            display: {
                type     : 'text',
                classes  : 'text-sm',
                formatter: (client: Client) => client.fantasyName
            },
            filter : {
                type    : 'select',
                control : this.clientFormControl,
                options : this.clientsResource.value()?.map((client) => ({value: client, viewValue: client.fantasyName})),
                multiple: true
            }
        },
        {
            key    : 'status',
            header : this.#ts.translate('operations.invoices.fields.status'),
            visible: true,
            display: {
                type            : 'badge',
                containerClasses: 'block min-w-36',
                classes         : 'text-sm',
                formatter       : (status: InvoiceStatusEnum) => this.#ts.translate(`enums.invoice-status.${ status }`),
                pipeOptions     : {color: (status: InvoiceStatusEnum) => InvoiceStatusConfig[status].color},
                onClick         : (invoice: Invoice) => this.updateStatusInvoice(invoice)
            },
            filter : {
                type    : 'select',
                control : this.statusFormControl,
                options : this.invoiceStatuses.map((status) => ({value: status, viewValue: this.#ts.translate(`enums.invoice-status.${ status }`)})),
                multiple: true
            }
        },
        {
            key    : 'isPaid',
            header : this.#ts.translate('operations.invoices.fields.is-paid'),
            visible: true,
            display: {
                type       : 'badge',
                classes    : 'text-sm',
                formatter  : (isPaid: boolean) => isPaid ? 'Sí' : 'No',
                pipeOptions: {enum: InvoiceStatusEnum}
            },
            filter : {
                type    : 'select',
                control : this.isPaidFormControl,
                options : [
                    {value: null, viewValue: 'Todos'},
                    {value: true, viewValue: 'Pagado'},
                    {value: false, viewValue: 'No pagado'}
                ],
                multiple: false
            }
        },
        {
            key    : 'emissionDate',
            header : this.#ts.translate('operations.invoices.fields.emission-date'),
            visible: true,
            display: {
                type       : 'date',
                classes    : 'text-sm',
                pipeOptions: {format: 'dd-MM-yyyy'},
            },
            filter : {
                type : 'date-range',
                group: this.emissionDateFormControl,
            }
        },
        {
            key    : 'dueDate',
            header : this.#ts.translate('operations.invoices.fields.due-date'),
            visible: true,
            display: {
                type       : 'date',
                classes    : 'text-sm',
                pipeOptions: {format: 'dd-MM-yyyy'},
            },
            filter : {
                type : 'date-range',
                group: this.dueDateFormControl,
            }
        },
        {
            key    : 'netAmount',
            header : this.#ts.translate('operations.invoices.fields.net-amount'),
            visible: true,
            display: {
                type       : 'currency',
                classes    : 'text-sm',
                pipeOptions: {currency: 'CLP'}
            },
            filter : {
                type : 'number-range',
                group: this.netAmountFormControl
            }
        },
        {
            key    : 'taxAmount',
            header : this.#ts.translate('operations.invoices.fields.tax-amount'),
            visible: true,
            display: {
                type       : 'currency',
                classes    : 'text-sm',
                pipeOptions: {currency: 'CLP'}
            },
            filter : {
                type : 'number-range',
                group: this.taxAmountFormControl
            }
        },
        {
            key    : 'totalAmount',
            header : this.#ts.translate('operations.invoices.fields.total-amount'),
            visible: true,
            display: {
                type       : 'currency',
                classes    : 'text-sm',
                pipeOptions: {currency: 'CLP'}
            },
            filter : {
                type : 'number-range',
                group: this.totalAmountFormControl
            }
        },
        {
            key    : 'actions',
            header : '',
            visible: true,
            display: {
                type          : 'custom',
                customTemplate: this.actionsCellTemplate()
            }
        }
    ]);

    columnsConfig: WritableSignal<ColumnConfig[]> = linkedSignal(() => {
        const persistedInvoicesColumn: string[] = localStorage.getItem('invoiceListColumnsConfig') && JSON.parse(localStorage.getItem('ordersListColumnsConfig'));

        const columns: ColumnConfig[] = this.buildColumnsConfig();

        // Check if there persisted columns are valid to the actual columns, if there is inconsistency, remove the persisted columns
        if (persistedInvoicesColumn) {
            const columnKeys = columns.map((column) => column.key);
            for (const column of persistedInvoicesColumn) {
                if (!columnKeys.includes(column)) {
                    localStorage.removeItem('invoiceListColumnsConfig');
                    break;
                }
            }
        }

        return persistedInvoicesColumn ? columns.map((column) => {
            const foundColumn = persistedInvoicesColumn.find((col) => col === column.key);
            return foundColumn ? column : {...column, visible: false};
        }) : columns;
    });
}

