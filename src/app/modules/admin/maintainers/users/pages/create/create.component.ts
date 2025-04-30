import { Component, inject, OnInit }                                                                                                            from '@angular/core';
import { CommonModule }                                                                                                                         from '@angular/common';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule }                                                                                                                   from '@angular/material/form-field';
import { MatInputModule }                                                                                                                       from '@angular/material/input';
import { MatButtonModule }                                                                                                                      from '@angular/material/button';
import { MatSelectModule }                                                                                                                      from '@angular/material/select';
import { MatCheckboxModule }                                                                                                                    from '@angular/material/checkbox';
import { MatDatepickerModule }                                                                                                                  from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                                                                  from '@angular/material/core';
import { MatIconModule }                                                                                                                        from '@angular/material/icon';
import { Router, RouterModule }                                                                                                                 from '@angular/router';
import { PageDetailHeaderComponent }                                                                                                            from '@shared/components/page-detail-header/page-detail-header.component';
import { firstValueFrom, Observable, of }                                                                                                       from 'rxjs';

import { UserService }             from '@core/user/user.service';
import { RoleEnum, roleNames }     from '@core/user/role.type';
import { StatusEnum, statusNames } from '@core/user/status.type';
import { DriverLicenseType }       from '@modules/admin/maintainers/users/models/driver-license.model';

@Component({
    selector   : 'app-create',
    standalone: true,
    imports   : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        RouterModule,
        PageDetailHeaderComponent
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent implements OnInit {
    readonly #fb = inject(FormBuilder);
    readonly #userService = inject(UserService);
    readonly #router = inject(Router);
    licenseTypes = Object.values(DriverLicenseType);
    isDriver = false;
    userForm: FormGroup = this.#fb.group({
        email                : [ null, [ Validators.required, Validators.email ] ],
        password             : [ null, [ Validators.required, Validators.minLength(6) ] ],
        firstName            : [ null, Validators.required ],
        lastName             : [ null, Validators.required ],
        role                 : [ null, Validators.required ],
        status               : [ {id: StatusEnum.active}, Validators.required ],
        documentId           : [ null ],
        phoneNumber          : [ null ],
        address              : [ null ],
        emergencyContactName : [ null ],
        emergencyContactPhone: [ null ],
        notes                : [ null ],
        driverLicense        : this.#fb.array([], {asyncValidators: [ this.driverLicenseValidator() ]})
    });

    roles = Object.values(RoleEnum).filter(value => typeof value === 'number');
    statuses = Object.values(StatusEnum).filter(value => typeof value === 'number');

    ngOnInit(): void {
        // Watch for role changes to handle driver-specific fields
        this.userForm.get('role')?.valueChanges.subscribe(role => {
            if (role && (role === RoleEnum.driver || role.id === RoleEnum.driver)) {
                this.isDriver = true;
                this.userForm.get('documentId')?.setValidators([ Validators.required ]);

                // Add a driver license if none exists
                if (this.driverLicenses.length === 0) {
                    this.addDriverLicense();
                }
            } else {
                this.isDriver = false;
                this.userForm.get('documentId')?.clearValidators();
                this.clearDriverLicenses();
            }

            // Update validity of documentId and driverLicense fields
            this.userForm.get('documentId')?.updateValueAndValidity();
            this.userForm.get('driverLicense')?.updateValueAndValidity();
        });
    }

    /**
     * Async validator that checks if driver license is required based on role
     */
    driverLicenseValidator(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            const role = this.userForm?.get('role')?.value;
            const driverLicenseArray = control.value as Array<any>;

            // If role is driver, validate that at least one driver license exists and is valid
            if (role && (role === RoleEnum.driver || role.id === RoleEnum.driver)) {
                if (!driverLicenseArray || driverLicenseArray.length === 0) return of({driverLicenseRequired: true});

                // Check if all required fields in each license are filled
                const hasInvalidLicense = driverLicenseArray.some(license =>
                    !license.licenseType ||
                    !license.licenseValidFrom ||
                    !license.licenseValidTo
                );

                if (hasInvalidLicense) return of({driverLicenseInvalid: true});
            }

            return of(null);
        };
    }

    get driverLicenses(): FormArray {
        return this.userForm.get('driverLicense') as FormArray;
    }

    addDriverLicense(): void {
        const licenseForm = this.#fb.group({
            licenseType     : [ null, Validators.required ],
            licenseValidFrom: [ null, Validators.required ],
            licenseValidTo  : [ null, Validators.required ],
            restrictions    : [ null ],
            issuingAuthority: [ null ]
        });
        this.driverLicenses.push(licenseForm);
    }

    removeDriverLicense(index: number): void {
        this.driverLicenses.removeAt(index);
    }

    clearDriverLicenses(): void {
        while (this.driverLicenses.length > 0) {
            this.driverLicenses.removeAt(0);
        }
    }

    onSubmit(): void {
        if (this.userForm.invalid)
            this.markFormGroupTouched(this.userForm);

        const userData = this.userForm.value;

        // Format role and status as objects
        userData.role = {id: userData.role};

        // Set isDriver flag based on role
        userData.isDriver = userData.role.id === RoleEnum.driver;

        firstValueFrom(this.#userService.create(userData))
            .then(() => this.#router.navigate([ '/maintainers/users' ]))
            .catch((error) => console.error('Error creating user:', error));
    }

    markFormGroupTouched(formGroup: FormGroup): void {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            } else if (control instanceof FormArray) {
                control.markAsTouched();
                control.controls.forEach(arrayControl => {
                    if (arrayControl instanceof FormGroup) {
                        this.markFormGroupTouched(arrayControl);
                    } else {
                        arrayControl.markAsTouched();
                    }
                });
            }
        });
    }

    protected readonly roleNames = roleNames;
    protected readonly statusNames = statusNames;
}
