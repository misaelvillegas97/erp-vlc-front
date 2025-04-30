import { Component, inject, linkedSignal, resource }               from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInput }                                                from '@angular/material/input';
import { MatSelectChange, MatSelectModule }                        from '@angular/material/select';
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
import { Supplier }                                                from '@modules/admin/maintainers/suppliers/domain/model/supplier';
import { MatCheckbox }                                             from '@angular/material/checkbox';
import { SupplierInvoiceMapper }                                   from '@modules/admin/administration/accounting/domain/models/supplier-invoice';
import { NotyfService }                                            from '@shared/services/notyf.service';

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
        MatCheckbox,
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
    readonly #notyfService = inject(NotyfService);
    readonly #dialog = inject(MatDialog);

    form: FormGroup = this.#fb.group({
        supplierId   : [ null, [ Validators.required ] ],
        expenseTypeId: [ null, [ Validators.required ] ],
        invoiceNumber: [ '', [ Validators.required ] ],
        status       : [ SupplierInvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        issueDate  : [ DateTime.now().toISODate(), [ Validators.required ] ],
        dueDate      : [ '', [ Validators.required ] ],
        isExempt   : [ false ],
        netAmount    : [ 0, [ Validators.required, Validators.min(0) ] ],
        taxAmount  : [ 0, [ Validators.required, Validators.min(0) ] ],
        grossAmount: [ 0, [ Validators.required, Validators.min(0) ] ],
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

    suppliersResource = resource({
        loader: () => firstValueFrom(this.#supplierService.findAll()).then((res) => res.suppliers),
    });
    expenseTypesResource = resource({
        loader: () => firstValueFrom(this.#expenseTypesService.findAll()),
    });
    readonly #router = inject(Router);

    onSubmit = async () => {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();

        const form = SupplierInvoiceMapper.toCreateDto(this.form.getRawValue());

        firstValueFrom(this.#service.createPayable(form))
            .then(() => this.#notyfService.success('Factura agregada correctamente'))
            .then(() => this.#router.navigate([ '/operations/accounting/payables/list' ]))
            .catch((error) => {
                this.form.enable();
                console.error(error);
            });
    };

    openNewExpenseTypeDialog = () => {
        const dialogRef = this.#dialog.open(CreateDialog, {
            width: '600px',
            data : {title: this.#ts.translate('maintainers.expense-types.new.title')}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.expenseTypesResource.reload();
                this.form.get('expenseType').setValue(result.id);
            }
        });
    };

    onSupplierChange = ($event: MatSelectChange) => {
        const supplier = this.suppliersResource.value().find((s: Supplier) => s.id === $event.value);

        if (supplier?.paymentTermDays) {
            const dueDate = DateTime.now().plus({days: supplier.paymentTermDays});
            this.form.get('dueDate').setValue(dueDate.toISODate());
        }
    };
}
