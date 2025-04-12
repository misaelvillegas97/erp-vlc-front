import { inject, Injectable }        from '@angular/core';
import { Observable, of }            from 'rxjs';
import { SupplierInvoice }           from './domain/models/supplier-invoice';
import { BankTransaction, Transfer } from './domain/models/transaction';
import { HttpClient }                from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AccountingService {
    readonly #http = inject(HttpClient);

    // Para el Dashboard
    getFinancialSummary(): Observable<any> {
        return of({
            payables   : 5000,
            receivables: 8000,
            cashFlow   : [ 1000, 1500, 1200, 1800 ]
        });
    }

    // Cuentas por Pagar
    getPayables(): Observable<SupplierInvoice[]> {
        return this.#http.get<SupplierInvoice[]>('/api/supplier-invoices');
    }

    getPayableById(id: number): Observable<SupplierInvoice> {
        return this.#http.get<SupplierInvoice>(`/api/supplier-invoices/${ id }`);
    }

    createPayable(invoice: SupplierInvoice): Observable<SupplierInvoice> {
        return this.#http.post<SupplierInvoice>('/api/supplier-invoices', invoice);
    }

    // Cuentas por Cobrar
    getReceivables(): Observable<SupplierInvoice[]> {
        return this.#http.get<SupplierInvoice[]>('/api/receivables');
    }

    getReceivableById(id: number): Observable<SupplierInvoice> {
        return this.#http.get<SupplierInvoice>(`/api/receivables/${ id }`);
    }

    createReceivable(invoice: SupplierInvoice): Observable<SupplierInvoice> {
        return this.#http.post<SupplierInvoice>('/api/receivables', invoice);
    }

    // Transacciones Bancarias
    getBankTransactions(): Observable<BankTransaction[]> {
        const dummy: BankTransaction[] = [
            {id: 1, date: new Date(), description: 'Deposit', amount: 3000, type: 'credit'},
            {id: 2, date: new Date(), description: 'Withdrawal', amount: 1500, type: 'debit'}
        ];
        return of(dummy);
    }

    // Transferencias
    getTransfers(): Observable<Transfer[]> {
        const dummy: Transfer[] = [
            {id: 1, date: new Date(), fromAccount: 'Account A', toAccount: 'Account B', amount: 500, status: 'completed'},
            {id: 2, date: new Date(), fromAccount: 'Account A', toAccount: 'Account C', amount: 800, status: 'scheduled'}
        ];
        return of(dummy);
    }

    createTransfer(transfer: Transfer): Observable<Transfer> {
        return of({...transfer, id: Math.floor(Math.random() * 1000)});
    }
}
