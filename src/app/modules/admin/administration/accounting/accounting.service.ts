import { Injectable }                from '@angular/core';
import { Observable, of }            from 'rxjs';
import { SupplierInvoice }           from './domain/models/supplier-invoice';
import { BankTransaction, Transfer } from './domain/models/transaction';

@Injectable({
    providedIn: 'root'
})
export class AccountingService {
    // Simulación de llamadas a API con datos dummy

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
        const dummy: SupplierInvoice[] = [
            {id: 1, number: 'INV-001', date: new Date(), dueDate: new Date(), amount: 1000, status: 'pending', supplier: 'Supplier A'},
            {id: 2, number: 'INV-002', date: new Date(), dueDate: new Date(), amount: 2000, status: 'paid', supplier: 'Supplier B'}
        ];
        return of(dummy);
    }

    getPayableById(id: number): Observable<SupplierInvoice> {
        const dummy: SupplierInvoice = {id, number: 'INV-001', date: new Date(), dueDate: new Date(), amount: 1000, status: 'pending', supplier: 'Supplier A'};
        return of(dummy);
    }

    createPayable(invoice: SupplierInvoice): Observable<SupplierInvoice> {
        return of({...invoice, id: Math.floor(Math.random() * 1000)});
    }

    // Cuentas por Cobrar
    getReceivables(): Observable<SupplierInvoice[]> {
        const dummy: SupplierInvoice[] = [
            {id: 3, number: 'INV-101', date: new Date(), dueDate: new Date(), amount: 1500, status: 'pending', customer: 'Customer X'},
            {id: 4, number: 'INV-102', date: new Date(), dueDate: new Date(), amount: 2500, status: 'overdue', customer: 'Customer Y'}
        ];
        return of(dummy);
    }

    getReceivableById(id: number): Observable<SupplierInvoice> {
        const dummy: SupplierInvoice = {id, number: 'INV-101', date: new Date(), dueDate: new Date(), amount: 1500, status: 'pending', customer: 'Customer X'};
        return of(dummy);
    }

    createReceivable(invoice: SupplierInvoice): Observable<SupplierInvoice> {
        return of({...invoice, id: Math.floor(Math.random() * 1000)});
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
