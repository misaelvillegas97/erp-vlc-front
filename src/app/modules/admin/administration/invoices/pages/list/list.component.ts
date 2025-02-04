import { Component, computed, inject, resource, signal }                                        from '@angular/core';
import { InvoicesService }                                                                      from '@modules/admin/administration/invoices/invoices.service';
import { InvoiceStatusEnum }                                                                    from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                  from '@ngneat/transloco';
import { debounceTime, firstValueFrom, map }                                                    from 'rxjs';
import { PageHeaderComponent }                                                                  from '@layout/components/page-header/page-header.component';
import { MatIcon }                                                                              from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                                                         from '@angular/material/button';
import { MatTooltip }                                                                           from '@angular/material/tooltip';
import { RouterLink }                                                                           from '@angular/router';
import { BreakpointObserver, Breakpoints }                                                      from '@angular/cdk/layout';
import { toSignal }                                                                             from '@angular/core/rxjs-interop';
import { MatTableModule }                                                                       from '@angular/material/table';
import { MatSortModule }                                                                        from '@angular/material/sort';
import { trackByFn }                                                                            from '@libs/ui/utils/utils';
import { MatInput }                                                                             from '@angular/material/input';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule }                             from '@angular/forms';
import { MatAutocompleteModule }                                                                from '@angular/material/autocomplete';
import { ClientService }                                                                        from '@modules/admin/maintainers/clients/client.service';
import { MatSelect }                                                                            from '@angular/material/select';
import { MatFormFieldModule }                                                                   from '@angular/material/form-field';
import { CurrencyPipe, DatePipe }                                                               from '@angular/common';
import { MatDatepickerToggle, MatDateRangeInput, MatDateRangePicker, MatEndDate, MatStartDate } from '@angular/material/datepicker';
import { DateTime }                                                                             from 'luxon';
import { MatMenuModule }                                                                        from '@angular/material/menu';
import { Invoice }                                                                              from '@modules/admin/administration/invoices/domains/model/invoice';
import { MatDialog }                                                                            from '@angular/material/dialog';
import { UpdateInvoiceStatusDialog }                                                            from '@modules/admin/administration/invoices/dialogs/update-invoice-status/update-invoice-status.dialog';

@Component({
    selector   : 'app-list',
    imports: [
        TranslocoDirective,
        PageHeaderComponent,
        MatIcon,
        MatIconAnchor,
        MatIconButton,
        MatTooltip,
        RouterLink,
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
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #dialog = inject(MatDialog);
    readonly #translationService = inject(TranslocoService);
    readonly #clientService = inject(ClientService);
    readonly #invoicesService = inject(InvoicesService);
    readonly breakpointObserver = inject(BreakpointObserver);
    readonly isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));

    isMobile = toSignal(this.isMobile$, {initialValue: false});

    displayedColumns = [ 'invoiceNumber', 'orderNumber', 'client', 'status', 'emissionDate', 'dueDate', 'netAmount', 'taxAmount', 'totalAmount', 'actions' ];
    displayedColumnsFilters = this.displayedColumns.map((column) => column + 'Filter');

    // formControls
    invoiceNumberFormControl = new FormControl();
    orderNumberFormControl = new FormControl();
    clientFormControl = new FormControl();
    statusFormControl = new FormControl();
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
    invoiceNumberFilter = toSignal(this.invoiceNumberFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    orderNumberFilter = toSignal(this.orderNumberFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    clientFilter = toSignal(this.clientFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    statusFilter = toSignal(this.statusFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    emissionDateFilter = toSignal(this.emissionDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    dueDateFilter = toSignal(this.dueDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    netAmountFilter = toSignal(this.netAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    taxAmountFilter = toSignal(this.taxAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    totalAmountFilter = toSignal(this.totalAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {from: undefined, to: undefined}});
    deliveryAssignmentFilter = toSignal(this.deliveryAssignmentFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});

    showMobileFilters = signal<boolean>(false);

    filters = computed(() => {
        const filter = {};

        if (this.invoiceNumberFilter()) filter['invoiceNumber'] = this.invoiceNumberFilter();
        if (this.orderNumberFilter()) filter['orderNumber'] = this.orderNumberFilter();
        if (this.clientFilter()) filter['clientId'] = this.clientFilter().map((client) => client.id);
        if (this.statusFilter()) filter['status'] = this.statusFilter();
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
        return this.statusFilter()?.map((status) => this.#translationService.translate(`operations.invoices.status.${ status }`));
    });

    clientsResource = resource({
        loader: () => firstValueFrom(this.#clientService.findAll({}, 'COMPACT'))
    });

    invoicesResource = resource({
        request: () => this.filters(),
        loader : async () => {
            console.log('this.filters()', this.filters());
            return firstValueFrom(this.#invoicesService.findAll(this.filters()));
        }
    });

    updateStatusInvoice = (invoice: Invoice) => {
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

    protected readonly trackByFn = trackByFn;
    protected readonly invoiceStatuses = Object.values(InvoiceStatusEnum);
    protected readonly InvoiceStatusEnum = InvoiceStatusEnum;
}

