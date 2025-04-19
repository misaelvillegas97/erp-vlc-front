import { Component, inject, resource }                                                                                  from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router }                                                                                       from '@angular/router';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                                          from '@ngneat/transloco';
import { NotyfService }                                                                                                 from '@shared/services/notyf.service';
import { PageDetailHeaderComponent }                                                                                    from '@shared/components/page-detail-header/page-detail-header.component';
import { MatFormFieldModule }                                                                                           from '@angular/material/form-field';
import { MatButton }                                                                                                    from '@angular/material/button';
import { LoaderButtonComponent }                                                                                        from '@shared/components/loader-button/loader-button.component';
import { MatInput }                                                                                                     from '@angular/material/input';
import { MatSelectModule }                                                                                              from '@angular/material/select';
import { MatCheckboxModule }                                                                                            from '@angular/material/checkbox';
import { CommonModule }                                                                                                 from '@angular/common';
import { firstValueFrom, Observable, of }                                                                               from 'rxjs';
import { FeatureTogglesService }                                                                                        from '../../feature-toggles.service';
import { MatIconModule }                                                                                                from '@angular/material/icon';

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
    selector   : 'app-edit',
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
        MatIconModule
    ],
    templateUrl: './edit.component.html'
})
export class EditComponent {
    readonly #fb = inject(FormBuilder);
    readonly #router = inject(Router);
    readonly #route = inject(ActivatedRoute);
    readonly #service = inject(FeatureTogglesService);
    readonly #ts = inject(TranslocoService);
    readonly #notyfService = inject(NotyfService);

    featureId: string;

    form: FormGroup = this.#fb.group({
        name        : [ '', [ Validators.required, Validators.pattern('[a-zA-Z0-9_.-]+') ] ],
        displayName : [ '', [ Validators.required ] ],
        description : [ '' ],
        enabled     : [ false ],
        category    : [ '' ],
        metadataJson: [ '{}', [], [ jsonValidator ] ],
        parentId    : [ '' ]
    });

    // Resource for current feature toggle
    featureResource = resource({
        loader: async () => {
            this.featureId = this.#route.snapshot.params['id'];
            const feature = await firstValueFrom(this.#service.findById(this.featureId, true));
            this.populateForm(feature);
            return feature;
        }
    });

    // Load possible parent features
    parentsResource = resource({
        loader: async () => {
            const features = await firstValueFrom(this.#service.findAll());
            // Filter out the current feature and its children to avoid circular references
            const filteredFeatures = features.filter(f => f.id !== this.featureId);
            return filteredFeatures;
        }
    });

    populateForm(feature: any) {
        // Format metadata as JSON string if it exists
        let metadataJson = '{}';
        if (feature.metadata && Object.keys(feature.metadata).length > 0) {
            try {
                metadataJson = JSON.stringify(feature.metadata, null, 2);
            } catch (e) {
                console.error('Error stringifying metadata:', e);
            }
        }

        this.form.patchValue({
            name        : feature.name,
            displayName : feature.displayName,
            description : feature.description || '',
            enabled     : feature.enabled,
            category    : feature.category || '',
            metadataJson: metadataJson,
            parentId    : feature.parentId || ''
        });

        // Disable name field since it's the identifier
        this.form.get('name').disable();
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.#notyfService.error(this.#ts.translate('errors.validation.message'));
            return;
        }

        this.form.disable();

        const formValue = this.form.getRawValue(); // Use getRawValue to get disabled fields too

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

        this.#service.update(this.featureId, formValue).subscribe({
            next : () => {
                this.#notyfService.success(this.#ts.translate('maintainers.feature-toggles.messages.updated'));
                this.#router.navigate([ '/maintainers', 'feature-toggles', 'list' ]);
            },
            error: (err) => {
                console.error('Error updating feature toggle:', err);
                this.#notyfService.error(this.#ts.translate('errors.service.message'));
                this.form.enable();
                // Keep name field disabled
                this.form.get('name').disable();
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
