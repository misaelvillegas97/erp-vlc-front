import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule }                                                                      from '@angular/common';
import { RouterModule, ActivatedRoute, Router }                                              from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators }   from '@angular/forms';
import { MatButtonModule }                                                                   from '@angular/material/button';
import { MatCardModule }                                                                     from '@angular/material/card';
import { MatFormFieldModule }                                                                from '@angular/material/form-field';
import { MatInputModule }                                                                    from '@angular/material/input';
import { MatSelectModule }                                                                   from '@angular/material/select';
import { MatIconModule }                                                                     from '@angular/material/icon';
import { MatCheckboxModule }                                                                 from '@angular/material/checkbox';
import { MatDatepickerModule }                                                               from '@angular/material/datepicker';
import { MatNativeDateModule }                                                               from '@angular/material/core';
import { MatChipsModule }                                                                    from '@angular/material/chips';
import { MatExpansionModule }                                                                from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar }                                                    from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                                          from '@angular/material/progress-spinner';
import { MatProgressBarModule }                                                              from '@angular/material/progress-bar';
import { MatTooltipModule }                                                                  from '@angular/material/tooltip';
import { MatDividerModule }                                                                  from '@angular/material/divider';
import { MatBottomSheetModule }                                                              from '@angular/material/bottom-sheet';
import { MatDialogModule, MatDialog }                                                        from '@angular/material/dialog';
import { switchMap, catchError, tap, finalize }                                              from 'rxjs/operators';
import { of, EMPTY, forkJoin }                                                               from 'rxjs';

import { TracingApiService }                               from '../../../services/tracing-api.service';
import { SyncService }                                     from '../../../services/sync.service';
import { AttachmentService }                               from '../../../services/attachment.service';
import { FlowInstance, FlowStep, FieldDef, StepExecution } from '../../../models/entities';
import { FieldType, StepExecutionStatus, SyncOperation }   from '../../../models/enums';
import { CompleteStepDto }                                 from '../../../models/dtos/complete-step.dto';

interface StepFormField {
    fieldDef: FieldDef;
    value: any;
    isValid: boolean;
    validationErrors: string[];
}

interface WasteEntry {
    qty: number;
    reason: string;
    affectsInventory: boolean;
    evidenceUrl?: string;
    costImpact?: number;
    sku?: string;
    lot?: string;
}

interface OrderLink {
    mode: 'LINKED' | 'CREATED';
    orderId: string;
}

