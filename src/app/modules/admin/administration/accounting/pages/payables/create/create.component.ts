import { Component, computed, inject, resource }                   from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInput }                                                from '@angular/material/input';
import { MatSelectModule }                                         from '@angular/material/select';
import { MatDatepickerModule }                                     from '@angular/material/datepicker';
import { AccountingService }                                       from '@modules/admin/administration/accounting/accounting.service';
import { Router }                                                  from '@angular/router';
import { SupplierInvoiceStatusEnum }                               from '@modules/admin/maintainers/suppliers/domain/enums/invoice-status.enum';
import { DateTime }                                                from 'luxon';
import { SuppliersService }                                        from '@modules/admin/maintainers/suppliers/suppliers.service';
import { firstValueFrom }                                          from 'rxjs';
import { PageDetailHeaderComponent }                               from '@shared/components/page-detail-header/page-detail-header.component';
import { TranslocoDirective, TranslocoService }                    from '@ngneat/transloco';
import { LoaderButtonComponent }                                   from '@shared/components/loader-button/loader-button.component';
import { toSignal }                                                from '@angular/core/rxjs-interop';
import BigNumber                                                   from 'bignumber.js';
import { ExpenseTypesService }                                     from '@modules/admin/maintainers/expense-types/expense-types.service';
import { MatDialog }                                               from '@angular/material/dialog';
import { MatIcon }                                                 from '@angular/material/icon';
import { CreateDialog }                                            from '@modules/admin/maintainers/expense-types/dialog/create/create.dialog';

@Component({
    selector   : 'app-new',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,
        MatSelectModule,
        MatDatepickerModule,
        PageDetailHeaderComponent,
        TranslocoDirective,
        LoaderButtonComponent,
        MatIcon,
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    protected readonly SupplierInvoiceStatusEnums = Object.values(SupplierInvoiceStatusEnum);
    readonly #fb = inject(FormBuilder);
    readonly #ts = inject(TranslocoService);
    readonly #service = inject(AccountingService);
    readonly #supplierService = inject(SuppliersService);
    readonly #expenseTypesService = inject(ExpenseTypesService);
    readonly #dialog = inject(MatDialog);

    form: FormGroup = this.#fb.group({
        supplier     : [ null, [ Validators.required ] ],
        expenseType: [ null, [ Validators.required ] ],
        invoiceNumber: [ '', [ Validators.required ] ],
        status       : [ SupplierInvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        issueDate    : [ DateTime.now().toJSDate(), [ Validators.required ] ],
        dueDate      : [ '', [ Validators.required ] ],
        netAmount    : [ 0, [ Validators.required, Validators.min(0) ] ],
        description  : [ '' ],
        observations : [ '' ]
    });

    netAmountInput = toSignal(this.form.get('netAmount').valueChanges);
    taxAmount = computed(() => new BigNumber(this.netAmountInput() || 0).multipliedBy(0.19).toFixed(0));
    grossAmount = computed(() => new BigNumber(this.netAmountInput() || 0).plus(this.taxAmount()).toFixed(0));

    suppliersResource = resource({
        loader: () => firstValueFrom(this.#supplierService.findAll()).then((res) => res.suppliers),
    });
    expenseTypesResource = resource({
        loader: () => firstValueFrom(this.#expenseTypesService.findAll()),
    });
    readonly #router = inject(Router);

    onSubmit = () => {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
    };

    openNewExpenseTypeDialog = () => {
        const dialogRef = this.#dialog.open(CreateDialog, {
            width: '600px',
            data : {title: this.#ts.translate('maintainers.expense-types.new.title')}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.expenseTypesResource.reload();
                this.form.get('expenseType').setValue(result);
            }
        });
    };
}
