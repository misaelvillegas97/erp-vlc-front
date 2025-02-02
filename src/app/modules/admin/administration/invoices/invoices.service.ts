import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { TranslocoService }   from '@ngneat/transloco';
import { Notyf }              from 'notyf';

@Injectable({providedIn: 'root'})
export class InvoicesService {
    readonly #httpClient = inject(HttpClient);
    readonly #translateService = inject(TranslocoService);
    readonly #notyf = new Notyf();

    findAll(query?: any) {
        return this.#httpClient.get<any[]>('/api/invoices', {params: query});
    }
}
