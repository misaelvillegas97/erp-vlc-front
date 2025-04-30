import { NgClass, NgIf }                                                                              from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation }                                            from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule }                                                                            from '@angular/material/button';
import { MatCheckboxModule }                                                                          from '@angular/material/checkbox';
import { MatFormFieldModule }                                                                         from '@angular/material/form-field';
import { MatIconModule }                                                                              from '@angular/material/icon';
import { MatInputModule }                                                                             from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                   from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink }                                                         from '@angular/router';
import { fuseAnimations }                                                                             from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType }                                                          from '@fuse/components/alert';
import { AuthService }                                                                                from 'app/core/auth/auth.service';
import { emailAsyncValidator }                                                                        from '@modules/auth/sign-up/validators/valid-email.validator';
import { take }                                                                                       from 'rxjs';

@Component({
    selector     : 'auth-sign-up',
    templateUrl  : './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [ RouterLink, NgIf, FuseAlertComponent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule, NgClass ],
})
export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;

    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _route: ActivatedRoute
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form


        // Subscribe to the query params
        const queryParams = this._route.snapshot.queryParams;

        if (queryParams.token) {
            this.signUpForm = this._loadForm(queryParams.token);
        } else {
            this.signUpForm = this._loadForm();
            this.signUpForm.addControl('company', this._addCompanyFormGroup());
        }

        this.signUpForm.get('hasToken').valueChanges.subscribe((hasToken: boolean) => {
            if (hasToken) {
                this._removeCompanyFormGroup();
                this.signUpForm.get('token').setValidators([ Validators.required ]);
            } else {
                this.signUpForm.addControl('company', this._addCompanyFormGroup());
                this.signUpForm.get('token').setValidators(null);
            }

            this.signUpForm.get('token').updateValueAndValidity();
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign up
     */
    signUp(): void {
        // Do nothing if the form is invalid
        if (this.signUpForm.invalid) {
            this.alert = {type: 'error', message: 'Please fill in all the required fields.'};
            this.signUpForm.markAllAsTouched();
        }


        // Disable the form
        this.signUpForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign up
        this._authService.signUp(this.signUpForm.getRawValue())
            .pipe(take(1))
            .subscribe({
                next : (response) => {
                    this._router.navigateByUrl('/confirmation-required');
                },
                error: (err) => {
                    // Re-enable the form
                    this.signUpForm.enable();

                    // Set the alert
                    switch (err.error.message) {
                        case 'CONFLICT':
                            this.signUpForm.get('nationalId').setErrors({conflict: true});
                            this.alert = {type: 'error', message: 'Company by Business ID already exists.'};
                            break;
                        case 'CONFLICT_EMAIL':
                            this.signUpForm.get('email').setErrors({conflict: true});
                            this.alert = {type: 'error', message: 'Company email already registered.'};
                            break;
                        case 'INVITE_NOT_FOUND':
                            this.signUpForm.get('token').setErrors({notFound: true});
                            this.alert = {type: 'error', message: 'Invite token not found.'};
                            break;
                        case 'TOKEN_EMAIL_MISMATCH':
                            this.alert = {type: 'error', message: 'Token email mismatch.'};
                            break;
                        case 'TOKEN_OR_COMPANY_REQUIRED':
                            this.alert = {type: 'error', message: 'Token invite or company information is required.'};
                            break;
                        default:
                            this.alert = {type: 'error', message: 'Something went wrong, please try again.'};
                            break;
                    }

                    // Show the alert
                    this.showAlert = true;
                }
            });
    }

    private _loadForm = (token?: string): UntypedFormGroup => this._formBuilder.group({
        firstname: [ undefined, Validators.required ],
        lastname : [ undefined, Validators.required ],
        email    : [ undefined, [ Validators.required, Validators.email ], [ emailAsyncValidator(this._authService) ] ],
        password : [ undefined, Validators.required ],
        hasToken  : [ !!token ],
        token     : [ token || undefined, token ? [ Validators.required ] : null ],
        agreements: [ true, Validators.requiredTrue ]
    });

    private _addCompanyFormGroup = () => this._formBuilder.group({
        name      : [ '', Validators.required ],
        email     : [ '', Validators.required ],
        nationalId: [ '', Validators.required ],
        website   : [ '', Validators.required ],
        country   : [ 'CL', Validators.required ],
    });

    private _removeCompanyFormGroup = () => {
        this.signUpForm.removeControl('company');
        this.signUpForm.updateValueAndValidity();
    };
}
