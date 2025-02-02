import { Component, computed, inject, resource, signal }              from '@angular/core';
import { InvoicesService }                                            from '@modules/admin/administration/invoices/invoices.service';
import { InvoiceStatusEnum }                                          from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { TranslocoDirective, TranslocoPipe, TranslocoService }        from '@ngneat/transloco';
import { debounceTime, firstValueFrom, map }                          from 'rxjs';
import { PageHeaderComponent }                                        from '@layout/components/page-header/page-header.component';
import { MatIcon }                                                    from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                               from '@angular/material/button';
import { MatTooltip }                                                 from '@angular/material/tooltip';
import { RouterLink }                                                 from '@angular/router';
import { BreakpointObserver, Breakpoints }                            from '@angular/cdk/layout';
import { toSignal }                                                   from '@angular/core/rxjs-interop';
import { MatTableModule }                                             from '@angular/material/table';
import { MatSortModule }                                              from '@angular/material/sort';
import { trackByFn }                                                  from '@libs/ui/utils/utils';
import { MatInput }                                                   from '@angular/material/input';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule }   from '@angular/forms';
import { MatAutocompleteModule }                                      from '@angular/material/autocomplete';
import { ClientService }                                              from '@modules/admin/maintainers/clients/client.service';
import { MatSelect }                                                  from '@angular/material/select';
import { MatFormFieldModule }                                         from '@angular/material/form-field';
import { CurrencyPipe, DatePipe, JsonPipe }                           from '@angular/common';
import { MatDatepickerToggle, MatDateRangeInput, MatDateRangePicker } from '@angular/material/datepicker';

@Component({
    selector   : 'app-list',
    imports    : [
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
        MatDateRangeInput,
        TranslocoPipe,
        DatePipe,
        MatDatepickerToggle,
        MatDateRangePicker,
        CurrencyPipe,
        JsonPipe
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #translationService = inject(TranslocoService);
    readonly #clientService = inject(ClientService);
    readonly #invoicesService = inject(InvoicesService);
    readonly breakpointObserver = inject(BreakpointObserver);
    readonly isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));

    isMobile = toSignal(this.isMobile$, {initialValue: false});

    displayedColumns = [ 'invoiceNumber', 'client', 'status', 'emissionDate', 'dueDate', 'netAmount' ];
    displayedColumnsFilters = [ 'invoiceNumberFilter', 'clientFilter', 'statusFilter', 'emissionDateFilter', 'dueDateFilter', 'netAmountFilter' ];

    // formControls
    invoiceNumberFormControl = new FormControl();
    clientFormControl = new FormControl();
    statusFormControl = new FormControl();
    emissionDateFormControl = new FormGroup({
        start: new FormControl<Date | null>(new Date()),
        end  : new FormControl<Date | null>(new Date()),
    });
    dueDateFormControl = new FormGroup({
        start: new FormControl<Date | null>(null),
        end  : new FormControl<Date | null>(null),
    });
    netAmountFormControl = new FormControl();
    taxAmountFormControl = new FormControl();
    totalAmountFormControl = new FormControl();
    deliveryAssignmentFormControl = new FormControl();

    // signals from formControls
    invoiceNumberFilter = toSignal(this.invoiceNumberFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    clientFilter = toSignal(this.clientFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    statusFilter = toSignal(this.statusFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: []});
    emissionDateFilter = toSignal(this.emissionDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {start: null, end: null}});
    dueDateFilter = toSignal(this.dueDateFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: {start: null, end: null}});
    netAmountFilter = toSignal(this.netAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    taxAmountFilter = toSignal(this.taxAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    totalAmountFilter = toSignal(this.totalAmountFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    deliveryAssignmentFilter = toSignal(this.deliveryAssignmentFormControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});

    showMobileFilters = signal<boolean>(false);

    filters = computed(() => {
        const filter = {};

        if (this.invoiceNumberFilter()) filter['invoiceNumber'] = this.invoiceNumberFilter();
        if (this.statusFilter()) filter['status'] = this.statusFilter();
        if (this.emissionDateFilter()) filter['emissionDate'] = this.emissionDateFilter();
        if (this.dueDateFilter()) filter['dueDate'] = this.dueDateFilter();
        if (this.netAmountFilter()) filter['netAmount'] = this.netAmountFilter();
        if (this.taxAmountFilter()) filter['taxAmount'] = this.taxAmountFilter();
        if (this.totalAmountFilter()) filter['totalAmount'] = this.totalAmountFilter();
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
            return firstValueFrom(this.#invoicesService.findAll(this.filters()));
        }
    });

    protected readonly trackByFn = trackByFn;
    protected readonly invoiceStatuses = Object.values(InvoiceStatusEnum);
    protected readonly InvoiceStatusEnum = InvoiceStatusEnum;
}
