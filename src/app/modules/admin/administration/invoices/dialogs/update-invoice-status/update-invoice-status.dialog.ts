import { Component, inject, model, ModelSignal }             from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { TranslocoPipe }                                     from '@ngneat/transloco';
import { FormBuilder, FormControl, Validators }              from '@angular/forms';
import { InvoiceStatusEnum }                                 from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';

@Component({
    selector   : 'app-update-invoice-status',
    imports    : [
        MatDialogTitle,
        TranslocoPipe,
        MatDialogContent
    ],
    templateUrl: './update-invoice-status.dialog.html'
})
export class UpdateInvoiceStatusDialog {
    readonly #injectedData = inject(MAT_DIALOG_DATA);
    readonly #fb = inject(FormBuilder);
    readonly invoice: ModelSignal<any> = model(this.#injectedData.invoice);

    form = this.#fb.group({
        status      : new FormControl<InvoiceStatusEnum>(undefined, [ Validators.required ]),
        observations: new FormControl<string>(undefined, [ Validators.minLength(5) ]),
        paymentDate : new FormControl<string>(undefined)
    });
}
