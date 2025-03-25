import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Notyf }              from 'notyf';
import { TranslocoService }   from '@ngneat/transloco';
import { retry }              from 'rxjs';
import { Supplier }           from '@modules/admin/maintainers/suppliers/domain/model/supplier';

@Injectable({providedIn: 'root'})
export class SuppliersService {
    readonly #http = inject(HttpClient);
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();

    findAll(query?: any, layout: 'FULL' | 'COMPACT' = 'FULL') {
        return this.#http.get<{ total: number, suppliers: Supplier[] }>('api/suppliers', {params: {...query, layout}}).pipe(
            retry({count: 3, delay: 1000, resetOnSuccess: true}),
        );
    }

    post(supplier: any) {
        return this.#http.post<Supplier>('api/suppliers', supplier).pipe(
            retry({count: 3, delay: 1000, resetOnSuccess: true}),
        );
    }

    delete(id: string) {
        return this.#http.delete<void>(`api/suppliers/${ id }`).pipe(
            retry({count: 3, delay: 1000, resetOnSuccess: true}),
        );
    }

}
