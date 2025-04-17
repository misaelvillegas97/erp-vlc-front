import { Component, inject, OnInit, signal }                                  from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink }                                 from '@angular/router';
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
import { FuelType, Vehicle, VehicleDocumentType, VehicleStatus, VehicleType } from '../../domain/model/vehicle';
import { CommonModule }                                                       from '@angular/common';
import { catchError, finalize, of }                                           from 'rxjs';
import { DateTime }                                                           from 'luxon';
import { MatTabsModule }                                                      from '@angular/material/tabs';

@Component({
    selector   : 'app-edit',
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
        CommonModule,
        RouterLink,
        MatTabsModule
    ],
    templateUrl: './edit.component.html'
})
export class EditComponent implements OnInit {
    readonly #fb = inject(FormBuilder);
    readonly #router = inject(Router);
    readonly #route = inject(ActivatedRoute);
    readonly #service = inject(VehiclesService);
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();

    // Make window available for template
    readonly window = window;

    // Make enums available to template
    vehicleDocumentTypes = Object.values(VehicleDocumentType);
    vehicleTypes = Object.values(VehicleType);
    fuelTypes = Object.values(FuelType);
    vehicleStatuses = Object.values(VehicleStatus);

    vehicleId: string;
    isLoading = signal(true);
    vehicle: Vehicle;

    // Main form for vehicle data
    form: FormGroup = this.#fb.group({
        // Basic info
        brand            : [ '', [ Validators.required ] ],
        model            : [ '', [ Validators.required ] ],
        year             : [ '', [ Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1) ] ],
        licensePlate     : [ '', [ Validators.required, Validators.pattern(/^[A-Z0-9]{6}$/) ] ],
        vin              : [ '' ],
        type             : [ VehicleType.SEDAN ],
        color            : [ '' ],
        fuelType         : [ FuelType.GASOLINE ],
        tankCapacity     : [ '' ],
        lastKnownOdometer: [ 0, [ Validators.required, Validators.min(0) ] ],
        status           : [ VehicleStatus.AVAILABLE ],
        departmentId     : [ '' ],
        notes            : [ '' ],

        // Dates and maintenance
        purchaseDate       : [ '', [ Validators.required ] ],
        lastMaintenanceDate: [ '' ],
        nextMaintenanceDate: [ '' ],
        nextMaintenanceKm  : [ '' ],

        // Insurance and inspections
        insuranceNumber          : [ '' ],
        insuranceExpiry          : [ '' ],
        technicalInspectionExpiry: [ '' ],

        // Photos
        photoUrl           : [ '' ],
        additionalPhotoUrls: this.#fb.array([]),

        // Documents
        documents: this.#fb.array([])
    });

    get documents(): FormArray {
        return this.form.get('documents') as FormArray;
    }

    get additionalPhotoUrls(): FormArray {
        return this.form.get('additionalPhotoUrls') as FormArray;
    }

    ngOnInit(): void {
        this.vehicleId = this.#route.snapshot.paramMap.get('id');
        if (this.vehicleId) {
            this.loadVehicle();
        } else {
            this.#notyf.error({message: 'ID de vehículo inválido'});
            this.#router.navigate([ '/maintainers', 'vehicles' ]);
        }
    }

    loadVehicle(): void {
        this.isLoading.set(true);

        this.#service.findById(this.vehicleId)
            .pipe(
                catchError(err => {
                    this.#notyf.error({message: 'Error al cargar la información del vehículo'});
                    this.#router.navigate([ '/maintainers', 'vehicles' ]);
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading.set(false);
                })
            )
            .subscribe(vehicle => {
                if (!vehicle) return;

                this.vehicle = vehicle;

                // Patch form with vehicle data
                this.form.patchValue({
                    brand                    : vehicle.brand,
                    model                    : vehicle.model,
                    year                     : vehicle.year,
                    licensePlate             : vehicle.licensePlate,
                    purchaseDate             : vehicle.purchaseDate,
                    vin                      : vehicle.vin,
                    type                     : vehicle.type || VehicleType.SEDAN,
                    color                    : vehicle.color,
                    fuelType                 : vehicle.fuelType || FuelType.GASOLINE,
                    tankCapacity             : vehicle.tankCapacity,
                    lastKnownOdometer        : vehicle.lastKnownOdometer || 0,
                    status                   : vehicle.status || VehicleStatus.AVAILABLE,
                    departmentId             : vehicle.departmentId,
                    notes                    : vehicle.notes,
                    lastMaintenanceDate      : vehicle.lastMaintenanceDate,
                    nextMaintenanceDate      : vehicle.nextMaintenanceDate,
                    nextMaintenanceKm        : vehicle.nextMaintenanceKm,
                    insuranceNumber          : vehicle.insuranceNumber,
                    insuranceExpiry          : vehicle.insuranceExpiry,
                    technicalInspectionExpiry: vehicle.technicalInspectionExpiry,
                    photoUrl                 : vehicle.photoUrl
                });

                // Add photo URLs to form array
                if (vehicle.additionalPhotoUrls && vehicle.additionalPhotoUrls.length > 0) {
                    // Clear existing array
                    while (this.additionalPhotoUrls.length !== 0) {
                        this.additionalPhotoUrls.removeAt(0);
                    }

                    // Add each photo URL
                    vehicle.additionalPhotoUrls.forEach(url => {
                        this.additionalPhotoUrls.push(this.#fb.control(url));
                    });
                }

                // Add documents to form array
                if (vehicle.documents && vehicle.documents.length > 0) {
                    // Clear existing document array (if any)
                    while (this.documents.length !== 0) {
                        this.documents.removeAt(0);
                    }

                    // Add each document
                    vehicle.documents.forEach(doc => {
                        this.documents.push(this.#fb.group({
                            id            : [ doc.id ],
                            name          : [ doc.name, [ Validators.required ] ],
                            type          : [ doc.type, [ Validators.required ] ],
                            fileUrl       : [ doc.fileUrl, [ Validators.required ] ],
                            expirationDate: [ doc.expirationDate || '' ]
                        }));
                    });
                }
            });
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

    addPhotoUrl(): void {
        this.additionalPhotoUrls.push(this.#fb.control('', [ Validators.required ]));
    }

    removePhotoUrl(index: number): void {
        this.additionalPhotoUrls.removeAt(index);
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

    onMainPhotoSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            // In a real implementation, this would upload the file and set the URL
            this.form.patchValue({
                photoUrl: 'http://example.com/photos/' + file.name
            });

            // Simulate success notification
            this.#notyf.success({
                message: `Foto principal "${ file.name }" cargada correctamente`
            });
        }
    }

    onAdditionalPhotoSelected(event: Event, index: number): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            // In a real implementation, this would upload the file and set the URL
            this.additionalPhotoUrls.at(index).setValue('http://example.com/photos/' + file.name);

            // Simulate success notification
            this.#notyf.success({
                message: `Foto adicional "${ file.name }" cargada correctamente`
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

        this.#service.update(this.vehicleId, formData).subscribe({
            next : () => {
                this.#notyf.success({message: this.#ts.translate('maintainers.vehicles.edit.success')});
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

    mainPhotoInput() {
        document.getElementById('main-photo-input')?.click();
    }

    additionalPhotoInput(index: number) {
        const id = `additional-photo-${ index }`;
        document.getElementById(id)?.click();
    }

    protected readonly DateTime = DateTime;
}
