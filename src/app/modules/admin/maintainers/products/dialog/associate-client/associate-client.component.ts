import { Component, computed, inject }                                                                       from '@angular/core';
import { MatButton }                                                                                         from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel }                                                                  from '@angular/material/form-field';
import { MatInput }                                                                                          from '@angular/material/input';
import { MatOption }                                                                                         from '@angular/material/core';
import { MatSelect }                                                                                         from '@angular/material/select';
import { ReactiveFormsModule, UntypedFormBuilder, Validators }                                               from '@angular/forms';
import { TranslocoService }                                                                                  from '@ngneat/transloco';
import { ProductsService }                                                                                   from '@modules/admin/maintainers/products/products.service';
import { Notyf }                                                                                             from 'notyf';
import { Product }                                                                                           from '@modules/admin/maintainers/products/domain/model/product';
import { ClientService }                                                                                     from '@modules/admin/maintainers/clients/client.service';
import { firstValueFrom }                                                                                    from 'rxjs';
import { rxResource }                                                                                        from '@angular/core/rxjs-interop';

@Component({
    selector   : 'app-associate-client',
    imports: [
        MatButton,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        MatError,
        MatFormField,
        MatInput,
        MatLabel,
        MatOption,
        MatSelect,
        ReactiveFormsModule
    ],
    templateUrl: './associate-client.component.html'
})
export class AssociateClientComponent {
    readonly fb = inject(UntypedFormBuilder);
    readonly dialogRef = inject(MatDialogRef);
    readonly translateService = inject(TranslocoService);
    readonly productsService = inject(ProductsService);
    readonly clientService = inject(ClientService);
    readonly data = inject(MAT_DIALOG_DATA);
    readonly product = this.data.product as Product;
    form = this.fb.group({
        clientId    : [ undefined, [ Validators.required ] ],
        providerCode: [ undefined, [ Validators.required ] ],
    });
    readonly clientsResource = rxResource({
        loader: () => {
            return this.clientService.findAll();
        },
    });

    readonly clients = computed(() => {
        const existingAssociations = this.product.providerCodes?.map(({client}) => client.id);

        return this.clientsResource.value().filter((client) => !existingAssociations.includes(client.id));
    });

    readonly #notyf = new Notyf();

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();
        const data: { clientId: string, providerCode: number } = this.form.getRawValue();

        firstValueFrom(this.productsService.associateClient({
            ...data,
            productId: this.product.id
        }))
            .then(() => {
                this.#notyf.success(this.translateService.translate('maintainers.products.associateClient.success'));
                this.dialogRef.close(true);
            })
            .catch(() => {
                this.#notyf.error(this.translateService.translate('maintainers.products.associateClient.error'));
            })
            .finally(() => {
                this.form.enable();
            });
    }
}
