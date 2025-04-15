import { Component, inject }                                                  from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router }                                                             from '@angular/router';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                from '@ngneat/transloco';
import { Notyf }                                                              from 'notyf';
import { PageDetailHeaderComponent }                                          from '@shared/components/page-detail-header/page-detail-header.component';
import { MatFormFieldModule }                                                 from '@angular/material/form-field';
import { MatButton }                                                          from '@angular/material/button';
import { LoaderButtonComponent }                                              from '@shared/components/loader-button/loader-button.component';
import { MatInput }                                                           from '@angular/material/input';
import { VehiclesService }                                                    from '../../vehicles.service';
import { MatDatepickerModule }                                                from '@angular/material/datepicker';
import { MatSelectModule }                                                    from '@angular/material/select';
import { MatIconModule }                                                      from '@angular/material/icon';
import { VehicleDocumentType }                                                from '../../domain/model/vehicle';
import { CommonModule }                                                       from '@angular/common';
import { DateTime }                                                           from 'luxon';

@Component({
    selector   : 'app-create',
    standalone : true,
    imports    : [
        TranslocoDirective,
        PageDetailHeaderComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        TranslocoPipe,
        MatButton,
        LoaderButtonComponent,
        MatInput,
        MatDatepickerModule,
        MatSelectModule,
        MatIconModule,
        CommonModule
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    readonly #fb = inject(FormBuilder);
    readonly #router = inject(Router);
    readonly #service = inject(VehiclesService);
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();

    // Enum for documents dropdown
    documentTypes = Object.values(VehicleDocumentType);

    // Main form for vehicle data
    form: FormGroup = this.#fb.group({
        brand       : [ '', [ Validators.required ] ],
        model       : [ '', [ Validators.required ] ],
        year        : [ '', [ Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1) ] ],
        licensePlate: [ '', [ Validators.required, Validators.pattern(/^[A-Z0-9]{6}$/) ] ],
        purchaseDate: [ '', [ Validators.required ] ],
        documents   : this.#fb.array([])
    });

    get documents(): FormArray {
        return this.form.get('documents') as FormArray;
    }

    addDocument(): void {
        const documentForm = this.#fb.group({
            name          : [ '', [ Validators.required ] ],
            type          : [ null, [ Validators.required ] ],
            fileUrl       : [ '', [ Validators.required ] ],
            expirationDate: [ '' ]
        });

        this.documents.push(documentForm);
    }

    removeDocument(index: number): void {
        this.documents.removeAt(index);
    }

    onFileSelected(event: Event, index: number): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            // In a real implementation, this would upload the file and set the URL
            const documentForm = this.documents.at(index);
            documentForm.patchValue({
                fileUrl: 'http://example.com/document/' + file.name
            });

            // Simulate success notification
            this.#notyf.success({
                message: `Documento "${ file.name }" cargado correctamente`
            });
        }
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.#notyf.error({message: this.#ts.translate('errors.validation.message')});
            return;
        }

        this.form.disable();

        // Format data for API
        const formData = this.form.getRawValue();

        // In a real implementation, you'd handle document uploads here
        // and then submit the vehicle data with document references

        this.#service.create(formData).subscribe({
            next : () => {
                this.#notyf.success({message: this.#ts.translate('maintainers.vehicles.new.success')});
                this.#router.navigate([ '/maintainers', 'vehicles' ]);
            },
            error: () => {
                this.#notyf.error({message: this.#ts.translate('errors.service.message')});
                this.form.enable();
            }
        });
    }

    documentFileInput(index: number) {
        const id = `document-file-${ index }`;

        document.getElementById(id)?.click();
    }

    protected readonly DateTime = DateTime;
}
