import { Component, inject }                                                     from '@angular/core';
import { PageDetailHeaderComponent }                                             from '@shared/components/page-detail-header/page-detail-header.component';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                   from '@ngneat/transloco';
import { MatInputModule }                                                        from '@angular/material/input';
import { MatButtonModule }                                                       from '@angular/material/button';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { INotyfNotificationOptions, Notyf }                                      from 'notyf';
import { ProductsService }                                                       from '@modules/admin/maintainers/products/products.service';
import { Router }                                                                from '@angular/router';
import { firstValueFrom }                                                        from 'rxjs';
import { CdkTextareaAutosize }                                                   from '@angular/cdk/text-field';

@Component({
    selector   : 'app-create',
    imports    : [
        PageDetailHeaderComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        TranslocoPipe,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinner,
        TranslocoDirective,
        CdkTextareaAutosize
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    form: UntypedFormGroup;

    readonly #translateService = inject(TranslocoService);
    readonly #service = inject(ProductsService);
    readonly #router = inject(Router);
    readonly #notyf = new Notyf();

    constructor(
        readonly _formBuilder: UntypedFormBuilder
    ) {
        this.form = this._formBuilder.group({
            name        : [ '', [ Validators.required ] ],
            description : [ '', [] ],
            upcCode     : [ '', [ Validators.required ] ],
            unitaryPrice: [ '', [ Validators.required ] ]
        });
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();

        firstValueFrom(this.#service.create(this.form.getRawValue()))
            .then((product) => {
                this.#notyf.success({message: this.#translateService.translate('maintainers.products.new.success'), ...this.notyfOptions()});
                this.#router.navigate([ 'maintainers', 'products' ]);
            })
            .catch((error) => {
                this.#notyf.error({message: this.#translateService.translate('errors.validation.message'), ...this.notyfOptions()});
                this.form.enable();
            });

    }

    notyfOptions = (): Partial<INotyfNotificationOptions> => ({
        duration   : 5000,
        ripple     : true,
        position   : {x: 'right', y: 'top'},
        dismissible: true
    });
}
