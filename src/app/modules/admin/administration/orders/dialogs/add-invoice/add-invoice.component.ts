import { Component, inject, model, ModelSignal }               from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef }      from '@angular/material/dialog';
import { MatButton }                                           from '@angular/material/button';
import { MatFormFieldModule }                                  from '@angular/material/form-field';
import { MatInput }                                            from '@angular/material/input';
import { MatSelectModule }                                     from '@angular/material/select';
import { MatDatepickerModule }                                 from '@angular/material/datepicker';
import { CurrencyPipe }                                        from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { Order }                                               from '@modules/admin/administration/orders/domain/model/order';
import { TranslocoPipe }                                       from '@ngneat/transloco';
import { InvoiceStatusEnum }                                   from '@modules/admin/administration/orders/domain/enums/invoice-status.enum';

@Component({
    selector   : 'app-add-invoice',
    imports    : [
        MatDialogModule,
        MatButton,
        MatFormFieldModule,
        MatSelectModule,
        MatInput,
        MatDatepickerModule,
        CurrencyPipe,
        ReactiveFormsModule,
        TranslocoPipe
    ],
    templateUrl: './add-invoice.component.html'
})
export class AddInvoiceComponent {
    readonly fb = inject(UntypedFormBuilder);
    readonly dialogRef = inject(MatDialogRef);
    readonly data = inject(MAT_DIALOG_DATA);
    readonly order: ModelSignal<Order> = model(this.data.order);
    readonly statuses = [
        {value: InvoiceStatusEnum.ISSUED, label: 'Emitida'},
        {value: InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS, label: 'Recibida sin observaciones'},
        {value: InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS, label: 'Recibida con observaciones'}
    ];

    form = this.fb.group({
        invoiceNumber: [ this.order().invoice?.invoiceNumber, [ Validators.required ] ],
        status       : [ this.order().invoice?.status || InvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        emissionDate : [ {value: this.order().invoice?.emissionDate, disabled: true}, [ Validators.required ] ],
    });

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.dialogRef.close(this.form.getRawValue());
    }
}
