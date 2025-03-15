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

    findOne(invoiceId: string) {
        return this.#httpClient.get<any>('/api/invoices/' + invoiceId);
    }

    getInvoicesOverview() {
        return this.#httpClient.get('/api/invoices/overview');
    }

    reInvoice(invoiceId: string, data: any) {
        return this.#httpClient.post('/api/invoices/' + invoiceId + '/re-invoice', data);
    }

    updateStatus(invoiceId: string, params: { status: InvoiceStatusEnum; observations?: string; paymentDate?: string, isPaid: boolean }) {
        return this.#httpClient.put('/api/invoices/' + invoiceId + '/status', params);
    }
}
