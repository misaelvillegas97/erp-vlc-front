import { Component, OnInit }                                                     from '@angular/core';
import { MatDialogRef }                                                          from '@angular/material/dialog';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                   from '@ngneat/transloco';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NewsService }                                                           from '@modules/admin/admin/news/news.service';
import { MatButtonModule }                                                       from '@angular/material/button';
import { CdkTextareaAutosize }                                                   from '@angular/cdk/text-field';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatInputModule }                                                        from '@angular/material/input';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { JsonPipe, NgIf }                                                        from '@angular/common';
import { QuillEditorComponent }                                                  from 'ngx-quill';
import { DropzoneMaterialModule }                                                from '@ngx-dropzone/material';
import { MatChipsModule }                                                        from '@angular/material/chips';
import { DropzoneCdkModule }                                                     from '@ngx-dropzone/cdk';
import { ImageUploadPreviewComponent }                                           from '@modules/admin/admin/albums/components/image-upload-preview/image-upload-preview.component';
import { MatCard }                                                               from '@angular/material/card';
import { NewsCategoriesSelectorComponent }                                       from '../../../../../../shared/selectors/components/news-categories-selector/news-categories-selector.component';
import { INotyfNotificationOptions, Notyf }                                      from 'notyf';
import { imageCompressor }                                                       from 'quill-image-compress';

@Component({
    selector   : 'app-new-news',
    standalone : true,
    imports    : [
        ReactiveFormsModule,
        CdkTextareaAutosize,
        MatButtonModule,
        MatCard,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIcon,
        MatProgressSpinner,
        NgIf,
        QuillEditorComponent,
        TranslocoDirective,
        DropzoneCdkModule,
        DropzoneMaterialModule,
        ImageUploadPreviewComponent,
        NewsCategoriesSelectorComponent,
        JsonPipe,
        TranslocoPipe
    ],
    templateUrl: './new-news.component.html'
})
export class NewNewsComponent implements OnInit {
    public newsForm: UntypedFormGroup;
    public title: string;
    public saveText: string;
    public quillModules: any = {
        toolbar        : [
            [ 'bold', 'italic', 'underline' ],
            [ 'blockquote', 'code-block' ],
            [ {header: [ 1, 2, 3, 4, 5, 6, false ]} ],
            [ {align: []}, {list: 'ordered'}, {list: 'bullet'} ],
            [ 'clean' ],
            [ 'link', 'image' ]
        ],
        'imageCompress': {
            quality  : 0.8,
            imageType: 'image/webp',
            debug    : true
        }
    };
    public customModules = [ {implementation: imageCompressor, path: 'modules/imageCompress', property: 'imageCompress'} ];

    private readonly _notyf = new Notyf();

    constructor(
        public readonly _matDialogRef: MatDialogRef<NewNewsComponent>,
        private readonly _translateService: TranslocoService,
        private readonly _formBuilder: UntypedFormBuilder,
        private readonly _newsService: NewsService
    ) {}

    ngOnInit(): void {
        this.title = this._translateService.translate('admin.news.new.title');
        this.saveText = this._translateService.translate('admin.news.new.create');

        this.newsForm = this._formBuilder.group({
            headline     : [ undefined, [ Validators.required, Validators.minLength(10) ] ],
            abstract     : [ undefined, [ Validators.required, Validators.minLength(10) ] ],
            body         : [ undefined, [ Validators.required, Validators.minLength(50) ] ],
            category     : [ undefined, [ Validators.required ] ],
            portraitImage: [ undefined, [ Validators.required ] ],
        });
    }

    save() {
        if (this.newsForm.invalid) {
            this.newsForm.markAllAsTouched();
            if (this.newsForm.get('portraitImage').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.image'), ...this.notyfOptions()});
            if (this.newsForm.get('body').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.body'), ...this.notyfOptions()});
            if (this.newsForm.get('category').invalid) this._notyf.error({message: this._translateService.translate('errors.validation.category'), ...this.notyfOptions()});
            this._notyf.error({message: this._translateService.translate('errors.validation.message'), ...this.notyfOptions()});
            return;
        }

        this.newsForm.disable();

        this._newsService
            .post(this.newsForm.getRawValue())
            .subscribe({
                next : (result) => {
                    this._matDialogRef.close();
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
