import { Component, computed, inject, model, ModelSignal }                                                   from '@angular/core';
import { CurrencyPipe, DatePipe }                                                                            from '@angular/common';
import { FormsModule, ReactiveFormsModule }                                                                  from '@angular/forms';
import { MatButton }                                                                                         from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Order }                                                                                             from '@modules/admin/administration/orders/domain/model/order';
import { MatTableModule }                                                                                    from '@angular/material/table';
import { TranslocoPipe }                                                                                     from '@ngneat/transloco';
import { trackByFn }                                                                                         from '@libs/ui/utils/utils';
import { Invoice }                                                                                           from '@modules/admin/administration/invoices/domains/model/invoice';

@Component({
    selector   : 'app-invoice-detail',
    imports: [
        CurrencyPipe,
        FormsModule,
        MatButton,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        ReactiveFormsModule,
        MatTableModule,
        DatePipe,
        TranslocoPipe
    ],
    templateUrl: './invoice-detail.component.html'
})
export class InvoiceDetailComponent {
    readonly dialogRef = inject(MatDialogRef);
    readonly data = inject(MAT_DIALOG_DATA);
    readonly order: ModelSignal<Order> = model(this.data.order);
    readonly invoice: ModelSignal<Invoice> = model(this.data.invoice);
    readonly productsTotal = computed(() => this.order().products.reduce((acc, product) => acc + product.quantity * product.unitaryPrice, 0));
    protected readonly trackByFn = trackByFn;
}
