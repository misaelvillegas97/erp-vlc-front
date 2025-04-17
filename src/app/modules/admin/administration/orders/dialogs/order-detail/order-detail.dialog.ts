import { Component, computed, inject, resource, signal }                                       from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass }                                                     from '@angular/common';
import { MatButton }                                                                           from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { Order }                                                                               from '@modules/admin/administration/orders/domain/model/order';
import { MatTableModule }                                                                      from '@angular/material/table';
import { MatProgressSpinnerModule }                                                            from '@angular/material/progress-spinner';
import { MatIconModule }                                                                       from '@angular/material/icon';
import { TranslocoPipe }                                                                       from '@ngneat/transloco';
import { OrdersService }                                                                       from '@modules/admin/administration/orders/orders.service';
import { firstValueFrom }                                                                      from 'rxjs';
import { Invoice }                                                                             from '@modules/admin/administration/invoices/domains/model/invoice';
import { trackByFn }                                                                           from '@libs/ui/utils/utils';

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
        MatProgressSpinnerModule,
        MatIconModule,
        NgClass
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

            const order = await firstValueFrom(this.#service.findById(request.id));

            return {
                ...order,
                observations: order.observations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            };
        }
    });

    readonly productsTotal = computed(() => this.orderResource.value().products.reduce((acc, product) => acc + product.quantity * product.unitaryPrice, 0));

    findActiveInvoice = (invoices: Invoice[]) => invoices.find((invoice) => invoice.isActive);

    protected readonly trackByFn = trackByFn;
}
