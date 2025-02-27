import { Component, computed, inject, resource, signal }                                       from '@angular/core';
import { CurrencyPipe, DatePipe }                                                              from '@angular/common';
import { MatButton }                                                                           from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { Order }                                                                               from '@modules/admin/administration/orders/domain/model/order';
import { MatTableModule }                                                                      from '@angular/material/table';
import { TranslocoPipe }                                                                       from '@ngneat/transloco';
import { OrdersService }                                                                       from '@modules/admin/administration/orders/orders.service';
import { firstValueFrom }                                                                      from 'rxjs';
import { MatProgressSpinner }                                                                  from '@angular/material/progress-spinner';

@Component({
    selector   : 'app-order-detail',
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatTableModule,
        CurrencyPipe,
        DatePipe,
        MatButton,
        TranslocoPipe,
        MatDialogClose,
        MatProgressSpinner,
    ],
    templateUrl: './order-detail.dialog.html'
})
export class OrderDetailDialog {
    readonly #service = inject(OrdersService);
    readonly data = signal(inject(MAT_DIALOG_DATA));
    readonly orderResource = resource<Order, any>({
        request: () => this.data() || '',
        loader : async ({request}) => {
            if (!request.id) return;

            return firstValueFrom(this.#service.findById(request.id));
        }
    });

    readonly productsTotal = computed(() => this.orderResource.value().products.reduce((acc, product) => acc + product.quantity * product.unitaryPrice, 0));
}
