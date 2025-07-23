import { Component, computed, inject, resource, signal }                                                     from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass }                                                                   from '@angular/common';
import { FormsModule, ReactiveFormsModule }                                                                  from '@angular/forms';
import { MatButton }                                                                                         from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatTableModule }                                                                                    from '@angular/material/table';
import { MatProgressSpinnerModule }                                                                          from '@angular/material/progress-spinner';
import { MatIconModule }                                                                                     from '@angular/material/icon';
import { TranslocoPipe }                                                                                     from '@ngneat/transloco';
import { trackByFn }                                                                                         from '@libs/ui/utils/utils';
import { Invoice }                                                                                           from '@modules/admin/administration/invoices/domains/model/invoice';
import { InvoicesService }                                                                                   from '@modules/admin/administration/invoices/invoices.service';
import { firstValueFrom }                                                                                    from 'rxjs';

@Component({
    selector   : 'app-invoice-detail',
    imports: [
        CurrencyPipe,
        FormsModule,
        MatButton,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        ReactiveFormsModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatIconModule,
        DatePipe,
        NgClass,
        TranslocoPipe
    ],
    templateUrl: './invoice-detail.component.html',
    styleUrls: [ './invoice-detail.component.scss' ]
})
export class InvoiceDetailComponent {
    readonly #dialogRef = inject(MatDialogRef);
    readonly #service = inject(InvoicesService);
    readonly data = inject(MAT_DIALOG_DATA);
    readonly invoiceId = signal(this.data.invoiceId);

    readonly invoiceResource = resource<Invoice, unknown>({
        loader : () => firstValueFrom(this.#service.findOne(this.invoiceId())),
    });

    readonly productsTotal = computed(() =>
        this.invoiceResource.value()
            .order
            .products
            .reduce((acc, product) => acc + product.quantity * product.unitaryPrice, 0)
    );

    protected readonly trackByFn = trackByFn;
}
