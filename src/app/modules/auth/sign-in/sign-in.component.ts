import { NgIf }                                                                                       from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation }                                            from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule }                                                                            from '@angular/material/button';
import { MatCheckboxModule }                                                                          from '@angular/material/checkbox';
import { MatFormFieldModule }                                                                         from '@angular/material/form-field';
import { MatIconModule }                                                                              from '@angular/material/icon';
import { MatInputModule }                                                                             from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                   from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink }                                                         from '@angular/router';

import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';

import { AuthService }                       from '@core/auth/auth.service';
import { fuseAnimations }                    from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';


@Component({
    selector     : 'auth-sign-in',
    templateUrl  : './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [
        FormsModule,
        FuseAlertComponent,
        NgIf,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        RouterLink,
        TranslocoDirective,
        TranslocoPipe
    ],
})
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
    ) {
    }

    ngOnInit(): void {
        // Create the form
        this.signInForm = this._formBuilder.group({
            email     : [ null, [ Validators.required, Validators.email ] ],
            password  : [ null, Validators.required ],
            rememberMe: [ '' ],
        });

        const rememberMe = localStorage.getItem('rememberMe');
        if (rememberMe) {
            this.signInForm.patchValue({rememberMe});
        }
    }

    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
        this._authService.signIn({
            emailOrUsername: this.signInForm.value.email,
            password       : this.signInForm.value.password,
        })
            .subscribe({
                next : () => {
                    this.saveRememberMe();

                    // Set the redirect url.
                    // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
                    // to the correct page after a successful sign in. This way, that url can be set via
                    // routing file, and we don't have to touch here.
                    const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

                    // Navigate to the redirect url
                    this._router.navigateByUrl(redirectURL).then();
                },
                error: (response) => {
                    console.log(response);

                    // Re-enable the form
                    this.signInForm.enable();

                    // Reset the form
                    this.signInNgForm.resetForm();

                    // Set the alert
                    this.alert = {
                        type   : 'error',
                        message: 'Wrong email or password',
                    };

                    // Show the alert
                    this.showAlert = true;
                },
            });
    }

    saveRememberMe(): void {
        if (this.signInForm.value.rememberMe) {
            localStorage.setItem('rememberMe', this.signInForm.value.rememberMe);
        } else {
            localStorage.removeItem('rememberMe');
        }
    }
}
