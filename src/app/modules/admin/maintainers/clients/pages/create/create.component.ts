import { NgIf }                                                                               from '@angular/common';
import { Component, OnInit }                                                                  from '@angular/core';
import { CdkTextareaAutosize }                                                                from '@angular/cdk/text-field';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButton }                                                                          from '@angular/material/button';
import { MatCard }                                                                            from '@angular/material/card';
import { MatChipRemove, MatChipRow }                                                          from '@angular/material/chips';
import { MatError, MatFormField, MatLabel, MatSuffix }                                        from '@angular/material/form-field';
import { MatIcon }                                                                            from '@angular/material/icon';
import { MatInput }                                                                           from '@angular/material/input';
import { MatProgressSpinner }                                                                 from '@angular/material/progress-spinner';
import { Router }                                                                             from '@angular/router';

import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DropzoneCdkModule }                                   from '@ngx-dropzone/cdk';
import { DropzoneMaterialModule }                              from '@ngx-dropzone/material';
import { QuillEditorComponent }                                from 'ngx-quill';
import { INotyfNotificationOptions, Notyf }                    from 'notyf';
import { imageCompressor }                                     from 'quill-image-compress';

import { NewsCategoriesSelectorComponent } from '@shared/selectors/components/news-categories-selector/news-categories-selector.component';
import { PageDetailHeaderComponent }       from '@shared/components/page-detail-header/page-detail-header.component';
import { ClientService }                   from '@modules/admin/maintainers/clients/client.service';

@Component({
    selector   : 'app-create',
    standalone : true,
    imports    : [
        PageDetailHeaderComponent,
        TranslocoDirective,
        CdkTextareaAutosize,
        DropzoneCdkModule,
        DropzoneMaterialModule,
        FormsModule,
        MatButton,
        MatCard,
        MatChipRemove,
        MatChipRow,
        MatError,
        MatFormField,
        MatIcon,
        MatInput,
        MatLabel,
        MatProgressSpinner,
        MatSuffix,
        NewsCategoriesSelectorComponent,
        NgIf,
        QuillEditorComponent,
        ReactiveFormsModule,
        TranslocoPipe
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent implements OnInit {
    public newsForm: UntypedFormGroup;
    public title: string;
    public saveText: string;
    public quillModules: any = {
        toolbar        : [
            [ 'bold', 'italic', 'underline' ],
            [ {header: [ 1, 2, 3, 4, 5, 6, false ]} ],
            [ {align: []}, {list: 'ordered'}, {list: 'bullet'} ],
            [ 'link', 'image' ]
        ],
        'imageCompress': {
            quality  : 0.8,
            imageType: 'image/webp'
        }
    };
    public customModules = [ {implementation: imageCompressor, path: 'modules/imageCompress', property: 'imageCompress'} ];

    private readonly _notyf = new Notyf();

    constructor(
        private readonly _translateService: TranslocoService,
        private readonly _formBuilder: UntypedFormBuilder,
        private readonly _clientService: ClientService,
        private readonly _router: Router
    ) {}

    ngOnInit(): void {
        this.title = this._translateService.translate('admin.news.create.title');
        this.saveText = this._translateService.translate('actions.create');

        this.newsForm = this._formBuilder.group({
            headline     : [ undefined, [ Validators.required, Validators.minLength(10) ] ],
            abstract     : [ undefined, [ Validators.required, Validators.minLength(10) ] ],
            body         : [ undefined, [ Validators.required, Validators.minLength(50) ] ],
            category     : [ undefined, [ Validators.required ] ],
            portraitImage: [ undefined, [ Validators.required ] ],
        });
    }

    submit() {
        if (this.newsForm.invalid) {
            this.newsForm.markAllAsTouched();
            if (this.newsForm.get('portraitImage').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.image'), ...this.notyfOptions()});
            if (this.newsForm.get('body').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.body'), ...this.notyfOptions()});
            if (this.newsForm.get('category').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.category'), ...this.notyfOptions()});
            this._notyf.error({message: this._translateService.translate('errors.validation.message'), ...this.notyfOptions()});
            return;
        }

        this.newsForm.disable();

        this._clientService
            .post(this.newsForm.getRawValue())
            .subscribe({
                next : (result) => {
                    this._notyf.success({message: this._translateService.translate('success.news.create'), ...this.notyfOptions()});
                    this._router.navigate([ '/admin', 'news' ]);
                },
                error: (error) => {
                    this._notyf.error({message: this._translateService.translate('errors.service.message')});
                    this.newsForm.enable();
                }
            });
    }

    remove() {
        this.newsForm.get('portraitImage').setValue(undefined);
    }

    notyfOptions = (): Partial<INotyfNotificationOptions> => ({
        duration   : 5000,
        ripple     : true,
        position   : {x: 'right', y: 'top'},
        dismissible: true
    });
}
