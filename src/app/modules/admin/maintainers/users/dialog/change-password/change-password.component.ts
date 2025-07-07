import { Component, inject, Inject, signal }                       from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef }          from '@angular/material/dialog';
import { MatFormFieldModule }                                      from '@angular/material/form-field';
import { MatInputModule }                                          from '@angular/material/input';
import { MatButtonModule }                                         from '@angular/material/button';
import { MatIconModule }                                           from '@angular/material/icon';
import { TranslocoModule }                                         from '@ngneat/transloco';
import { UserService }                                             from '@core/user/user.service';
import { User }                                                    from '@core/user/user.types';
import { LoaderButtonComponent }                                   from '@shared/components/loader-button/loader-button.component';
import { NgIf }                                                    from '@angular/common';

@Component({
    selector  : 'app-change-password',
    standalone: true,
    imports   : [
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        TranslocoModule,
        LoaderButtonComponent,
        NgIf
    ],
    template  : `
        <h2 class="text-lg border-b pb-4" mat-dialog-title>{{ 'maintainers.users.change-password.title' | transloco }}</h2>

        <mat-dialog-content class="py-4">
            <!-- User info -->
            <div class="text-sm text-secondary mb-4 p-3 bg-hover rounded-md w-full">
                {{ 'maintainers.users.change-password.user-info' | transloco: {name: data.user.name, email: data.user.email} }}
            </div>

            <form (ngSubmit)="changePassword()" [formGroup]="changePasswordForm" class="space-y-2">
                <!-- New password field -->
                <mat-form-field class="w-full fuse-mat-dense">
                    <mat-label>{{ 'maintainers.users.change-password.new-password' | transloco }}</mat-label>
                    <input matInput
                           type="password"
                           formControlName="newPassword"
                           autocomplete="new-password"
                           [placeholder]="'maintainers.users.change-password.new-password-placeholder' | transloco">
                    <mat-icon matSuffix svgIcon="heroicons_outline:lock-closed"></mat-icon>
                    <mat-error *ngIf="changePasswordForm.get('newPassword').hasError('required')">
                        {{ 'validation.required' | transloco }}
                    </mat-error>
                    <mat-error *ngIf="changePasswordForm.get('newPassword').hasError('minlength')">
                        {{ 'validation.min-length' | transloco: {min: 6} }}
                    </mat-error>
                </mat-form-field>

                <!-- Confirm password field -->
                <mat-form-field class="w-full fuse-mat-dense">
                    <mat-label>{{ 'maintainers.users.change-password.confirm-password' | transloco }}</mat-label>
                    <input matInput
                           type="password"
                           formControlName="confirmPassword"
                           autocomplete="new-password"
                           [placeholder]="'maintainers.users.change-password.confirm-password-placeholder' | transloco">
                    <mat-icon matSuffix svgIcon="heroicons_outline:lock-closed"></mat-icon>
                    <mat-error *ngIf="changePasswordForm.get('confirmPassword').hasError('required')">
                        {{ 'validation.required' | transloco }}
                    </mat-error>
                    <mat-error *ngIf="changePasswordForm.get('confirmPassword').hasError('passwordMismatch')">
                        {{ 'validation.password-mismatch' | transloco }}
                    </mat-error>
                </mat-form-field>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions>
            <div class="flex-0 pt-4 w-full flex md:justify-end flex-col md:flex-row sm:items-center gap-4">
                <button color="secondary"
                        mat-flat-button
                        type="button"
                        [mat-dialog-close]="false">
                    <span>{{ 'actions.cancel' | transloco }}</span>
                </button>

                <loader-button [disabled]="changePasswordForm.disabled || changePasswordForm.invalid"
                               [loading]="isLoading()"
                               [label]="'maintainers.users.change-password.change-password' | transloco"
                               (click)="changePassword()"
                ></loader-button>
            </div>
        </mat-dialog-actions>
    `
})
export class ChangePasswordComponent {
    private readonly userService = inject(UserService);
    private readonly dialogRef = inject(MatDialogRef<ChangePasswordComponent>);

    isLoading = signal(false);

    changePasswordForm = new FormGroup({
        newPassword    : new FormControl('', [ Validators.required, Validators.minLength(6) ]),
        confirmPassword: new FormControl('', [ Validators.required ])
    }, {validators: this.passwordMatchValidator});

    constructor(@Inject(MAT_DIALOG_DATA) public data: { user: User }) {}

    passwordMatchValidator(form: FormGroup) {
        const newPassword = form.get('newPassword');
        const confirmPassword = form.get('confirmPassword');

        if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
            confirmPassword.setErrors({passwordMismatch: true});
            return {passwordMismatch: true};
        }

        return null;
    }

    changePassword(): void {
        if (this.changePasswordForm.valid) {
            this.isLoading.set(true);
            const newPassword = this.changePasswordForm.get('newPassword')?.value!;

            this.userService.changePassword(this.data.user.id, newPassword).subscribe({
                next : () => {
                    this.isLoading.set(false);
                    this.dialogRef.close(true);
                },
                error: () => {
                    this.isLoading.set(false);
                }
            });
        }
    }
}
