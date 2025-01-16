import { NgIf }                                                                               from '@angular/common';
import { Component, OnInit }                                                                  from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButton }                                                                          from '@angular/material/button';
import { MatError, MatFormField, MatLabel }                                                   from '@angular/material/form-field';
import { MatInput }                                                                           from '@angular/material/input';
import { MatProgressSpinner }                                                                 from '@angular/material/progress-spinner';
import { Router }                                                                             from '@angular/router';

import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { INotyfNotificationOptions, Notyf }                    from 'notyf';
import { PageDetailHeaderComponent }                           from '@shared/components/page-detail-header/page-detail-header.component';
import { ClientService }                                       from '@modules/admin/maintainers/clients/client.service';

@Component({
    selector   : 'app-create',
    standalone : true,
    imports    : [
        PageDetailHeaderComponent,
        TranslocoDirective,
        FormsModule,
        MatButton,
        MatError,
        MatFormField,
        MatInput,
        MatLabel,
        MatProgressSpinner,
        NgIf,
        ReactiveFormsModule,
        TranslocoPipe
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent implements OnInit {
    public clientForm: UntypedFormGroup;

    private readonly _notyf = new Notyf();

    constructor(
        private readonly _translateService: TranslocoService,
        private readonly _formBuilder: UntypedFormBuilder,
        private readonly _clientService: ClientService,
        private readonly _router: Router
    ) {}

    ngOnInit(): void {
        this.clientForm = this._formBuilder.group({
            businessName: [ '', [ Validators.required ] ],
            fantasyName : [ '', [ Validators.required ] ],
            code        : [ '', [ Validators.required ] ],
            nationalId  : [ '', [ Validators.required ] ],
            email       : [ '', [ Validators.required, Validators.email ] ],
            phone       : [ '', [ Validators.required ] ],
        });
    }

    submit() {
        if (this.clientForm.invalid) {
            this.clientForm.markAllAsTouched();
            if (this.clientForm.get('portraitImage').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.image'), ...this.notyfOptions()});
            if (this.clientForm.get('body').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.body'), ...this.notyfOptions()});
            if (this.clientForm.get('category').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.category'), ...this.notyfOptions()});
            this._notyf.error({message: this._translateService.translate('errors.validation.message'), ...this.notyfOptions()});
            return;
        }

        this.clientForm.disable();

        this._clientService
            .post(this.clientForm.getRawValue())
            .subscribe({
                next : (result) => {
                    this._notyf.success({message: this._translateService.translate('success.news.create'), ...this.notyfOptions()});
                    this._router.navigate([ '/admin', 'news' ]);
                },
                error: (error) => {
                    this._notyf.error({message: this._translateService.translate('errors.service.message')});
                    this.clientForm.enable();
                }
            });
    }

    notyfOptions = (): Partial<INotyfNotificationOptions> => ({
        duration   : 5000,
        ripple     : true,
        position   : {x: 'right', y: 'top'},
        dismissible: true
    });
}
