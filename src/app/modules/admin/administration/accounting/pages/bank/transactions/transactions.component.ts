import { Component, inject, resource }                             from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInput }                                                from '@angular/material/input';
import { MatSelectModule }                                         from '@angular/material/select';
import { MatDatepickerModule }                                     from '@angular/material/datepicker';
import { MatButtonModule }                                         from '@angular/material/button';
import { MatIconModule }                                           from '@angular/material/icon';
import { MatTableModule }                                          from '@angular/material/table';
import { MatCardModule }                                           from '@angular/material/card';
import { BankTransaction }                                         from '@modules/admin/administration/accounting/domain/models/transaction';
import { AccountingService }                                       from '@modules/admin/administration/accounting/accounting.service';
import { NotyfService }                                            from '@shared/services/notyf.service';
import { firstValueFrom }                                          from 'rxjs';
import { DateTime }                                                from 'luxon';
import { PageDetailHeaderComponent }                               from '@shared/components/page-detail-header/page-detail-header.component';
import { TranslocoDirective }                                      from '@ngneat/transloco';
import { LoaderButtonComponent }                                   from '@shared/components/loader-button/loader-button.component';
import { CommonModule }                                            from '@angular/common';

@Component({
    selector   : 'app-transactions',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatCardModule,
        PageDetailHeaderComponent,
        TranslocoDirective,
        LoaderButtonComponent
    ],
    templateUrl: './transactions.component.html'
})
export class TransactionsComponent {
    readonly #fb = inject(FormBuilder);
    readonly #service = inject(AccountingService);
    readonly #notyfService = inject(NotyfService);

    displayedColumns: string[] = [ 'date', 'description', 'amount', 'type', 'actions' ];
    transactions: BankTransaction[] = [];

    transactionForm: FormGroup = this.#fb.group({
        date       : [ DateTime.now().toJSDate(), Validators.required ],
        description: [ '', Validators.required ],
        amount     : [ null, [ Validators.required, Validators.min(1) ] ],
        type       : [ 'credit', Validators.required ],
        accountId  : [ null, Validators.required ]
    });

    accountsResource = resource({
        loader: () => firstValueFrom(this.#service.getBankAccounts()),
    });

    transactionsResource = resource({
        loader: () => firstValueFrom(this.#service.getBankTransactions()),
    });

    onSubmit(): void {
        if (this.transactionForm.invalid) {
            this.transactionForm.markAllAsTouched();
            return;
        }

        const formValue = this.transactionForm.getRawValue();

        const transaction: BankTransaction = {
            id         : Math.floor(Math.random() * 1000),
            date       : formValue.date,
            description: formValue.description,
            amount     : +formValue.amount,
            type       : formValue.type
        };

        firstValueFrom(this.#service.createBankTransaction(transaction))
            .then(() => {
                this.#notyfService.success('Transacción registrada correctamente');
                this.resetForm();
                this.transactionsResource.reload();

                // Actualizar el saldo de la cuenta (en un sistema real, esto lo haría el backend)
                const accounts = this.accountsResource.value();
                const account = accounts.find(a => a.id === formValue.accountId);

                if (account) {
                    account.balance = formValue.type === 'credit'
                        ? account.balance + +formValue.amount
                        : account.balance - +formValue.amount;

                    firstValueFrom(this.#service.updateBankAccount(account))
                        .then(() => {
                            this.accountsResource.reload();
                        });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.#notyfService.error('Ocurrió un error al procesar la transacción');
            });
    }

    deleteTransaction(id: number): void {
        if (confirm('¿Está seguro de eliminar esta transacción?')) {
            // En un sistema real, necesitaríamos eliminar la transacción y actualizar el saldo de la cuenta
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.#notyfService.success('Transacción eliminada correctamente');
        }
    }

    resetForm(): void {
        this.transactionForm.reset({
            date       : DateTime.now().toJSDate(),
            description: '',
            amount     : null,
            type       : 'credit',
            accountId  : null
        });
    }
}
