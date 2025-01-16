import { Injectable }             from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { TranslocoService }                                  from '@ngneat/transloco';
import { Notyf }                                             from 'notyf';
import { BehaviorSubject, mergeMap, Observable, retry, tap } from 'rxjs';
import { Client }                                            from '@modules/admin/maintainers/clients/domain/model/client';

@Injectable({providedIn: 'root'})
export class ClientService {
    private _notyf = new Notyf();

    constructor(
        private _httpClient: HttpClient,
        private _translateService: TranslocoService
    ) { }

    private _clients$: BehaviorSubject<Client[]> = new BehaviorSubject(null);

    get clients$(): Observable<Client[]> {
        return this._clients$.asObservable();
    }

    getAll(query?: string): Observable<Client[]> {
        const params = new HttpParams();

        if (query) params.set('query', query);

        return this._httpClient.get<Client[]>('api/clients', {params}).pipe(
            retry({count: 3, delay: 1000, resetOnSuccess: true}),
            tap(clients => this._clients$.next(clients))
        );
    }

    post(category: Client): Observable<Client[]> {
        return this._httpClient.post<Client>('api/clients', category).pipe(
            tap(() => this._notyf.success(this._translateService.translate('admin.news.category.create.success'))),
            tap(() => this._clients$.next(null)),
            mergeMap(() => this.getAll())
        );
    }

    delete(id: string): Observable<Client[]> {
        return this._httpClient.delete<void>(`api/clients/${ id }`).pipe(
            tap(() => this._notyf.success(this._translateService.translate('admin.news.category.delete.success'))),
            tap(() => this._clients$.next(null)),
            mergeMap(() => this.getAll())
        );
    }
}
