import { Component, computed, inject, model, ModelSignal }                                     from '@angular/core';
import { CurrencyPipe, DatePipe }                                                              from '@angular/common';
import { MatButton }                                                                           from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { Order }                                                                               from '@modules/admin/administration/orders/domain/model/order';
import { MatTableModule }                                                                      from '@angular/material/table';
import { TranslocoPipe }                                                                       from '@ngneat/transloco';

@Component({
    selector   : 'app-order-detail',
    imports    : [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatTableModule,
        CurrencyPipe,
        DatePipe,
        MatButton,
        TranslocoPipe,
        MatDialogClose,
    ],
    templateUrl: './order-detail.dialog.html'
})
export class OrderDetailDialog {
    readonly data = inject(MAT_DIALOG_DATA);
    readonly order: ModelSignal<Order> = model(this.data.order);
    readonly productsTotal = computed(() => this.order().products.reduce((acc, product) => acc + product.quantity * product.unitaryPrice, 0));
}
