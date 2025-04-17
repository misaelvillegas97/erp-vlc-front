import { inject, Injectable }        from '@angular/core';
import { Observable, of }            from 'rxjs';
import { SupplierInvoice }           from './domain/models/supplier-invoice';
import { BankTransaction, Transfer } from './domain/models/transaction';
import { HttpClient }                from '@angular/common/http';
import { BankAccount }               from './domain/models/bank-account';
import { CustomerInvoice }           from './domain/models/customer-invoice';

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
    getReceivables(): Observable<CustomerInvoice[]> {
        return this.#http.get<CustomerInvoice[]>('/api/customer-invoices');
    }

    getReceivableById(id: number): Observable<CustomerInvoice> {
        return this.#http.get<CustomerInvoice>(`/api/customer-invoices/${ id }`);
    }

    createReceivable(invoice: CustomerInvoice): Observable<CustomerInvoice> {
        return this.#http.post<CustomerInvoice>('/api/customer-invoices', invoice);
    }

    updateReceivable(invoice: CustomerInvoice): Observable<CustomerInvoice> {
        return this.#http.put<CustomerInvoice>(`/api/customer-invoices/${ invoice.id }`, invoice);
    }

    deleteReceivable(id: number): Observable<void> {
        return this.#http.delete<void>(`/api/customer-invoices/${ id }`);
    }

    // Cuentas Bancarias
    getBankAccounts(): Observable<BankAccount[]> {
        // Implementar cuando exista el API
        const mockAccounts: BankAccount[] = [
            {
                id           : 1,
                bankName     : 'Banco Santander',
                accountNumber: '00012345-67',
                accountType  : 'checking',
                balance      : 15000000,
                description  : 'Cuenta principal de operaciones'
            },
            {
                id           : 2,
                bankName     : 'Banco Estado',
                accountNumber: '12345678901',
                accountType  : 'savings',
                balance      : 7500000,
                description  : 'Fondo de reserva'
            }
        ];
        return of(mockAccounts);
    }

    getBankAccountById(id: number): Observable<BankAccount> {
        return of({
            id,
            bankName     : 'Banco Ejemplo',
            accountNumber: '00012345-67',
            accountType  : 'checking',
            balance      : 1000000,
            description  : 'Ejemplo de cuenta'
        });
    }

    createBankAccount(account: BankAccount): Observable<BankAccount> {
        account.id = Math.floor(Math.random() * 1000);
        return of(account);
    }

    updateBankAccount(account: BankAccount): Observable<BankAccount> {
        return of(account);
    }

    deleteBankAccount(id: number): Observable<void> {
        return of(undefined);
    }

    // Transacciones Bancarias
    getBankTransactions(): Observable<BankTransaction[]> {
        const transactions: BankTransaction[] = [
            {id: 1, date: new Date('2025-04-01'), description: 'Depósito Cliente ABC', amount: 1500000, type: 'credit'},
            {id: 2, date: new Date('2025-04-03'), description: 'Pago Proveedor XYZ', amount: 750000, type: 'debit'},
            {id: 3, date: new Date('2025-04-07'), description: 'Pago Servicios', amount: 250000, type: 'debit'},
            {id: 4, date: new Date('2025-04-10'), description: 'Depósito Cliente DEF', amount: 2000000, type: 'credit'},
            {id: 5, date: new Date('2025-04-15'), description: 'Cobro Cliente GHI', amount: 1200000, type: 'credit'}
        ];
        return of(transactions);
    }

    createBankTransaction(transaction: BankTransaction): Observable<BankTransaction> {
        transaction.id = Math.floor(Math.random() * 1000);
        return of(transaction);
    }

    // Transferencias
    getTransfers(): Observable<Transfer[]> {
        const transfers: Transfer[] = [
            {
                id         : 1,
                date       : new Date('2025-04-05'),
                fromAccount: 'Banco Santander - 00012345-67',
                toAccount  : 'Banco Estado - 12345678901',
                amount     : 500000,
                status     : 'completed'
            },
            {
                id         : 2,
                date       : new Date('2025-04-12'),
                fromAccount: 'Banco Estado - 12345678901',
                toAccount  : 'Banco Santander - 00012345-67',
                amount     : 750000,
                status     : 'completed'
            },
            {
                id         : 3,
                date       : new Date('2025-04-20'),
                fromAccount: 'Banco Santander - 00012345-67',
                toAccount  : 'Banco Internacional - 9876543210',
                amount     : 1000000,
                status     : 'scheduled'
            }
        ];
        return of(transfers);
    }

    createTransfer(transfer: Transfer): Observable<Transfer> {
        transfer.id = Math.floor(Math.random() * 1000);
        return of(transfer);
    }

    updateTransfer(transfer: Transfer): Observable<Transfer> {
        return of(transfer);
    }

    deleteTransfer(id: number): Observable<void> {
        return of(undefined);
    }
}
