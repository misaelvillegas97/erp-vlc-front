import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { TranslocoService }   from '@ngneat/transloco';
import { Notyf }              from 'notyf';
import { InvoiceStatusEnum }  from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';

@Injectable({providedIn: 'root'})
export class InvoicesService {
    readonly #httpClient = inject(HttpClient);
    readonly #translateService = inject(TranslocoService);
    readonly #notyf = new Notyf();

    findAll(query?: any) {
        return this.#httpClient.get<any[]>('/api/invoices', {params: query});
    }

    getInvoicesOverview() {
        return this.#httpClient.get('/api/invoices/overview');
    }

    updateStatus(invoiceId: string, params: { status: InvoiceStatusEnum; observations?: string; paymentDate?: string }) {
        return this.#httpClient.put('/api/invoices/' + invoiceId + '/status', params);
    }
}
