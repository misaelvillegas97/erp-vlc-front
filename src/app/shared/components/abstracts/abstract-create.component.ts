import { inject }                               from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router }                               from '@angular/router';

import { TranslocoService } from '@ngneat/transloco';
import { Notyf }            from 'notyf';
import { lastValueFrom }    from 'rxjs';

import { FuseConfirmationService } from '../../../../@fuse/services/confirmation';

export abstract class AbstractCreateComponent<T> {
    protected readonly router: Router = inject(Router);
    protected readonly formBuilder: UntypedFormBuilder = inject(UntypedFormBuilder);
    protected readonly translationService: TranslocoService = inject(TranslocoService);
    protected readonly confirmationService: FuseConfirmationService = inject(FuseConfirmationService);
    protected readonly notyf = new Notyf();
    protected readonly form: UntypedFormGroup;
    private readonly redirectOnSuccess: string;

    protected constructor(
        private readonly service: { create: (data: any) => any },
        private readonly redirectOnSuccessRoute: string,
    ) {
        this.form = this._initForm();
        this.redirectOnSuccess = redirectOnSuccessRoute;
    }

    abstract _initForm(): UntypedFormGroup;

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();
        lastValueFrom(this.service.create(this.form.getRawValue()))
            .then(() => {
                this.form.enable();
                this.form.reset();
                this.notyf.success(this.translationService.translate('notyf-modal.create.success'));
                this.router.navigate([ this.redirectOnSuccess ]);
            })
            .catch(() => {
                this.form.enable();
                this.notyf.error('Error creating');
            })
            .finally(() => this.form.enable());
    }
}
