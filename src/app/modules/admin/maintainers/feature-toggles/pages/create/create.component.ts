import { Component, inject, resource }                                                                                  from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router }                                                                                                       from '@angular/router';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                                          from '@ngneat/transloco';
import { NotyfService }                                                                                                 from '@shared/services/notyf.service';
import { PageDetailHeaderComponent }                                                                                    from '@shared/components/page-detail-header/page-detail-header.component';
import { MatFormFieldModule }                                                                                           from '@angular/material/form-field';
import { MatButton, MatIconButton }                                                                                     from '@angular/material/button';
import { LoaderButtonComponent }                                                                                        from '@shared/components/loader-button/loader-button.component';
import { MatInput }                                                                                                     from '@angular/material/input';
import { MatSelectModule }                                                                                              from '@angular/material/select';
import { MatCheckboxModule }                                                                                            from '@angular/material/checkbox';
import { CommonModule }                                                                                                 from '@angular/common';
import { firstValueFrom, Observable, of }                                                                               from 'rxjs';
import { FeatureTogglesService }                                                                                        from '../../feature-toggles.service';
import { MatIconModule }                                                                                                from '@angular/material/icon';
import { MatTooltip }                                                                                                   from '@angular/material/tooltip';

// JSON validator function
export const jsonValidator: AsyncValidatorFn = (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;

    if (!value || value.trim() === '') {
        return of(null); // Empty JSON is valid
    }

    try {
        JSON.parse(value);
        return of(null); // Valid JSON
    } catch (e) {
        return of({invalidJson: {message: e instanceof Error ? e.message : 'Invalid JSON'}});
    }
};

@Component({
    selector   : 'app-create',
    standalone : true,
    imports    : [
        CommonModule,
        TranslocoDirective,
        PageDetailHeaderComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        TranslocoPipe,
        MatButton,
        LoaderButtonComponent,
        MatInput,
        MatCheckboxModule,
        MatIconModule,
        MatIconButton,
        MatTooltip
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    readonly #fb = inject(FormBuilder);
    readonly #router = inject(Router);
    readonly #service = inject(FeatureTogglesService);
    readonly #ts = inject(TranslocoService);
    readonly #notyfService = inject(NotyfService);

    form: FormGroup = this.#fb.group({
        name        : [ '', [ Validators.required, Validators.pattern('[a-zA-Z0-9_.-]+') ] ],
        displayName : [ '', [ Validators.required ] ],
        description : [ '' ],
        enabled     : [ false ],
        category    : [ '' ],
        metadataJson: [ '{}', [], [ jsonValidator ] ],
        parentId    : [ '' ]
    });

    // Load possible parent features
    parentsResource = resource({
        loader: async () => {
            const features = await firstValueFrom(this.#service.findAll());
            return features;
        }
    });

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.#notyfService.error(this.#ts.translate('errors.validation.message'));
            return;
        }

        this.form.disable();

        const formValue = this.form.value;
        // Clean up the form value
        if (!formValue.parentId) {
            delete formValue.parentId;
        }

        // Parse metadata JSON if it exists
        try {
            if (formValue.metadataJson && formValue.metadataJson.trim() !== '') {
                formValue.metadata = JSON.parse(formValue.metadataJson);
            }
        } catch (e) {
            // This shouldn't happen due to validation, but just in case
            console.error('Error parsing JSON:', e);
        }

        // Remove the JSON string field
        delete formValue.metadataJson;

        // If metadata is empty object or invalid, don't send it
        if (!formValue.metadata || Object.keys(formValue.metadata).length === 0) {
            delete formValue.metadata;
        }

        this.#service.create(formValue).subscribe({
            next : () => {
                this.#notyfService.success(this.#ts.translate('maintainers.feature-toggles.messages.created'));
                this.#router.navigate([ '/maintainers', 'feature-toggles', 'list' ]);
            },
            error: (err) => {
                console.error('Error creating feature toggle:', err);
                this.#notyfService.error(this.#ts.translate('errors.service.message'));
                this.form.enable();
            }
        });
    }

    formatJson() {
        try {
            const jsonControl = this.form.get('metadataJson');
            const jsonValue = jsonControl.value;
            if (jsonValue && jsonValue.trim() !== '') {
                const formattedJson = JSON.stringify(JSON.parse(jsonValue), null, 2);
                jsonControl.setValue(formattedJson);
            }
        } catch (e) {
            // Do nothing if JSON is invalid
        }
    }
}
