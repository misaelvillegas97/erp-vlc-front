import { Component, inject }                                                     from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router }                                                                from '@angular/router';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                   from '@ngneat/transloco';
import { Notyf }                                                                 from 'notyf';
import { PageDetailHeaderComponent }                                             from '@shared/components/page-detail-header/page-detail-header.component';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatButton }                                                             from '@angular/material/button';
import { LoaderButtonComponent }                                                 from '@shared/components/loader-button/loader-button.component';
import { MatInput }                                                              from '@angular/material/input';
import { ExpenseTypesService }                                                   from '../../expense-types.service';

@Component({
    selector   : 'app-create',
    imports: [
        TranslocoDirective,
        PageDetailHeaderComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        TranslocoPipe,
        MatButton,
        LoaderButtonComponent,
        MatInput,
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    readonly #fb = inject(UntypedFormBuilder);
    readonly #router = inject(Router);
    readonly #service = inject(ExpenseTypesService);
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();

    // Se define el formulario con un solo campo: name
    form: UntypedFormGroup = this.#fb.group({
        name       : [ '', [ Validators.required ] ],
        description: [ '' ]
    });

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.#notyf.error({message: this.#ts.translate('errors.validation.message')});
            return;
        }
        this.form.disable();

        this.#service.create(this.form.getRawValue()).subscribe({
          next: () => {
              this.#notyf.success({message: this.#ts.translate('maintainers.expense-types.new.success')});
            this.#router.navigate(['/maintainers', 'expense-types']);
          },
          error: () => {
            this.#notyf.error({ message: this.#ts.translate('errors.service.message') });
            this.form.enable();
          }
        });
    }
}
