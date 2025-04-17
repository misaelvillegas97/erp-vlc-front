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
import { Transfer }                                                from '@modules/admin/administration/accounting/domain/models/transaction';
import { AccountingService }                                       from '@modules/admin/administration/accounting/accounting.service';
import { NotyfService }                                            from '@shared/services/notyf.service';
import { firstValueFrom }                                          from 'rxjs';
import { DateTime }                                                from 'luxon';
import { PageDetailHeaderComponent }                               from '@shared/components/page-detail-header/page-detail-header.component';
import { TranslocoDirective }                                      from '@ngneat/transloco';
import { LoaderButtonComponent }                                   from '@shared/components/loader-button/loader-button.component';

@Component({
    selector  : 'app-transfers',
    standalone: true,
    imports   : [
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
    templateUrl: './transfers.component.html'
})
export class TransfersComponent {
    readonly #fb = inject(FormBuilder);
    readonly #service = inject(AccountingService);
    readonly #notyfService = inject(NotyfService);

    displayedColumns: string[] = [ 'date', 'fromAccount', 'toAccount', 'amount', 'status', 'actions' ];
    transfers: Transfer[] = [];

    transferForm: FormGroup = this.#fb.group({
        date         : [ DateTime.now().toJSDate(), Validators.required ],
        fromAccountId: [ null, Validators.required ],
        toAccountId  : [ null, Validators.required ],
        amount       : [ null, [ Validators.required, Validators.min(1) ] ],
        status       : [ 'scheduled', Validators.required ]
    });

    isEditing = false;
    currentId: number | null = null;

    accountsResource = resource({
        loader: () => firstValueFrom(this.#service.getBankAccounts()),
    });

    transfersResource = resource({
        loader: () => firstValueFrom(this.#service.getTransfers()),
    });

    onSubmit(): void {
        if (this.transferForm.invalid) {
            this.transferForm.markAllAsTouched();
            return;
        }

        const formValue = this.transferForm.getRawValue();
        const accounts = this.accountsResource.value();

        if (!accounts) {
            this.#notyfService.error('No se pudieron cargar las cuentas bancarias');
            return;
        }

        // Obtener nombres completos de las cuentas
        const fromAccount = accounts.find(a => a.id === formValue.fromAccountId);
        const toAccount = accounts.find(a => a.id === formValue.toAccountId);

        if (!fromAccount || !toAccount) {
            this.#notyfService.error('Cuentas bancarias no encontradas');
            return;
        }

        const transfer: Transfer = {
            id         : this.currentId || Math.floor(Math.random() * 1000),
            date       : formValue.date,
            fromAccount: `${ fromAccount.bankName } - ${ fromAccount.accountNumber }`,
            toAccount  : `${ toAccount.bankName } - ${ toAccount.accountNumber }`,
            amount     : formValue.amount,
            status     : formValue.status
        };

        const operation = this.isEditing
            ? this.#service.updateTransfer(transfer)
            : this.#service.createTransfer(transfer);

        firstValueFrom(operation)
            .then(() => {
                this.#notyfService.success(
                    this.isEditing
                        ? 'Transferencia actualizada correctamente'
                        : 'Transferencia registrada correctamente'
                );
                this.resetForm();
                this.transfersResource.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                this.#notyfService.error('Ocurrió un error al procesar la transferencia');
            });
    }

    editTransfer(transfer: Transfer): void {
        // Aquí tendríamos que traducir los nombres de cuentas a IDs
        // En una implementación real, esto vendría del backend
        const accounts = this.accountsResource.value();

        const fromAccountParts = transfer.fromAccount.split(' - ');
        const toAccountParts = transfer.toAccount.split(' - ');

        // Encontrar los IDs basados en el número de cuenta
        const fromAccount = accounts.find(a => a.accountNumber === fromAccountParts[1]);
        const toAccount = accounts.find(a => a.accountNumber === toAccountParts[1]);

        this.transferForm.patchValue({
            date         : new Date(transfer.date),
            fromAccountId: fromAccount?.id || null,
            toAccountId  : toAccount?.id || null,
            amount       : transfer.amount,
            status       : transfer.status
        });

        this.isEditing = true;
        this.currentId = transfer.id;
    }

    deleteTransfer(id: number): void {
        if (confirm('¿Está seguro de eliminar esta transferencia?')) {
            firstValueFrom(this.#service.deleteTransfer(id))
                .then(() => {
                    this.#notyfService.success('Transferencia eliminada correctamente');
                    this.transfersResource.reload();
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.#notyfService.error('Ocurrió un error al eliminar la transferencia');
                });
        }
    }

    resetForm(): void {
        this.isEditing = false;
        this.currentId = null;
        this.transferForm.reset({
            date         : DateTime.now().toJSDate(),
            fromAccountId: null,
            toAccountId  : null,
            amount       : null,
            status       : 'scheduled'
        });
    }
}
