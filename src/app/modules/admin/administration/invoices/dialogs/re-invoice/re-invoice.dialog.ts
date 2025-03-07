import { Component, computed, inject, model, resource }                                                      from '@angular/core';
import { CurrencyPipe }                                                                                      from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators }                                  from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption }                                                from '@angular/material/autocomplete';
import { MatButton }                                                                                         from '@angular/material/button';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle }                                            from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel, MatSuffix }                                                       from '@angular/material/form-field';
import { MatInput }                                                                                          from '@angular/material/input';
import { MatProgressSpinner }                                                                                from '@angular/material/progress-spinner';
import { MatSelect }                                                                                         from '@angular/material/select';
import { TranslocoPipe }                                                                                     from '@ngneat/transloco';
import { UserService }                                                                                       from '@core/user/user.service';
import { Notyf }                                                                                             from 'notyf';
import { InvoiceStatusEnum }                                                                                 from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { DateTime }                                                                                          from 'luxon';
import { toSignal }                                                                                          from '@angular/core/rxjs-interop';
import { User }                                                                                              from '@core/user/user.types';
import { firstValueFrom, map }                                                                               from 'rxjs';
import { OrderStatusConfig, OrderStatusEnum }                                                                from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { displayWithFn }                                                                                     from '@core/utils';
import { Invoice }                                                                                           from '@modules/admin/administration/invoices/domains/model/invoice';
import { InvoicesService }                                                                                   from '@modules/admin/administration/invoices/invoices.service';

@Component({
    selector   : 'app-re-invoice',
    imports    : [
        CurrencyPipe,
        FormsModule,
        MatAutocomplete,
        MatAutocompleteTrigger,
        MatButton,
        MatDatepicker,
        MatDatepickerInput,
        MatDatepickerToggle,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        MatError,
        MatFormField,
        MatInput,
        MatLabel,
        MatOption,
        MatProgressSpinner,
        MatSelect,
        MatSuffix,
        ReactiveFormsModule,
        TranslocoPipe
    ],
    templateUrl: './re-invoice.dialog.html'
})
export class ReInvoiceDialog {
    readonly #fb = inject(UntypedFormBuilder);
    readonly #dialogRef = inject(MatDialogRef);
    readonly #dialogData = inject(MAT_DIALOG_DATA);
    readonly #service = inject(InvoicesService);
    readonly #userService = inject(UserService);
    private readonly _notyf = new Notyf();
    readonly invoice = model<Invoice>(this.#dialogData.invoice);
    readonly statuses = [
        {value: InvoiceStatusEnum.ISSUED, label: 'Emitida'},
        {value: InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS, label: 'Recibida sin observaciones'},
        {value: InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS, label: 'Recibida con observaciones'}
    ];

    form = this.#fb.group({
        invoiceNumber     : [ undefined, [ Validators.required ] ],
        status            : [ InvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        emissionDate      : [ {value: undefined, disabled: true}, [ Validators.required ] ],
        dueDate           : [ {value: undefined, disabled: true}, [ Validators.required ] ],
        deliveryAssignment: [ undefined ],
    });

    readonly emissionMinDate = DateTime.now().minus({weeks: 1});
    readonly emissionMaxDate = DateTime.now().plus({days: 1});
    readonly emissionDateInput = toSignal(this.form.get('emissionDate').valueChanges, {initialValue: this.emissionMinDate});
    readonly dueMinDate = computed(() => this.emissionDateInput().plus({days: 1}));
    protected readonly displayWithFn = displayWithFn<User>('name');
    protected readonly OrderStatusEnum = OrderStatusEnum;
    protected readonly OrderStatusConfig = OrderStatusConfig;

    async submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const data: any = this.form.getRawValue();

        const parsed = {
            invoiceNumber       : parseInt(data.invoiceNumber, 10),
            status              : data.status,
            emissionDate        : data.emissionDate.toISODate(),
            dueDate             : data.dueDate?.toISODate(),
            deliveryAssignmentId: data.deliveryAssignment?.id
        };

        this.form.disable();

        firstValueFrom(this.#service.reInvoice(this.invoice().id, parsed))
            .then(() => {
                this._notyf.success('Factura agregada correctamente');
                this.#dialogRef.close(true);
            })
            .catch(() => {
                this.form.enable();
                this._notyf.error('Error al agregar la factura');
            });
    }

    private extractData = (data: any) => data.data;

    readonly usersResource = resource({
        loader: () => firstValueFrom(this.#userService.findAll().pipe(map(this.extractData)))
    });
}