@Component({
    selector       : 'app-step-runner',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatExpansionModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatDividerModule,
        MatBottomSheetModule,
        MatDialogModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="step-runner-container min-h-screen">
      <!-- Mobile-First Header -->
            <div class="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center space-x-3">
            <button mat-icon-button (click)="goBack()" matTooltip="Volver">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="min-w-0 flex-1">
              <h1 class="text-lg font-semibold text-gray-900 truncate">
                {{ currentStep()?.name || 'Cargando paso...' }}
              </h1>
              <p class="text-sm text-gray-600 truncate">
                {{ instance()?.template?.name || 'Instancia de flujo' }}
              </p>
            </div>
          </div>
          
          <!-- Sync Status -->
          <div class="flex items-center space-x-2">
            @if (!syncService.isOnline()) {
              <mat-icon class="text-orange-500 text-xl" matTooltip="Modo offline">cloud_off</mat-icon>
            }
            @if (syncService.isSyncing()) {
              <mat-icon class="text-blue-500 text-xl animate-spin" matTooltip="Sincronizando">sync</mat-icon>
            }
          </div>
        </div>
        
        <!-- Progress Bar -->
        @if (stepProgress()) {
          <mat-progress-bar 
            mode="determinate" 
            [value]="stepProgress()!.percentage"
            class="h-1">
          </mat-progress-bar>
        }
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- Step Content -->
      @if (!isLoading() && currentStep()) {
        <div class="p-4 space-y-4">
          <!-- Step Info Card -->
          <mat-card class="step-info-card">
            <mat-card-content class="p-4">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <mat-icon class="text-blue-600">{{ getStepIcon() }}</mat-icon>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h2 class="text-lg font-medium text-gray-900">{{ currentStep()!.name }}</h2>
                  @if (currentStep()!.description) {
                    <p class="text-sm text-gray-600 mt-1">{{ currentStep()!.description }}</p>
                  }
                  <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Paso {{ currentStep()!.order }}</span>
                    <span>•</span>
                    <span>{{ getStepTypeLabel() }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Dynamic Form -->
          <form [formGroup]="stepForm" class="space-y-4">
            <!-- Field Categories -->
            @for (category of fieldCategories(); track category.id) {
              <mat-card class="category-card">
                <mat-card-header class="pb-2">
                  <mat-card-title class="text-base">{{ category.name }}</mat-card-title>
                </mat-card-header>
                <mat-card-content class="space-y-4">
                  @for (field of getFieldsByCategory(category.id); track field.fieldDef.id) {
                    <div class="field-container">
                      <!-- Text Field -->
                      @if (field.fieldDef.type === 'TEXT') {
                        <mat-form-field class="w-full">
                          <mat-label>{{ field.fieldDef.label }}</mat-label>
                          <input matInput 
                                 [formControlName]="field.fieldDef.key"
                                 [placeholder]="field.fieldDef.configJson?.placeholder || ''"
                                 [required]="field.fieldDef.required">
                          @if (field.fieldDef.description) {
                            <mat-hint>{{ field.fieldDef.description }}</mat-hint>
                          }
                        </mat-form-field>
                      }

                      <!-- Number Field -->
                      @if (field.fieldDef.type === 'NUMBER') {
                        <mat-form-field class="w-full">
                          <mat-label>{{ field.fieldDef.label }}</mat-label>
                          <input matInput 
                                 type="number"
                                 [formControlName]="field.fieldDef.key"
                                 [min]="field.fieldDef.configJson?.min"
                                 [max]="field.fieldDef.configJson?.max"
                                 [required]="field.fieldDef.required">
                          @if (field.fieldDef.description) {
                            <mat-hint>{{ field.fieldDef.description }}</mat-hint>
                          }
                        </mat-form-field>
                      }

                      <!-- Date Field -->
                      @if (field.fieldDef.type === 'DATE') {
                        <mat-form-field class="w-full">
                          <mat-label>{{ field.fieldDef.label }}</mat-label>
                          <input matInput 
                                 [matDatepicker]="picker"
                                 [formControlName]="field.fieldDef.key"
                                 [required]="field.fieldDef.required">
                          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                          <mat-datepicker #picker></mat-datepicker>
                          @if (field.fieldDef.description) {
                            <mat-hint>{{ field.fieldDef.description }}</mat-hint>
                          }
                        </mat-form-field>
                      }

                      <!-- Boolean Field -->
                      @if (field.fieldDef.type === 'BOOLEAN') {
                        <div class="flex items-center space-x-3 py-2">
                          <mat-checkbox [formControlName]="field.fieldDef.key">
                            {{ field.fieldDef.label }}
                          </mat-checkbox>
                          @if (field.fieldDef.description) {
                            <mat-icon matTooltip="{{ field.fieldDef.description }}" class="text-gray-400">help</mat-icon>
                          }
                        </div>
                      }

                      <!-- Select Single -->
                      @if (field.fieldDef.type === 'SELECT') {
                        <mat-form-field class="w-full">
                          <mat-label>{{ field.fieldDef.label }}</mat-label>
                          <mat-select [formControlName]="field.fieldDef.key" [required]="field.fieldDef.required">
                            @for (option of field.fieldDef.configJson?.options || []; track option.value) {
                              <mat-option [value]="option.value">{{ option.label }}</mat-option>
                            }
                          </mat-select>
                          @if (field.fieldDef.description) {
                            <mat-hint>{{ field.fieldDef.description }}</mat-hint>
                          }
                        </mat-form-field>
                      }

                      <!-- Textarea -->
                      @if (field.fieldDef.type === 'TEXTAREA') {
                        <mat-form-field class="w-full">
                          <mat-label>{{ field.fieldDef.label }}</mat-label>
                          <textarea matInput 
                                   [formControlName]="field.fieldDef.key"
                                   [placeholder]="field.fieldDef.configJson?.placeholder || ''"
                                   [required]="field.fieldDef.required"
                                   rows="3">
                          </textarea>
                          @if (field.fieldDef.description) {
                            <mat-hint>{{ field.fieldDef.description }}</mat-hint>
                          }
                        </mat-form-field>
                      }

                      <!-- File Upload -->
                      @if (field.fieldDef.type === 'FILE') {
                        <div class="file-upload-field">
                          <label class="block text-sm font-medium text-gray-700 mb-2">
                            {{ field.fieldDef.label }}
                            @if (field.fieldDef.required) {
                              <span class="text-red-500">*</span>
                            }
                          </label>
                          
                          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <input #fileInput 
                                   type="file" 
                                   class="hidden" 
                                   (change)="onFileSelected($event, field.fieldDef.key)"
                                   [accept]="getAcceptedFileTypes()"
                                   [multiple]="field.fieldDef.configJson?.multiple || false">
                            
                            <button type="button" 
                                    mat-button 
                                    (click)="fileInput.click()"
                                    class="w-full">
                              <mat-icon>cloud_upload</mat-icon>
                              Seleccionar Archivos
                            </button>
                            
                            @if (field.fieldDef.description) {
                              <p class="text-xs text-gray-500 mt-2">{{ field.fieldDef.description }}</p>
                            }
                          </div>
                          
                          <!-- File List -->
                          @if (getUploadedFiles(field.fieldDef.key).length > 0) {
                            <div class="mt-2 space-y-1">
                              @for (file of getUploadedFiles(field.fieldDef.key); track file.name) {
                                  <div class="flex items-center justify-between p-2 rounded">
                                  <div class="flex items-center space-x-2">
                                    <mat-icon class="text-gray-400">attach_file</mat-icon>
                                    <span class="text-sm truncate">{{ file.name }}</span>
                                  </div>
                                  <button type="button" 
                                          mat-icon-button 
                                          (click)="removeFile(field.fieldDef.key, file)"
                                          class="text-red-500">
                                    <mat-icon>close</mat-icon>
                                  </button>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }

            <!-- Waste Registration -->
            <mat-card class="waste-card">
              <mat-card-header>
                <mat-card-title class="text-base flex items-center space-x-2">
                  <mat-icon class="text-orange-600">warning</mat-icon>
                  <span>Registro de Mermas</span>
                </mat-card-title>
              </mat-card-header>
              <mat-card-content class="space-y-4">
                @for (waste of wasteEntries(); track $index) {
                  <div class="waste-entry p-3 border rounded">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <mat-form-field>
                        <mat-label>Cantidad</mat-label>
                        <input matInput type="number" [(ngModel)]="waste.qty" [ngModelOptions]="{standalone: true}" min="0">
                      </mat-form-field>
                      
                      <mat-form-field>
                        <mat-label>Motivo</mat-label>
                        <input matInput [(ngModel)]="waste.reason" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>
                      
                      <div class="sm:col-span-2">
                        <mat-checkbox [(ngModel)]="waste.affectsInventory" [ngModelOptions]="{standalone: true}">
                          Afecta inventario
                        </mat-checkbox>
                      </div>
                    </div>
                    
                    <div class="flex justify-end mt-2">
                      <button type="button" mat-icon-button (click)="removeWasteEntry($index)" class="text-red-500">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }
                
                <button type="button" mat-button (click)="addWasteEntry()" class="w-full">
                  <mat-icon>add</mat-icon>
                  Agregar Merma
                </button>
              </mat-card-content>
            </mat-card>
          </form>

          <!-- Action Buttons -->
            <div class="sticky bottom-0 bg-card border-t p-4 space-y-2">
            <!-- Validation Summary -->
            @if (hasValidationErrors()) {
              <div class="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <div class="flex items-center space-x-2">
                  <mat-icon class="text-red-500">error</mat-icon>
                  <span class="text-sm font-medium text-red-800">Hay errores en el formulario</span>
                </div>
                <ul class="text-xs text-red-600 mt-1 ml-6">
                  @for (error of getValidationErrors(); track error) {
                    <li>{{ error }}</li>
                  }
                </ul>
              </div>
            }
            
            <!-- Primary Actions -->
            <div class="flex space-x-2">
              <button mat-button 
                      (click)="saveDraft()" 
                      [disabled]="isSaving()"
                      class="flex-1">
                <mat-icon>save</mat-icon>
                Guardar Borrador
              </button>
              
              <button mat-raised-button 
                      color="primary"
                      (click)="completeStep()" 
                      [disabled]="isSaving() || hasValidationErrors()"
                      class="flex-1">
                @if (isSaving()) {
                  <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                }
                <mat-icon>check</mat-icon>
                Completar Paso
              </button>
            </div>
            
            <!-- Secondary Actions -->
            <div class="flex justify-center">
              <button mat-button (click)="skipStep()" [disabled]="isSaving()" class="text-gray-600">
                <mat-icon>skip_next</mat-icon>
                Saltar Paso
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles         : [ `
    .step-runner-container {
      max-width: 768px;
      margin: 0 auto;
    }

    .step-info-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .step-info-card .mat-mdc-card-content {
      color: white;
    }

    .category-card {
      border-left: 4px solid #3b82f6;
    }

    .waste-card {
      border-left: 4px solid #f59e0b;
    }

    .field-container {
      position: relative;
    }

    .file-upload-field {
      margin: 16px 0;
    }

    .waste-entry {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    /* Mobile optimizations */
    @media (max-width: 640px) {
      .step-runner-container {
        padding: 0;
      }
      
      .grid {
        grid-template-columns: 1fr;
      }
    }

    /* PWA-friendly touch targets */
    button {
      min-height: 44px;
    }

    .mat-mdc-form-field {
      width: 100%;
    }
  ` ]
})
export class StepRunnerComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    private readonly api = inject(TracingApiService);
    public readonly syncService = inject(SyncService);
    private readonly attachmentService = inject(AttachmentService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly instance = signal<FlowInstance | null>(null);
    public readonly currentStep = signal<FlowStep | null>(null);
    public readonly stepExecution = signal<StepExecution | null>(null);
    public readonly fieldCategories = signal<any[]>([]);
    public readonly stepFields = signal<StepFormField[]>([]);
    public readonly wasteEntries = signal<WasteEntry[]>([]);
    public readonly isLoading = signal(false);
    public readonly isSaving = signal(false);
    public readonly stepProgress = signal<{ percentage: number; current: number; total: number } | null>(null);

    // Form
    public stepForm: FormGroup;
    private uploadedFiles: Map<string, File[]> = new Map();

    // Route params
    private instanceId: string = '';
    private stepId: string = '';

    constructor() {
        this.stepForm = this.fb.group({});
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(
            switchMap(params => {
                this.instanceId = params.get('instanceId') || '';
                this.stepId = params.get('stepId') || '';

                if (this.instanceId && this.stepId) {
                    return this.loadStepData();
                }
                return of(null);
            })
        ).subscribe();
    }

    private loadStepData() {
        this.isLoading.set(true);

        return forkJoin({
            instance     : this.api.getInstance(this.instanceId),
            stepForm     : this.api.getStepForm(this.instanceId, this.stepId),
            stepExecution: this.api.getStepExecution(`${ this.instanceId }-${ this.stepId }`)
        }).pipe(
            tap(({instance, stepForm, stepExecution}) => {
                this.instance.set(instance);
                this.stepExecution.set(stepExecution);

                // Mock step data
                const mockStep: FlowStep = {
                    id           : this.stepId,
                    flowVersionId: instance.templateId,
                    key          : 'sample_step',
                    name         : 'Verificación de Calidad',
                    type         : 'STANDARD' as any,
                    position     : {x: 0, y: 0},
                    order        : 1,
                    description  : 'Verificar que el producto cumple con los estándares de calidad',
                    createdAt    : new Date(),
                    updatedAt    : new Date()
                };

                this.currentStep.set(mockStep);

                // Mock field categories and fields
                const mockCategories = [
                    {id: 'cat-1', name: 'Información General', order: 1},
                    {id: 'cat-2', name: 'Mediciones', order: 2}
                ];

                const mockFields: StepFormField[] = [
                    {
                        fieldDef        : {
                            id        : 'field-1',
                            stepId    : this.stepId,
                            categoryId: 'cat-1',
                            key       : 'responsable',
                            label     : 'Responsable',
                            type      : FieldType.TEXT,
                            required  : true,
                            configJson: {},
                            order     : 1,
                            createdAt : new Date(),
                            updatedAt : new Date()
                        },
                        value           : '',
                        isValid         : false,
                        validationErrors: []
                    },
                    {
                        fieldDef        : {
                            id        : 'field-2',
                            stepId    : this.stepId,
                            categoryId: 'cat-2',
                            key       : 'temperatura',
                            label     : 'Temperatura (°C)',
                            type      : FieldType.NUMBER,
                            required  : true,
                            configJson: {min: -10, max: 50},
                            order     : 2,
                            createdAt : new Date(),
                            updatedAt : new Date()
                        },
                        value           : null,
                        isValid         : false,
                        validationErrors: []
                    }
                ];

                this.fieldCategories.set(mockCategories);
                this.stepFields.set(mockFields);
                this.buildDynamicForm();

                // Mock progress
                this.stepProgress.set({
                    percentage: 60,
                    current   : 3,
                    total     : 5
                });

                this.isLoading.set(false);
            }),
            catchError(error => {
                console.error('Error loading step data:', error);
                this.snackBar.open('Error al cargar los datos del paso', 'Cerrar', {duration: 5000});
                this.isLoading.set(false);
                return EMPTY;
            })
        );
    }

    private buildDynamicForm(): void {
        const formControls: any = {};

        this.stepFields().forEach(field => {
            const validators = [];
            if (field.fieldDef.required) {
                validators.push(Validators.required);
            }

            if (field.fieldDef.type === FieldType.NUMBER) {
                if (field.fieldDef.configJson?.min !== undefined) {
                    validators.push(Validators.min(field.fieldDef.configJson.min));
                }
                if (field.fieldDef.configJson?.max !== undefined) {
                    validators.push(Validators.max(field.fieldDef.configJson.max));
                }
            }

            formControls[field.fieldDef.key] = [ field.value, validators ];
        });

        this.stepForm = this.fb.group(formControls);
    }

    public getFieldsByCategory(categoryId: string): StepFormField[] {
        return this.stepFields().filter(field => field.fieldDef.categoryId === categoryId);
    }

    public getStepIcon(): string {
        const stepType = this.currentStep()?.type;
        switch (stepType) {
            case 'GATE':
                return 'alt_route';
            case 'END':
                return 'flag';
            default:
                return 'radio_button_unchecked';
        }
    }

    public getStepTypeLabel(): string {
        const stepType = this.currentStep()?.type;
        switch (stepType) {
            case 'GATE':
                return 'Puerta de Decisión';
            case 'END':
                return 'Paso Final';
            default:
                return 'Paso Estándar';
        }
    }

    public onFileSelected(event: any, fieldKey: string): void {
        const files = Array.from(event.target.files) as File[];
        if (files.length > 0) {
            this.uploadedFiles.set(fieldKey, files);

            // Upload files
            this.attachmentService.uploadFiles(files, {
                compress       : true,
                stepExecutionId: this.stepExecution()?.id
            }).subscribe({
                next : (urls) => {
                    this.snackBar.open(`${ files.length } archivo(s) subido(s) exitosamente`, 'Cerrar', {duration: 3000});
                },
                error: (error) => {
                    console.error('Error uploading files:', error);
                    this.snackBar.open('Error al subir archivos', 'Cerrar', {duration: 5000});
                }
            });
        }
    }

    public getUploadedFiles(fieldKey: string): File[] {
        return this.uploadedFiles.get(fieldKey) || [];
    }

    public removeFile(fieldKey: string, file: File): void {
        const files = this.uploadedFiles.get(fieldKey) || [];
        const updatedFiles = files.filter(f => f !== file);
        this.uploadedFiles.set(fieldKey, updatedFiles);
    }

    public getAcceptedFileTypes(): string {
        return 'image/*,application/pdf,.doc,.docx';
    }

    public addWasteEntry(): void {
        const newWaste: WasteEntry = {
            qty             : 0,
            reason          : '',
            affectsInventory: false
        };
        this.wasteEntries.set([ ...this.wasteEntries(), newWaste ]);
    }

    public removeWasteEntry(index: number): void {
        const wastes = this.wasteEntries().filter((_, i) => i !== index);
        this.wasteEntries.set(wastes);
    }

    public hasValidationErrors(): boolean {
        return this.stepForm.invalid;
    }

    public getValidationErrors(): string[] {
        const errors: string[] = [];

        Object.keys(this.stepForm.controls).forEach(key => {
            const control = this.stepForm.get(key);
            if (control?.errors) {
                const field = this.stepFields().find(f => f.fieldDef.key === key);
                const fieldLabel = field?.fieldDef.label || key;

                if (control.errors['required']) {
                    errors.push(`${ fieldLabel } es requerido`);
                }
                if (control.errors['min']) {
                    errors.push(`${ fieldLabel } debe ser mayor a ${ control.errors['min'].min }`);
                }
                if (control.errors['max']) {
                    errors.push(`${ fieldLabel } debe ser menor a ${ control.errors['max'].max }`);
                }
            }
        });

        return errors;
    }

    public saveDraft(): void {
        const formData = this.stepForm.value;

        // Save to local storage for offline support
        this.syncService.saveDraft('step-execution', `${ this.instanceId }-${ this.stepId }`, {
            formData,
            wasteEntries: this.wasteEntries(),
            timestamp   : new Date()
        }).subscribe(() => {
            this.snackBar.open('Borrador guardado localmente', 'Cerrar', {duration: 3000});
        });
    }

    public completeStep(): void {
        if (this.stepForm.valid) {
            this.isSaving.set(true);

            const dto: CompleteStepDto = {
                actorId        : 'current-user-id', // TODO: Get actual user ID from auth service
                fieldValues    : Object.keys(this.stepForm.value).map(key => ({
                    fieldKey: key,
                    value   : this.stepForm.value[key]
                })),
                wastes         : this.wasteEntries().filter(w => w.qty > 0),
                completionNotes: 'Completado desde mobile app'
            };

            // Try to complete online first, fallback to offline queue
            this.api.completeStep(this.instanceId, this.stepId, dto).pipe(
                catchError(error => {
                    // Queue for offline sync
                    return this.syncService.queueChange(
                        'step-execution',
                        `${ this.instanceId }-${ this.stepId }`,
                        SyncOperation.UPDATE,
                        dto
                    );
                }),
                finalize(() => this.isSaving.set(false))
            ).subscribe({
                next : () => {
                    this.snackBar.open('Paso completado exitosamente', 'Cerrar', {duration: 3000});
                    this.goToNextStep();
                },
                error: (error) => {
                    console.error('Error completing step:', error);
                    this.snackBar.open('Error al completar el paso', 'Cerrar', {duration: 5000});
                }
            });
        }
    }

    public skipStep(): void {
        if (confirm('¿Estás seguro de que quieres saltar este paso?')) {
            const reason = prompt('Motivo para saltar el paso:');
            if (reason) {
                this.api.skipStep(this.instanceId, this.stepId, 'current-user-id', reason).subscribe({
                    next : () => {
                        this.snackBar.open('Paso saltado', 'Cerrar', {duration: 3000});
                        this.goToNextStep();
                    },
                    error: (error) => {
                        console.error('Error skipping step:', error);
                        this.snackBar.open('Error al saltar el paso', 'Cerrar', {duration: 5000});
                    }
                });
            }
        }
    }

    private goToNextStep(): void {
        // Navigate to next step or instance detail
        this.router.navigate([ '/tracing/execution/instances', this.instanceId ]);
    }

    public goBack(): void {
        this.router.navigate([ '/tracing/execution/instances', this.instanceId ]);
    }
}
