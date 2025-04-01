import { Component, inject }                                                     from '@angular/core';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle }      from '@angular/material/dialog';
import { TranslocoPipe, TranslocoService }                                       from '@ngneat/transloco';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatInput }                                                              from '@angular/material/input';
import { LoaderButtonComponent }                                                 from '@shared/components/loader-button/loader-button.component';
import { MatButton }                                                             from '@angular/material/button';
import { ExpenseTypesService }                                                   from '@modules/admin/maintainers/expense-types/expense-types.service';
import { Notyf }                                                                 from 'notyf';

@Component({
    selector   : 'app-create',
    imports    : [
        MatDialogContent,
        MatDialogTitle,
        TranslocoPipe,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,
        MatDialogActions,
        LoaderButtonComponent,
        MatButton
    ],
    templateUrl: './create.dialog.html'
})
export class CreateDialog {
    readonly #fb = inject(UntypedFormBuilder);
    readonly #service = inject(ExpenseTypesService);
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();
    readonly #dialogRef = inject(MatDialogRef);

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
            next : (value) => {
                this.#notyf.success({message: this.#ts.translate('maintainers.expense-types.new.success')});
                this.#dialogRef.close(value);
            },
            error: () => {
                this.#notyf.error({message: this.#ts.translate('errors.service.message')});
                this.form.enable();
            }
        });
    }
}
