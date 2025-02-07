import { Injectable }                                   from '@angular/core';
import { HttpClient }                                   from '@angular/common/http';
import { TranslocoService }                             from '@ngneat/transloco';
import { Notyf }                                        from 'notyf';
import { BehaviorSubject, catchError, Observable, tap } from 'rxjs';
import { Order }                                        from '@modules/admin/administration/orders/domain/model/order';
import { OrdersOverview }                               from '@modules/admin/administration/orders/domain/interfaces/orders-overview.interface';

@Injectable({providedIn: 'root'})
export class OrdersService {
    private _notyf = new Notyf();

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _translateService: TranslocoService
    ) {}

    private _orders$: BehaviorSubject<Order[]> = new BehaviorSubject<Order[]>(null);

    get orders$(): Observable<Order[]> {
        return this._orders$.asObservable();
    }

    public findAll(query?: any) {
        return this._httpClient.get<Order[]>('/api/orders', {params: query})
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
        return this._httpClient.post('/api/orders/' + orderId + '/invoice', invoice)
            .pipe(tap(() => this.findAll()));
    }
}
