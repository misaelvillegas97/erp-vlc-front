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
import { FileUploadComponent }                                                from '@shared/components/file-upload';

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
        MatTabsModule,
        FileUploadComponent
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
        photo           : [ null ],
        additionalPhotos: this.#fb.array([]),

        // Documents
        documents: this.#fb.array([])
    });

    get documents(): FormArray {
        return this.form.get('documents') as FormArray;
    }

    get additionalPhotos(): FormArray {
        return this.form.get('additionalPhotos') as FormArray;
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
                    photo: vehicle.photo
                });

                // Add photos to form array
                if (vehicle.additionalPhotos && vehicle.additionalPhotos.length > 0) {
                    // Clear existing array
                    while (this.additionalPhotos.length !== 0) {
                        this.additionalPhotos.removeAt(0);
                    }

                    // Add each photo
                    vehicle.additionalPhotos.forEach(photo => {
                        this.additionalPhotos.push(this.#fb.control(photo));
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
                            file: [ doc.file, [ Validators.required ] ],
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
            file: [ null, [ Validators.required ] ],
            expirationDate: [ '' ]
        });

        this.documents.push(documentForm);
    }

    removeDocument(index: number): void {
        this.documents.removeAt(index);
    }

    addPhoto(): void {
        this.additionalPhotos.push(this.#fb.control(null, [ Validators.required ]));
    }

    removePhoto(index: number): void {
        this.additionalPhotos.removeAt(index);
    }

    // These methods are no longer needed as we're using the FileUploadComponent
    // which handles file uploads internally

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

    // These methods are no longer needed as we're using the FileUploadComponent
    // which handles file input clicks internally

    protected readonly DateTime = DateTime;
}
