import { Component, inject }                                                                                 from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators }                                           from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule, MatLabel }                                                                      from '@angular/material/form-field';
import { MatInput }                                                                                          from '@angular/material/input';
import { MatOption }                                                                                         from '@angular/material/core';
import { MatSelect }                                                                                         from '@angular/material/select';
import { MatButton }                                                                                         from '@angular/material/button';
import { TranslocoPipe, TranslocoService }                                                                   from '@ngneat/transloco';
import { NotyfService }                                                                                      from '@shared/services/notyf.service';
import { MatDatepickerModule }                                                                               from '@angular/material/datepicker';
import { DriverLicenseType }                                                                                 from '../../models/driver-license.model';
import { User }                                                                                              from '@core/user/user.types';
import { UserService }                                                                                       from '@core/user/user.service';
import { firstValueFrom }                                                                                    from 'rxjs';

@Component({
    selector   : 'app-driver-license-dialog',
    standalone : true,
    imports    : [
        MatButton,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        MatFormFieldModule,
        MatInput,
        MatLabel,
        MatOption,
        MatSelect,
        ReactiveFormsModule,
        MatDatepickerModule,
        TranslocoPipe
    ],
    templateUrl: './driver-license.component.html'
})
export class DriverLicenseDialogComponent {
    readonly #fb = inject(FormBuilder);
    readonly #dialogRef = inject(MatDialogRef);
    readonly #translateService = inject(TranslocoService);
    readonly #userService = inject(UserService);
    readonly #notyfService = inject(NotyfService);
    readonly data = inject(MAT_DIALOG_DATA);
    readonly user = this.data.user as User;

    // Make enum available to the template
    readonly licenseTypes = Object.values(DriverLicenseType);

    form: FormGroup = this.#fb.group({
        licenseType     : [ null, [ Validators.required ] ],
        licenseValidFrom: [ {value: undefined, disabled: true}, [ Validators.required ] ],
        licenseValidTo  : [ {value: undefined, disabled: true}, [ Validators.required ] ],
        restrictions    : [ '' ],
        issuingAuthority: [ '' ]
    });

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();
        const driverLicenseData = this.form.getRawValue();

        firstValueFrom(this.#userService.assignDriverLicense(this.user.id, driverLicenseData))
            .then(() => {
                this.#notyfService.success(this.#translateService.translate('maintainers.users.driver-license.success'));
                this.#dialogRef.close(true);
            })
            .catch(() => {
                this.#notyfService.error(this.#translateService.translate('maintainers.users.driver-license.error'));
            })
            .finally(() => {
                this.form.enable();
            });
    }
}
