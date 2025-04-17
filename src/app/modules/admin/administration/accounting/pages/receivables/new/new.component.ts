import { Component, inject, linkedSignal, resource }               from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInput }                                                from '@angular/material/input';
import { MatSelectChange, MatSelectModule }                        from '@angular/material/select';
import { MatDatepickerModule }                                     from '@angular/material/datepicker';
import { AccountingService }                                       from '@modules/admin/administration/accounting/accounting.service';
import { Router }                                                  from '@angular/router';
import { DateTime }                                                from 'luxon';
import { firstValueFrom, of }                                      from 'rxjs';
import { PageDetailHeaderComponent }                               from '@shared/components/page-detail-header/page-detail-header.component';
import { TranslocoDirective, TranslocoService }                    from '@ngneat/transloco';
import { LoaderButtonComponent }                                   from '@shared/components/loader-button/loader-button.component';
import { toSignal }                                                from '@angular/core/rxjs-interop';
import BigNumber                                                   from 'bignumber.js';
import { MatDialog }                                               from '@angular/material/dialog';
import { MatCheckbox }                                             from '@angular/material/checkbox';
import { NotyfService }                                            from '@shared/services/notyf.service';
import { CustomerInvoiceMapper, CustomerInvoiceStatusEnum }        from '@modules/admin/administration/accounting/domain/models/customer-invoice';

// import { CustomersService } from '@modules/admin/maintainers/customers/customers.service';

@Component({
    selector  : 'app-new-receivable',
    standalone: true,
    imports   : [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,
        MatSelectModule,
        MatDatepickerModule,
        PageDetailHeaderComponent,
        TranslocoDirective,
        LoaderButtonComponent,
        MatCheckbox,
    ],
    templateUrl: './new.component.html'
})
export class NewComponent {
    protected readonly CustomerInvoiceStatusEnums = Object.values(CustomerInvoiceStatusEnum);
    readonly #fb = inject(FormBuilder);
    readonly #ts = inject(TranslocoService);
    readonly #service = inject(AccountingService);
    // readonly #customerService = inject(CustomersService);
    readonly #notyfService = inject(NotyfService);
    readonly #dialog = inject(MatDialog);
    readonly #router = inject(Router);

    form: FormGroup = this.#fb.group({
        customerId   : [ null, [ Validators.required ] ],
        invoiceNumber: [ '', [ Validators.required ] ],
        status       : [ CustomerInvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        issueDate    : [ DateTime.now().toISODate(), [ Validators.required ] ],
        dueDate      : [ '', [ Validators.required ] ],
        isExempt     : [ false ],
        netAmount    : [ 0, [ Validators.required, Validators.min(0) ] ],
        taxAmount    : [ 0, [ Validators.required, Validators.min(0) ] ],
        grossAmount  : [ 0, [ Validators.required, Validators.min(0) ] ],
        description  : [ '' ],
        observations : [ '' ]
    });

    netAmountInput = toSignal(this.form.get('netAmount').valueChanges);
    isExemptInput = toSignal(this.form.get('isExempt').valueChanges);
    amountCalc = linkedSignal(() => {
        const netAmount = this.netAmountInput() || 0;
        const taxAmount = this.isExemptInput() ? 0 : new BigNumber(netAmount).multipliedBy(0.19).toFixed(0);
        const grossAmount = new BigNumber(netAmount).plus(taxAmount).toFixed(0);

        this.form.get('taxAmount').setValue(taxAmount);
        this.form.get('grossAmount').setValue(grossAmount);

        return {
            netAmount,
            taxAmount,
            grossAmount
        };
    });

    customersResource = resource({
        loader: () => firstValueFrom(of([])),
    });

    onSubmit = async () => {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();

        const form = CustomerInvoiceMapper.toCreateDto(this.form.getRawValue());

        firstValueFrom(this.#service.createReceivable(form))
            .then(() => this.#notyfService.success('Factura a cliente agregada correctamente'))
            .then(() => this.#router.navigate([ '/operations/accounting/receivables/list' ]))
            .catch((error) => {
                this.form.enable();
                console.error(error);
            });
    };

    onCustomerChange = ($event: MatSelectChange) => {
        const customer = this.customersResource.value().find(c => c.id === $event.value);

        if (customer?.paymentTermDays) {
            const dueDate = DateTime.now().plus({days: customer.paymentTermDays});
            this.form.get('dueDate').setValue(dueDate.toISODate());
        }
    };
}
