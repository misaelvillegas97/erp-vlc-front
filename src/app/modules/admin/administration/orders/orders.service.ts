import { Injectable }       from '@angular/core';
import { HttpClient }       from '@angular/common/http';
import { TranslocoService } from '@ngneat/transloco';
import { Notyf }            from 'notyf';
import { catchError }       from 'rxjs';
import { Order }            from '@modules/admin/administration/orders/domain/model/order';
import { OrdersOverview }   from '@modules/admin/administration/orders/domain/interfaces/orders-overview.interface';
import { Pagination }       from '@shared/domain/model/pagination';

@Injectable({providedIn: 'root'})
export class OrdersService {
    private _notyf = new Notyf();

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _translateService: TranslocoService
    ) {}

    public findAll(query: any, {page, limit}: { page?: number; limit: number }) {
        return this._httpClient.get<Pagination<Order>>('/api/orders', {params: {...query, page, limit}})
            .pipe(
                catchError(() => {
                    this._notyf.error(this._translateService.translate('operations.orders.list.error'));
                    return [];
                })
            );
    }

    public getOrdersOverview() {
        return this._httpClient.get<OrdersOverview>('/api/orders/dashboard/overview');
    }

    public addInvoice(orderId: string, invoice: any) {
        return this._httpClient.post('/api/orders/' + orderId + '/invoice', invoice);
    }

    public findById(id: any) {
        return this._httpClient.get<Order>('/api/orders/' + id);
    }

    create(parsedData: { clientId: any; type: any; status: any; deliveryLocation: any; deliveryDate: any; products: any; observations: any }) {
        return this._httpClient.post('/api/orders', parsedData);
    }
}
