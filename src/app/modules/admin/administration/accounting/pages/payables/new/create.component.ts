import { Component, inject, resource }                             from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInput }                                                from '@angular/material/input';
import { MatSelectModule }                                         from '@angular/material/select';
import { MatDatepickerModule }                                     from '@angular/material/datepicker';
import { MatButton }                                               from '@angular/material/button';
import { AccountingService }                                       from '@modules/admin/administration/accounting/accounting.service';
import { Router }                                                  from '@angular/router';
import { SupplierInvoiceStatusEnum }                               from '@modules/admin/maintainers/suppliers/domain/enums/invoice-status.enum';
import { DateTime }                                                from 'luxon';
import { SuppliersService }                                        from '@modules/admin/maintainers/suppliers/suppliers.service';
import { firstValueFrom }                                          from 'rxjs';

@Component({
    selector   : 'app-new',
    imports    : [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,
        MatSelectModule,
        MatDatepickerModule,
        MatButton,
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    protected readonly SupplierInvoiceStatusEnums = Object.values(SupplierInvoiceStatusEnum);
    readonly #fb = inject(FormBuilder);
    form: FormGroup = this.#fb.group({
        supplier     : [ null, [ Validators.required ] ],
        invoiceNumber: [ '', [ Validators.required ] ],
        status       : [ SupplierInvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        issueDate    : [ DateTime.now().toJSDate(), [ Validators.required ] ],
        dueDate      : [ '', [ Validators.required ] ],
        netAmount    : [ 0, [ Validators.required, Validators.min(0) ] ],
        taxAmount    : [ {value: 0, disabled: true} ],
        grossAmount  : [ {value: 0, disabled: true} ],
        description  : [ '' ],
        observations : [ '' ]
    });
    readonly #service = inject(AccountingService);
    readonly #supplierService = inject(SuppliersService);
    suppliersResource = resource({
        loader: () => firstValueFrom(this.#supplierService.findAll()).then((res) => res.suppliers),
    });
    readonly #router = inject(Router);

    onSubmit = () => {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
    };
}
