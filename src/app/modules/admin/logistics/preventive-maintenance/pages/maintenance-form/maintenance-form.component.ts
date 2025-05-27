import { Component, inject, OnInit, resource, signal }                        from '@angular/core';
import { CommonModule }                                                       from '@angular/common';
import { ActivatedRoute, Router }                                             from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceRecordService }                                           from '../../services/maintenance-record.service';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType }              from '../../domain/model/maintenance-record.model';
import { PageDetailHeaderComponent }                                          from '@shared/components/page-detail-header/page-detail-header.component';
import { MatButtonModule }                                                    from '@angular/material/button';
import { MatIconModule }                                                      from '@angular/material/icon';
import { MatFormFieldModule }                                                 from '@angular/material/form-field';
import { MatInputModule }                                                     from '@angular/material/input';
import { MatSelectModule }                                                    from '@angular/material/select';
import { MatDatepickerModule }                                                from '@angular/material/datepicker';
import { MatNativeDateModule }                                                from '@angular/material/core';
import { MatCardModule }                                                      from '@angular/material/card';
import { MatDividerModule }                                                   from '@angular/material/divider';
import { MatChipsModule }                                                     from '@angular/material/chips';
import { MatTooltipModule }                                                   from '@angular/material/tooltip';
import { FileUploadComponent }                                                from '@shared/components/file-upload/file-upload.component';
import { MatSnackBar, MatSnackBarModule }                                     from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                           from '@angular/material/progress-spinner';
import { LoaderButtonComponent }                                              from '@shared/components/loader-button/loader-button.component';
import { firstValueFrom }                                                     from 'rxjs';
import { FileResponse }                                                       from '@shared/services/file.service';
import { VehicleSelectorComponent }                                           from '@shared/controls/components/vehicle-selector/vehicle-selector.component';

