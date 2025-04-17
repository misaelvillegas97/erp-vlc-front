import { Component, inject, resource }                             from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInput }                                                from '@angular/material/input';
import { MatSelectModule }                                         from '@angular/material/select';
import { MatButtonModule }                                         from '@angular/material/button';
import { MatIconModule }                                           from '@angular/material/icon';
import { MatTableDataSource, MatTableModule }                      from '@angular/material/table';
import { MatCardModule }                                           from '@angular/material/card';
import { TranslocoDirective, TranslocoService }                    from '@ngneat/transloco';
import { PageDetailHeaderComponent }                               from '@shared/components/page-detail-header/page-detail-header.component';
import { AccountingService }                                       from '@modules/admin/administration/accounting/accounting.service';
import { BankAccount }                                             from '@modules/admin/administration/accounting/domain/models/bank-account';
import { firstValueFrom }                                          from 'rxjs';
import { NotyfService }                                            from '@shared/services/notyf.service';
import { LoaderButtonComponent }                                   from '@shared/components/loader-button/loader-button.component';

@Component({
    selector   : 'app-bank-accounts',
    standalone : true,
    imports    : [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatCardModule,
        TranslocoDirective,
        PageDetailHeaderComponent,
        LoaderButtonComponent
    ],
    templateUrl: './accounts.component.html'
})
export class BankAccountsComponent {
    readonly #fb = inject(FormBuilder);
    readonly #service = inject(AccountingService);
    readonly #ts = inject(TranslocoService);
    readonly #notyfService = inject(NotyfService);

    displayedColumns: string[] = [ 'bankName', 'accountNumber', 'accountType', 'balance', 'actions' ];
    dataSource = new MatTableDataSource<BankAccount>([]);

    accountForm: FormGroup = this.#fb.group({
        id           : [ null ],
        bankName     : [ '', Validators.required ],
        accountNumber: [ '', Validators.required ],
        accountType  : [ 'checking', Validators.required ],
        balance      : [ 0, [ Validators.required, Validators.min(0) ] ],
        description  : [ '' ]
    });

    accountTypes = [
        {value: 'checking', label: 'Cuenta Corriente'},
        {value: 'savings', label: 'Cuenta de Ahorro'},
        {value: 'investment', label: 'Cuenta de Inversión'}
    ];

    isEditing = false;

    accountsResource = resource({
        loader: () => firstValueFrom(this.#service.getBankAccounts()),
    });

    onSubmit(): void {
        if (this.accountForm.invalid) {
            this.accountForm.markAllAsTouched();
            return;
        }

        const account = this.accountForm.getRawValue();
        const operation = account.id
            ? this.#service.updateBankAccount(account)
            : this.#service.createBankAccount(account);

        firstValueFrom(operation)
            .then(() => {
                this.#notyfService.success(account.id
                    ? 'Cuenta bancaria actualizada correctamente'
                    : 'Cuenta bancaria creada correctamente');
                this.resetForm();
                this.accountsResource.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                this.#notyfService.error('Ocurrió un error al procesar la cuenta bancaria');
            });
    }

    editAccount(account: BankAccount): void {
        this.isEditing = true;
        this.accountForm.patchValue(account);
    }

    deleteAccount(id: number): void {
        if (confirm('¿Está seguro de eliminar esta cuenta bancaria?')) {
            firstValueFrom(this.#service.deleteBankAccount(id))
                .then(() => {
                    this.#notyfService.success('Cuenta bancaria eliminada correctamente');
                    this.accountsResource.reload();
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.#notyfService.error('Ocurrió un error al eliminar la cuenta bancaria');
                });
        }
    }

    resetForm(): void {
        this.isEditing = false;
        this.accountForm.reset({
            id           : null,
            bankName     : '',
            accountNumber: '',
            accountType  : 'checking',
            balance      : 0,
            description  : ''
        });
    }
}
