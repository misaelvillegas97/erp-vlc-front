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
import { InvoiceStatusEnum }                                   from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { OrdersService }                                       from '@modules/admin/administration/orders/orders.service';
import { firstValueFrom }                                      from 'rxjs';
import { Notyf }                                               from 'notyf';

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
    templateUrl: './invoice-add.component.html'
})
export class InvoiceAddComponent {
    readonly #fb = inject(UntypedFormBuilder);
    readonly #dialogRef = inject(MatDialogRef);
    readonly #dialogData = inject(MAT_DIALOG_DATA);
    readonly #service = inject(OrdersService);
    private readonly _notyf = new Notyf();
    readonly order: ModelSignal<Order> = model(this.#dialogData.order);
    readonly statuses = [
        {value: InvoiceStatusEnum.ISSUED, label: 'Emitida'},
        {value: InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS, label: 'Recibida sin observaciones'},
        {value: InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS, label: 'Recibida con observaciones'}
    ];
    form = this.#fb.group({
        invoiceNumber: [ this.order().invoice?.invoiceNumber, [ Validators.required ] ],
        status       : [ this.order().invoice?.status || InvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        emissionDate : [ {value: this.order().invoice?.emissionDate, disabled: true}, [ Validators.required ] ],
        dueDate: [ {value: this.order().invoice?.dueDate, disabled: true}, [ Validators.required ] ]
    });

    async submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const data: any = this.form.getRawValue();

        const parsed = {
            invoiceNumber: parseInt(data.invoiceNumber, 10),
            status       : data.status,
            emissionDate: data.emissionDate.toISODate(),
            dueDate     : data.dueDate.toISODate()
        };

        this.form.disable();

        firstValueFrom(this.#service.addInvoice(this.order().id, parsed))
            .then(() => this.#dialogRef.close(true))
            .catch(() => {
                this.form.enable();
                this._notyf.error('Error al agregar la factura');
            });
    }
}