@Component({
    selector   : 'app-maintenance-form',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        PageDetailHeaderComponent,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCardModule,
        MatDividerModule,
        MatChipsModule,
        MatTooltipModule,
        FileUploadComponent,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        LoaderButtonComponent,
        VehicleSelectorComponent
    ],
    templateUrl: './maintenance-form.component.html'
})
export class MaintenanceFormComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private maintenanceService = inject(MaintenanceRecordService);
    private fb = inject(FormBuilder);
    private snackBar = inject(MatSnackBar);

    // Signals
    isLoading = signal(false);
    isSaving = signal(false);
    isEditMode = signal(false);
    maintenanceId = signal<string | null>(null);

    // Enums para los selects
    maintenanceTypes = Object.values(MaintenanceType);
    maintenanceStatuses = Object.values(MaintenanceStatus);

    // Formulario
    maintenanceForm = this.fb.group({
        vehicleId    : [ '', Validators.required ],
        date         : [ new Date(), Validators.required ],
        type         : [ MaintenanceType.PREVENTIVE, Validators.required ],
        status       : [ MaintenanceStatus.PENDING, Validators.required ],
        odometer     : [ 0, [ Validators.required, Validators.min(0) ] ],
        description  : [ '' ],
        cost         : [ 0, [ Validators.required, Validators.min(0) ] ],
        provider     : [ '' ],
        partsReplaced: this.fb.array([]),
        documents    : this.fb.array([]),
        notes        : [ '' ]
    });

    // Resource para cargar los datos
    maintenanceResource = resource({
        loader: () => {
            const id = this.route.snapshot.paramMap.get('id');
            if (id) {
                this.isEditMode.set(true);
                this.maintenanceId.set(id);
                this.isLoading.set(true);

                return firstValueFrom(this.maintenanceService.getMaintenanceRecord(id))
                    .then(record => {
                        this.populateForm(record);
                        this.isLoading.set(false);
                    })
                    .catch(() => {
                        this.snackBar.open('Error al cargar el registro de mantenimiento', 'Cerrar', {
                            duration: 3000
                        });
                        this.isLoading.set(false);
                        void this.router.navigate([ '/logistics/preventive-maintenance/list' ]);
                    });
            }
            return Promise.resolve();
        }
    });

    ngOnInit(): void {
        // Resource will handle data loading
    }

    /**
     * Rellena el formulario con los datos del registro de mantenimiento
     */
    populateForm(record: MaintenanceRecord): void {
        this.maintenanceForm.patchValue({
            vehicleId  : record.vehicleId,
            date       : new Date(record.date),
            type       : record.type,
            status     : record.status,
            odometer   : record.odometer,
            description: record.description || '',
            cost       : record.cost,
            provider   : record.provider || '',
            notes      : record.notes || ''
        });

        // Rellenar partes reemplazadas
        if (record.partsReplaced && record.partsReplaced.length > 0) {
            const partsArray = this.maintenanceForm.get('partsReplaced') as FormArray;
            partsArray.clear();
            record.partsReplaced.forEach(part => {
                partsArray.push(this.createPartFormGroup(part.part, part.cost, part.quantity));
            });
        }

        // Rellenar documentos
        if (record.documents && record.documents.length > 0) {
            const documentsArray = this.maintenanceForm.get('documents') as FormArray;
            documentsArray.clear();
            record.documents.forEach(doc => {
                documentsArray.push(this.createDocumentFormGroup(doc.id, doc.name, doc.url));
            });
        }
    }

    /**
     * Crea un FormGroup para una parte reemplazada
     */
    createPartFormGroup(part: string = '', cost: number = 0, quantity: number = 1): FormGroup {
        return this.fb.group({
            part    : [ part, Validators.required ],
            cost    : [ cost, [ Validators.required, Validators.min(0) ] ],
            quantity: [ quantity, [ Validators.required, Validators.min(1) ] ]
        });
    }

    /**
     * Crea un FormGroup para un documento
     */
    createDocumentFormGroup(id: string = '', name: string = '', url: string = ''): FormGroup {
        return this.fb.group({
            id  : [ id ],
            name: [ name, Validators.required ],
            url : [ url, Validators.required ]
        });
    }

    /**
     * Obtiene el FormArray de partes reemplazadas
     */
    get partsReplacedArray(): FormArray {
        return this.maintenanceForm.get('partsReplaced') as FormArray;
    }

    /**
     * Obtiene el FormArray de documentos
     */
    get documentsArray(): FormArray {
        return this.maintenanceForm.get('documents') as FormArray;
    }

    /**
     * Agrega una nueva parte reemplazada
     */
    addPart(): void {
        this.partsReplacedArray.push(this.createPartFormGroup());
    }

    /**
     * Elimina una parte reemplazada
     */
    removePart(index: number): void {
        this.partsReplacedArray.removeAt(index);
    }

    /**
     * Agrega un nuevo documento
     */
    addDocument(): void {
        this.documentsArray.push(this.createDocumentFormGroup());
    }

    /**
     * Elimina un documento
     */
    removeDocument(index: number): void {
        this.documentsArray.removeAt(index);
    }

    /**
     * Maneja el evento de carga de archivo
     */
    onFileUploaded(fileResponse: FileResponse): void {
        if (fileResponse) {
            const documentsArray = this.maintenanceForm.get('documents') as FormArray;
            documentsArray.push(this.createDocumentFormGroup(
                fileResponse.id,
                fileResponse.path.split('/').pop() || 'Documento',
                fileResponse.path
            ));
        }
    }

    /**
     * Guarda el registro de mantenimiento
     */
    saveMaintenanceRecord(): void {
        if (this.maintenanceForm.invalid) {
            this.maintenanceForm.markAllAsTouched();
            this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', {
                duration: 3000
            });
            return;
        }

        this.isSaving.set(true);
        const formValue = this.maintenanceForm.value;
        const maintenanceData = {
            ...formValue,
            date    : formValue.date ? new Date(formValue.date).toISOString().split('T')[0] : '',
            cost    : Number(formValue.cost),
            odometer: Number(formValue.odometer)
        } as MaintenanceRecord;

        if (this.isEditMode()) {
            this.maintenanceService.updateMaintenanceRecord(this.maintenanceId()!, maintenanceData).subscribe({
                next : () => {
                    this.snackBar.open('Registro de mantenimiento actualizado correctamente', 'Cerrar', {
                        duration: 3000
                    });
                    this.isSaving.set(false);
                    this.router.navigate([ '/logistics/preventive-maintenance/list' ]);
                },
                error: () => {
                    this.snackBar.open('Error al actualizar el registro de mantenimiento', 'Cerrar', {
                        duration: 3000
                    });
                    this.isSaving.set(false);
                }
            });
        } else {
            this.maintenanceService.createMaintenanceRecord(maintenanceData).subscribe({
                next : () => {
                    this.snackBar.open('Registro de mantenimiento creado correctamente', 'Cerrar', {
                        duration: 3000
                    });
                    this.isSaving.set(false);
                    this.router.navigate([ '/logistics/preventive-maintenance/list' ]);
                },
                error: () => {
                    this.snackBar.open('Error al crear el registro de mantenimiento', 'Cerrar', {
                        duration: 3000
                    });
                    this.isSaving.set(false);
                }
            });
        }
    }

    /**
     * Cancela la edición y vuelve a la lista de registros
     */
    cancel(): void {
        this.router.navigate([ '/logistics/preventive-maintenance/list' ]);
    }
}
