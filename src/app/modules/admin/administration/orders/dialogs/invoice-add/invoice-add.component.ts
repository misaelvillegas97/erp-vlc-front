import { Component, computed, inject, model, ModelSignal, resource } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef }            from '@angular/material/dialog';
import { MatButton }                                                 from '@angular/material/button';
import { MatFormFieldModule }                                        from '@angular/material/form-field';
import { MatInput }                                                  from '@angular/material/input';
import { MatSelectModule }                                           from '@angular/material/select';
import { MatDatepickerModule }                                       from '@angular/material/datepicker';
import { CurrencyPipe }                                              from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder, Validators }       from '@angular/forms';
import { Order }                                                     from '@modules/admin/administration/orders/domain/model/order';
import { TranslocoPipe }                                             from '@ngneat/transloco';
import { InvoiceStatusEnum }                                         from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { OrdersService }                                             from '@modules/admin/administration/orders/orders.service';
import { firstValueFrom, map }                                       from 'rxjs';
import { Notyf }                                                     from 'notyf';
import { UserService }                                               from '@core/user/user.service';
import { MatProgressSpinner }                                        from '@angular/material/progress-spinner';
import { MatAutocomplete, MatAutocompleteTrigger }                   from '@angular/material/autocomplete';
import { displayWithFn }                                             from '@core/utils';
import { User }                                                      from '@core/user/user.types';
import { OrderStatusConfig, OrderStatusEnum }                        from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { MatCheckbox }                                               from '@angular/material/checkbox';
import { BadgeComponent }                                            from '@shared/components/badge/badge.component';
import { DateTime }                                                  from 'luxon';
import { toSignal }                                                  from '@angular/core/rxjs-interop';

@Component({
    selector   : 'app-add-invoice',
    imports: [
        MatDialogModule,
        MatButton,
        MatFormFieldModule,
        MatSelectModule,
        MatInput,
        MatDatepickerModule,
        CurrencyPipe,
        ReactiveFormsModule,
        TranslocoPipe,
        MatProgressSpinner,
        MatAutocomplete,
        MatAutocompleteTrigger,
        MatCheckbox,
        BadgeComponent
    ],
    templateUrl: './invoice-add.component.html'
})
export class InvoiceAddComponent {
    readonly #fb = inject(UntypedFormBuilder);
    readonly #dialogRef = inject(MatDialogRef);
    readonly #dialogData = inject(MAT_DIALOG_DATA);
    readonly #service = inject(OrdersService);
    readonly #userService = inject(UserService);
    private readonly _notyf = new Notyf();
    readonly order: ModelSignal<Order> = model(this.#dialogData.order);
    readonly isDeliveredOrCanceled = computed(() => this.order().status === OrderStatusEnum.DELIVERED || this.order().status === OrderStatusEnum.CANCELED);
    readonly statuses = [
        {value: InvoiceStatusEnum.ISSUED, label: 'Emitida'},
        {value: InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS, label: 'Recibida sin observaciones'},
        {value: InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS, label: 'Recibida con observaciones'}
    ];

    form = this.#fb.group({
        invoiceNumber: [ undefined, [ Validators.required ] ],
        status       : [ InvoiceStatusEnum.ISSUED, [ Validators.required ] ],
        emissionDate : [ {value: undefined, disabled: true}, [ Validators.required ] ],
        dueDate      : [ {value: undefined, disabled: true}, [ Validators.required ] ],
        deliveryAssignment   : [ undefined, [ Validators.required ] ],
        markAsPendingDelivery: [ {value: !this.isDeliveredOrCanceled(), disabled: this.isDeliveredOrCanceled()} ]
    });

    readonly emissionMinDate = DateTime.now().minus({weeks: 1});
    readonly emissionMaxDate = DateTime.now().plus({days: 1});
    readonly emissionDateInput = toSignal(this.form.get('emissionDate').valueChanges, {initialValue: this.emissionMinDate});
    readonly dueMinDate = computed(() => this.emissionDateInput().plus({days: 1}));
    protected readonly displayWithFn = displayWithFn<User>('name');

    async submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const data: any = this.form.getRawValue();

        const parsed = {
            invoiceNumber        : parseInt(data.invoiceNumber, 10),
            status               : data.status,
            emissionDate         : data.emissionDate.toISODate(),
            dueDate              : data.dueDate.toISODate(),
            deliveryAssignmentId : data.deliveryAssignment.id,
            markAsPendingDelivery: data.markAsPendingDelivery
        };

        this.form.disable();

        firstValueFrom(this.#service.addInvoice(this.order().id, parsed))
            .then(() => this.#dialogRef.close(true))
            .catch(() => {
                this.form.enable();
                this._notyf.error('Error al agregar la factura');
            });
    }

    private extractData = (data: any) => data.data;

    readonly usersResource = resource({
        loader: () => firstValueFrom(this.#userService.findAll().pipe(map(this.extractData)))
    });
    protected readonly OrderStatusEnum = OrderStatusEnum;
    protected readonly OrderStatusConfig = OrderStatusConfig;
}
