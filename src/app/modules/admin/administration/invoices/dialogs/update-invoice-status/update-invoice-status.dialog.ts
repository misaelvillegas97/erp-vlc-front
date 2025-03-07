import { Component, computed, effect, inject, model, ModelSignal }                                           from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { TranslocoPipe }                                                                                     from '@ngneat/transloco';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators }                                         from '@angular/forms';
import { InvoiceStatusEnum }                                                                                 from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { DateTime }                                                                                          from 'luxon';
import { MatFormFieldModule }                                                                                from '@angular/material/form-field';
import { MatSelectModule }                                                                                   from '@angular/material/select';
import { MatButton }                                                                                         from '@angular/material/button';
import { MatInput }                                                                                          from '@angular/material/input';
import { CdkTextareaAutosize }                                                                               from '@angular/cdk/text-field';
import { toSignal }                                                                                          from '@angular/core/rxjs-interop';
import { MatDatepickerModule }                                                                               from '@angular/material/datepicker';
import { Invoice }                                                                                           from '@modules/admin/administration/invoices/domains/model/invoice';
import { InvoicesService }                                                                                   from '@modules/admin/administration/invoices/invoices.service';
import { MatProgressSpinner }                                                                                from '@angular/material/progress-spinner';
import { firstValueFrom }                                                                                    from 'rxjs';
import { MatCheckbox }                                                                                       from '@angular/material/checkbox';

@Component({
    selector   : 'app-update-invoice-status',
    imports: [
        MatDialogTitle,
        TranslocoPipe,
        MatDialogContent,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatDialogActions,
        MatButton,
        MatDialogClose,
        MatInput,
        MatDatepickerModule,
        CdkTextareaAutosize,
        MatProgressSpinner,
        MatCheckbox
    ],
    templateUrl: './update-invoice-status.dialog.html'
})
export class UpdateInvoiceStatusDialog {
    readonly #dialogRef = inject(MatDialogRef);
    readonly #injectedData = inject(MAT_DIALOG_DATA);
    readonly #fb = inject(FormBuilder);
    readonly #invoicesService = inject(InvoicesService);
    readonly invoice: ModelSignal<Invoice> = model(this.#injectedData.invoice);

    readonly allowedStatuses = [ InvoiceStatusEnum.ISSUED, InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS, InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS, InvoiceStatusEnum.REJECTED ];
    readonly finalStatuses = [ InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS, InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS ];

    form = this.#fb.group({
        status: new FormControl<InvoiceStatusEnum>({value: this.invoice().status, disabled: this.finalStatuses.includes(this.invoice().status)}, [ Validators.required ]),
        observations: new FormControl<string>(undefined, [ Validators.minLength(5) ]),
        isPaid: new FormControl<boolean>(false),
        paymentDate: new FormControl<DateTime>(undefined)
    });

    statusInput = toSignal(this.form.get('status').valueChanges, {initialValue: this.invoice().status});
    isPaidInput = toSignal(this.form.get('isPaid').valueChanges, {initialValue: false});
    allowSetPaid = computed(() => [ InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS, InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS ].includes(this.statusInput()));

    statusEffect = effect(() => {
        const input = this.statusInput();
        const isPaid = this.isPaidInput();

        this.form.get('paymentDate').setValidators([]);
        this.form.get('paymentDate').reset(undefined);
        this.form.get('paymentDate').updateValueAndValidity();

        this.form.get('observations').setValidators([]);
        this.form.get('observations').updateValueAndValidity();

        if (input === InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS || input === InvoiceStatusEnum.REJECTED) {
            this.form.get('observations').setValidators([ Validators.required, Validators.minLength(5) ]);
            this.form.get('observations').updateValueAndValidity();
        }

        if (isPaid) {
            this.form.get('paymentDate').setValidators([ Validators.required ]);
            // @ts-ignore
            this.form.get('paymentDate').reset({value: DateTime.now(), disabled: true});
            this.form.get('paymentDate').updateValueAndValidity();
        }
    });
    protected readonly invoiceStatuses = Object.values(InvoiceStatusEnum);
    protected readonly InvoiceStatusEnum = InvoiceStatusEnum;

    submit = () => {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();

        firstValueFrom(this.#invoicesService.updateStatus(this.invoice().id, {
            status      : this.form.get('status').value,
            observations: this.form.get('observations').value,
            paymentDate: this.form.get('paymentDate').value?.toISODate(),
            isPaid     : this.form.get('isPaid').value
        }))
            .then(() => this.#dialogRef.close(true));
    };
}
