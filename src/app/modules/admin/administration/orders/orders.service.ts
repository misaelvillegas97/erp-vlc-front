import { Injectable }                  from '@angular/core';
import { HttpClient, HttpParams }      from '@angular/common/http';
import { TranslocoService }            from '@ngneat/transloco';
import { Notyf }                       from 'notyf';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order }                       from '@modules/admin/administration/orders/domain/model/order';

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

    public getAll(query?: any): void {
        console.log('query', query);

        const params = new HttpParams();

        if (query) params.set('query', query);

        this._httpClient.get<Order[]>('/api/orders', {params: query})
            .subscribe({
                next : (orders) => this._orders$.next(orders),
                error: () => this._notyf.error(this._translateService.translate('operations.orders.list.error'))
            });
    }
}
