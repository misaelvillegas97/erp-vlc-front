import { Component, OnInit, inject, signal, ChangeDetectionStrategy }                      from '@angular/core';
import { CommonModule }                                                                    from '@angular/common';
import { RouterModule, ActivatedRoute, Router }                                            from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule }                                                                 from '@angular/material/button';
import { MatCardModule }                                                                   from '@angular/material/card';
import { MatFormFieldModule }                                                              from '@angular/material/form-field';
import { MatInputModule }                                                                  from '@angular/material/input';
import { MatSelectModule }                                                                 from '@angular/material/select';
import { MatIconModule }                                                                   from '@angular/material/icon';
import { MatChipsModule }                                                                  from '@angular/material/chips';
import { MatCheckboxModule }                                                               from '@angular/material/checkbox';
import { MatSlideToggleModule }                                                            from '@angular/material/slide-toggle';
import { MatTabsModule }                                                                   from '@angular/material/tabs';
import { MatExpansionModule }                                                              from '@angular/material/expansion';
import { MatDialogModule, MatDialog }                                                      from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar }                                                  from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                                        from '@angular/material/progress-spinner';
import { MatTooltipModule }                                                                from '@angular/material/tooltip';
import { MatDividerModule }                                                                from '@angular/material/divider';
import { MatMenuModule }                                                                   from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray }                                    from '@angular/cdk/drag-drop';
import { switchMap, catchError, tap }                                                      from 'rxjs/operators';
import { of, EMPTY, combineLatest }                                                        from 'rxjs';

import { TracingApiService }                              from '../../../services/tracing-api.service';
import { FlowVersion, FlowStep, FieldCategory, FieldDef } from '../../../models/entities';
import { StepType, FieldType }                            from '../../../models/enums';

interface StepFormData {
    key: string;
    name: string;
    type: StepType;
    description?: string;
    order: number;
    position: { x: number; y: number };
}

interface FieldFormData {
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    description?: string;
    categoryId?: string;
    order: number;
    config: {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: string;
        options?: Array<{ value: string; label: string }>;
        multiple?: boolean;
        placeholder?: string;
        helpText?: string;
    };
}

@Component({
    selector       : 'app-step-editor',
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
        MatChipsModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatExpansionModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatDividerModule,
        MatMenuModule,
        DragDropModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="step-editor-container p-4 sm:p-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div class="flex items-center space-x-4">
                    <button mat-icon-button [routerLink]="getBackRoute()" matTooltip="Volver al canvas">
                        <mat-icon>arrow_back</mat-icon>
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Editor de Paso</h1>
                        <p class="text-gray-600 mt-1">{{ step()?.name || 'Configurando paso...' }}</p>
                    </div>
                </div>

                <div class="flex space-x-2">
                    <button mat-button (click)="previewForm()" [disabled]="!hasFields()">
                        <mat-icon>visibility</mat-icon>
                        Vista Previa
                    </button>

                    <button mat-raised-button color="primary" (click)="saveStep()" [disabled]="isSaving() || stepForm.invalid">
                        <mat-icon>save</mat-icon>
                        Guardar Paso
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            @if (isLoading()) {
                <div class="flex justify-center items-center py-12">
                    <mat-spinner diameter="40"></mat-spinner>
                </div>
            }

            <!-- Step Editor Content -->
            @if (!isLoading()) {
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Step Properties Panel -->
                    <div class="lg:col-span-1">
                        <mat-card class="step-properties-card">
                            <mat-card-header>
                                <mat-card-title class="flex items-center space-x-2">
                                    <mat-icon>settings</mat-icon>
                                    <span>Propiedades del Paso</span>
                                </mat-card-title>
                            </mat-card-header>

                            <mat-card-content class="p-4">
                                <form [formGroup]="stepForm" class="space-y-4">
                                    <mat-form-field class="w-full">
                                        <mat-label>Clave del paso</mat-label>
                                        <input matInput formControlName="key" placeholder="ej: verificacion_calidad">
                                        <mat-hint>Identificador único del paso (sin espacios)</mat-hint>
                                    </mat-form-field>

                                    <mat-form-field class="w-full">
                                        <mat-label>Nombre del paso</mat-label>
                                        <input matInput formControlName="name" placeholder="ej: Verificación de Calidad">
                                    </mat-form-field>

                                    <mat-form-field class="w-full">
                                        <mat-label>Tipo de paso</mat-label>
                                        <mat-select formControlName="type">
                                            <mat-option value="STANDARD">Paso Estándar</mat-option>
                                            <mat-option value="GATE">Puerta de Decisión</mat-option>
                                            <mat-option value="END">Paso Final</mat-option>
                                        </mat-select>
                                    </mat-form-field>

                                    <mat-form-field class="w-full">
                                        <mat-label>Descripción (opcional)</mat-label>
                                        <textarea matInput formControlName="description" rows="3"
                                                  placeholder="Describe qué se debe hacer en este paso..."></textarea>
                                    </mat-form-field>

                                    <mat-form-field class="w-full">
                                        <mat-label>Orden</mat-label>
                                        <input matInput type="number" formControlName="order" min="1">
                                        <mat-hint>Orden de ejecución del paso</mat-hint>
                                    </mat-form-field>
                                </form>
                            </mat-card-content>
                        </mat-card>

                        <!-- Categories Panel -->
                        <mat-card class="mt-4">
                            <mat-card-header>
                                <mat-card-title class="flex items-center justify-between w-full">
                                    <div class="flex items-center space-x-2">
                                        <mat-icon>folder</mat-icon>
                                        <span>Categorías de Campos</span>
                                    </div>
                                    <button mat-icon-button (click)="addCategory()" matTooltip="Agregar categoría">
                                        <mat-icon>add</mat-icon>
                                    </button>
                                </mat-card-title>
                            </mat-card-header>

                            <mat-card-content class="p-4">
                                <div cdkDropList (cdkDropListDropped)="onCategoryDrop($event)" class="space-y-2">
                                    @for (category of categories(); track category.id) {
                                        <div class="category-item p-3 border rounded flex items-center justify-between" cdkDrag>
                                            <div class="flex items-center space-x-2">
                                                <mat-icon cdkDragHandle class="cursor-move text-gray-400">drag_handle</mat-icon>
                                                <span class="font-medium">{{ category.name }}</span>
                                            </div>

                                            <div class="flex items-center space-x-1">
                                                <button mat-icon-button (click)="editCategory(category)" matTooltip="Editar">
                                                    <mat-icon class="text-sm">edit</mat-icon>
                                                </button>
                                                <button mat-icon-button (click)="deleteCategory(category)" matTooltip="Eliminar">
                                                    <mat-icon class="text-sm text-red-600">delete</mat-icon>
                                                </button>
                                            </div>
                                        </div>
                                    }
                                </div>

                                @if (categories().length === 0) {
                                    <div class="text-center py-4 text-gray-500">
                                        <mat-icon class="text-4xl mb-2">folder_open</mat-icon>
                                        <p>No hay categorías</p>
                                        <button mat-button color="primary" (click)="addCategory()">
                                            Agregar Primera Categoría
                                        </button>
                                    </div>
                                }
                            </mat-card-content>
                        </mat-card>
                    </div>

                    <!-- Fields Editor Panel -->
                    <div class="lg:col-span-2">
                        <mat-card class="fields-editor-card">
                            <mat-card-header>
                                <mat-card-title class="flex items-center justify-between w-full">
                                    <div class="flex items-center space-x-2">
                                        <mat-icon>dynamic_form</mat-icon>
                                        <span>Campos del Formulario</span>
                                    </div>
                                    <button mat-raised-button color="accent" (click)="addField()">
                                        <mat-icon>add</mat-icon>
                                        Agregar Campo
                                    </button>
                                </mat-card-title>
                            </mat-card-header>

                            <mat-card-content class="p-4">
                                <!-- Fields List -->
                                <div cdkDropList (cdkDropListDropped)="onFieldDrop($event)" class="space-y-4">
                                    @for (field of fields(); track field.id || $index) {
                                        <mat-expansion-panel class="field-panel" cdkDrag>
                                            <mat-expansion-panel-header>
                                                <mat-panel-title class="flex items-center space-x-2">
                                                    <mat-icon cdkDragHandle class="cursor-move text-gray-400">drag_handle</mat-icon>
                                                    <mat-icon [class]="getFieldTypeIconClass(field.type)">
                                                        {{ getFieldTypeIcon(field.type) }}
                                                    </mat-icon>
                                                    <span>{{ field.label || 'Campo sin nombre' }}</span>
                                                    @if (field.required) {
                                                        <mat-chip class="bg-red-100 text-red-800 text-xs">Requerido</mat-chip>
                                                    }
                                                </mat-panel-title>
                                                <mat-panel-description>
                                                    {{ getFieldTypeLabel(field.type) }}
                                                    @if (field.categoryId) {
                                                        • {{ getCategoryName(field.categoryId) }}
                                                    }
                                                </mat-panel-description>
                                            </mat-expansion-panel-header>

                                            <!-- Field Configuration Form -->
                                            <div class="field-config-form p-4 bg-gray-50 rounded">
                                                <form [formGroup]="getFieldForm($index)" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <!-- Basic Properties -->
                                                    <mat-form-field class="w-full">
                                                        <mat-label>Clave del campo</mat-label>
                                                        <input matInput formControlName="key" placeholder="ej: temperatura">
                                                    </mat-form-field>

                                                    <mat-form-field class="w-full">
                                                        <mat-label>Etiqueta</mat-label>
                                                        <input matInput formControlName="label" placeholder="ej: Temperatura (°C)">
                                                    </mat-form-field>

                                                    <mat-form-field class="w-full">
                                                        <mat-label>Tipo de campo</mat-label>
                                                        <mat-select formControlName="type" (selectionChange)="onFieldTypeChange($index, $event.value)">
                                                            <mat-option value="TEXT">Texto</mat-option>
                                                            <mat-option value="NUMBER">Número</mat-option>
                                                            <mat-option value="DATE">Fecha</mat-option>
                                                            <mat-option value="BOOLEAN">Sí/No</mat-option>
                                                            <mat-option value="SELECT">Selección Simple</mat-option>
                                                            <mat-option value="MULTI_SELECT">Selección Múltiple</mat-option>
                                                            <mat-option value="USER">Usuario</mat-option>
                                                            <mat-option value="MULTI_USER">Múltiples Usuarios</mat-option>
                                                            <mat-option value="FILE">Archivo</mat-option>
                                                            <mat-option value="TEXTAREA">Área de Texto</mat-option>
                                                        </mat-select>
                                                    </mat-form-field>

                                                    <mat-form-field class="w-full">
                                                        <mat-label>Categoría</mat-label>
                                                        <mat-select formControlName="categoryId">
                                                            <mat-option value="">Sin categoría</mat-option>
                                                            @for (category of categories(); track category.id) {
                                                                <mat-option [value]="category.id">{{ category.name }}</mat-option>
                                                            }
                                                        </mat-select>
                                                    </mat-form-field>

                                                    <!-- Field Options -->
                                                    <div class="md:col-span-2 flex items-center space-x-4">
                                                        <mat-checkbox formControlName="required">Campo requerido</mat-checkbox>
                                                    </div>

                                                    <mat-form-field class="md:col-span-2">
                                                        <mat-label>Descripción/Ayuda</mat-label>
                                                        <textarea matInput formControlName="description" rows="2"
                                                                  placeholder="Texto de ayuda para el usuario..."></textarea>
                                                    </mat-form-field>

                                                    <!-- Type-specific Configuration -->
                                                    @if (field.type === 'TEXT' || field.type === 'TEXTAREA') {
                                                        <mat-form-field class="w-full">
                                                            <mat-label>Longitud mínima</mat-label>
                                                            <input matInput type="number" formControlName="minLength" min="0">
                                                        </mat-form-field>

                                                        <mat-form-field class="w-full">
                                                            <mat-label>Longitud máxima</mat-label>
                                                            <input matInput type="number" formControlName="maxLength" min="1">
                                                        </mat-form-field>

                                                        <mat-form-field class="md:col-span-2">
                                                            <mat-label>Patrón (RegEx)</mat-label>
                                                            <input matInput formControlName="pattern" placeholder="ej: ^[A-Z]{2,3}-\d{4}$">
                                                        </mat-form-field>
                                                    }

                                                    @if (field.type === 'NUMBER') {
                                                        <mat-form-field class="w-full">
                                                            <mat-label>Valor mínimo</mat-label>
                                                            <input matInput type="number" formControlName="min">
                                                        </mat-form-field>

                                                        <mat-form-field class="w-full">
                                                            <mat-label>Valor máximo</mat-label>
                                                            <input matInput type="number" formControlName="max">
                                                        </mat-form-field>
                                                    }

                                                    @if (field.type === 'SELECT' || field.type === 'MULTI_SELECT') {
                                                        <div class="md:col-span-2">
                                                            <label class="block text-sm font-medium text-gray-700 mb-2">Opciones</label>
                                                            <div class="space-y-2">
                                                                @for (option of getFieldOptions($index); track $index) {
                                                                    <div class="flex items-center space-x-2">
                                                                        <mat-form-field class="flex-1">
                                                                            <mat-label>Valor</mat-label>
                                                                            <input matInput [(ngModel)]="option.value" [ngModelOptions]="{standalone: true}">
                                                                        </mat-form-field>
                                                                        <mat-form-field class="flex-1">
                                                                            <mat-label>Etiqueta</mat-label>
                                                                            <input matInput [(ngModel)]="option.label" [ngModelOptions]="{standalone: true}">
                                                                        </mat-form-field>
                                                                        <button mat-icon-button (click)="removeFieldOption($index, option)"
                                                                                matTooltip="Eliminar opción">
                                                                            <mat-icon class="text-red-600">remove</mat-icon>
                                                                        </button>
                                                                    </div>
                                                                }
                                                                <button mat-button (click)="addFieldOption($index)" class="w-full">
                                                                    <mat-icon>add</mat-icon>
                                                                    Agregar Opción
                                                                </button>
                                                            </div>
                                                        </div>
                                                    }

                                                    <!-- Actions -->
                                                    <div class="md:col-span-2 flex justify-end space-x-2 pt-4 border-t">
                                                        <button mat-button (click)="duplicateField($index)">
                                                            <mat-icon>content_copy</mat-icon>
                                                            Duplicar
                                                        </button>
                                                        <button mat-button color="warn" (click)="removeField($index)">
                                                            <mat-icon>delete</mat-icon>
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </mat-expansion-panel>
                                    }
                                </div>

                                <!-- Empty State -->
                                @if (fields().length === 0) {
                                    <div class="text-center py-12">
                                        <mat-icon class="text-6xl text-gray-400 mb-4">dynamic_form</mat-icon>
                                        <h3 class="text-xl font-medium text-gray-900 mb-2">No hay campos configurados</h3>
                                        <p class="text-gray-600 mb-6">Agrega campos para crear el formulario de este paso</p>
                                        <button mat-raised-button color="primary" (click)="addField()">
                                            <mat-icon>add</mat-icon>
                                            Agregar Primer Campo
                                        </button>
                                    </div>
                                }
                            </mat-card-content>
                        </mat-card>
                    </div>
                </div>
            }
        </div>
    `,
    styles         : [ `
    .step-editor-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .step-properties-card,
    .fields-editor-card {
      height: fit-content;
    }

    .category-item {
      transition: all 0.2s ease;
    }

    .category-item:hover {
      background-color: #f9fafb;
    }

    .field-panel {
      border: 1px solid #e5e7eb;
    }

    .field-panel.cdk-drag-preview {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .field-config-form {
      background: #f8fafc;
    }

    @media (max-width: 1024px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  ` ]
})
export class StepEditorComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly version = signal<FlowVersion | null>(null);
    public readonly step = signal<FlowStep | null>(null);
    public readonly categories = signal<FieldCategory[]>([]);
    public readonly fields = signal<FieldFormData[]>([]);
    public readonly isLoading = signal(false);
    public readonly isSaving = signal(false);

    // Forms
    public stepForm: FormGroup;
    public fieldsFormArray: FormArray;

    // Route params
    private versionId: string = '';
    private stepId: string = '';

    constructor() {
        this.stepForm = this.fb.group({
            key        : [ '', [ Validators.required, Validators.pattern(/^[a-z0-9_]+$/) ] ],
            name       : [ '', [ Validators.required, Validators.minLength(3) ] ],
            type       : [ StepType.STANDARD, Validators.required ],
            description: [ '' ],
            order      : [ 1, [ Validators.required, Validators.min(1) ] ]
        });

        this.fieldsFormArray = this.fb.array([]);
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(
            switchMap(params => {
                this.versionId = params.get('versionId') || '';
                this.stepId = params.get('stepId') || '';

                if (this.versionId && this.stepId) {
                    return this.loadStepData();
                }
                return of(null);
            })
        ).subscribe();
    }

    private loadStepData() {
        this.isLoading.set(true);

        // TODO: Load actual step data from API
        // For now, simulate loading
        return combineLatest([
            this.api.getVersion(this.versionId),
            // this.api.getStep(this.stepId),
            // this.api.getFieldCategories(this.versionId),
            // this.api.getFieldDefinitions(this.stepId)
        ]).pipe(
            tap(([ version ]) => {
                this.version.set(version);

                // Simulate step data
                const mockStep: FlowStep = {
                    id           : this.stepId,
                    flowVersionId: this.versionId,
                    key          : 'sample_step',
                    name         : 'Paso de Ejemplo',
                    type         : StepType.STANDARD,
                    position     : {x: 100, y: 100},
                    order        : 1,
                    description  : 'Descripción del paso de ejemplo',
                    createdAt    : new Date(),
                    updatedAt    : new Date()
                };

                this.step.set(mockStep);
                this.populateStepForm(mockStep);

                // Simulate categories
                const mockCategories: FieldCategory[] = [
                    {
                        id           : 'cat-1',
                        flowVersionId: this.versionId,
                        name         : 'Información General',
                        order        : 1,
                        createdAt    : new Date(),
                        updatedAt    : new Date()
                    },
                    {
                        id           : 'cat-2',
                        flowVersionId: this.versionId,
                        name         : 'Mediciones',
                        order        : 2,
                        createdAt    : new Date(),
                        updatedAt    : new Date()
                    }
                ];

                this.categories.set(mockCategories);

                // Simulate fields
                const mockFields: FieldFormData[] = [
                    {
                        key       : 'responsable',
                        label     : 'Responsable',
                        type      : FieldType.USER,
                        required  : true,
                        categoryId: 'cat-1',
                        order     : 1,
                        config    : {}
                    },
                    {
                        key       : 'temperatura',
                        label     : 'Temperatura (°C)',
                        type      : FieldType.NUMBER,
                        required  : true,
                        categoryId: 'cat-2',
                        order     : 2,
                        config    : {
                            min: -10,
                            max: 50
                        }
                    }
                ];

                this.fields.set(mockFields);
                this.buildFieldsForms();

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

    private populateStepForm(step: FlowStep): void {
        this.stepForm.patchValue({
            key        : step.key,
            name       : step.name,
            type       : step.type,
            description: step.description,
            order      : step.order
        });
    }

    private buildFieldsForms(): void {
        this.fieldsFormArray.clear();

        this.fields().forEach(field => {
            const fieldForm = this.fb.group({
                key        : [ field.key, [ Validators.required, Validators.pattern(/^[a-z0-9_]+$/) ] ],
                label      : [ field.label, Validators.required ],
                type       : [ field.type, Validators.required ],
                required   : [ field.required ],
                description: [ field.description ],
                categoryId : [ field.categoryId ],
                order      : [ field.order, [ Validators.required, Validators.min(1) ] ],
                minLength  : [ field.config.minLength ],
                maxLength  : [ field.config.maxLength ],
                min        : [ field.config.min ],
                max        : [ field.config.max ],
                pattern    : [ field.config.pattern ],
                options    : [ field.config.options || [] ]
            });

            this.fieldsFormArray.push(fieldForm);
        });
    }

    // Navigation
    public getBackRoute(): string {
        return `/tracing/builder/version/${ this.versionId }`;
    }

    // Step Operations
    public saveStep(): void {
        if (this.stepForm.valid) {
            this.isSaving.set(true);

            // TODO: Implement actual save logic
            setTimeout(() => {
                this.isSaving.set(false);
                this.snackBar.open('Paso guardado exitosamente', 'Cerrar', {duration: 3000});
            }, 1000);
        }
    }

    public previewForm(): void {
        // TODO: Open form preview dialog
        this.snackBar.open('Vista previa próximamente', 'Cerrar', {duration: 3000});
    }

    public hasFields(): boolean {
        return this.fields().length > 0;
    }

    // Category Operations
    public addCategory(): void {
        const name = prompt('Nombre de la nueva categoría:');
        if (name && name.trim()) {
            const newCategory: FieldCategory = {
                id           : `cat-${ Date.now() }`,
                flowVersionId: this.versionId,
                name         : name.trim(),
                order        : this.categories().length + 1,
                createdAt    : new Date(),
                updatedAt    : new Date()
            };

            this.categories.set([ ...this.categories(), newCategory ]);
        }
    }

    public editCategory(category: FieldCategory): void {
        const newName = prompt('Nuevo nombre de la categoría:', category.name);
        if (newName && newName.trim() && newName !== category.name) {
            const updatedCategories = this.categories().map(cat =>
                cat.id === category.id ? {...cat, name: newName.trim()} : cat
            );
            this.categories.set(updatedCategories);
        }
    }

    public deleteCategory(category: FieldCategory): void {
        if (confirm(`¿Estás seguro de eliminar la categoría "${ category.name }"?`)) {
            const updatedCategories = this.categories().filter(cat => cat.id !== category.id);
            this.categories.set(updatedCategories);

            // Remove category from fields
            const updatedFields = this.fields().map(field =>
                field.categoryId === category.id ? {...field, categoryId: undefined} : field
            );
            this.fields.set(updatedFields);
            this.buildFieldsForms();
        }
    }

    public onCategoryDrop(event: CdkDragDrop<FieldCategory[]>): void {
        const categories = [ ...this.categories() ];
        moveItemInArray(categories, event.previousIndex, event.currentIndex);

        // Update order
        categories.forEach((cat, index) => {
            cat.order = index + 1;
        });

        this.categories.set(categories);
    }

    // Field Operations
    public addField(): void {
        const newField: FieldFormData = {
            key     : `field_${ Date.now() }`,
            label   : 'Nuevo Campo',
            type    : FieldType.TEXT,
            required: false,
            order   : this.fields().length + 1,
            config  : {}
        };

        this.fields.set([ ...this.fields(), newField ]);
        this.buildFieldsForms();
    }

    public removeField(index: number): void {
        if (confirm('¿Estás seguro de eliminar este campo?')) {
            const updatedFields = this.fields().filter((_, i) => i !== index);
            this.fields.set(updatedFields);
            this.buildFieldsForms();
        }
    }

    public duplicateField(index: number): void {
        const originalField = this.fields()[index];
        const duplicatedField: FieldFormData = {
            ...originalField,
            key  : `${ originalField.key }_copy`,
            label: `${ originalField.label } (Copia)`,
            order: this.fields().length + 1
        };

        this.fields.set([ ...this.fields(), duplicatedField ]);
        this.buildFieldsForms();
    }

    public onFieldDrop(event: CdkDragDrop<FieldFormData[]>): void {
        const fields = [ ...this.fields() ];
        moveItemInArray(fields, event.previousIndex, event.currentIndex);

        // Update order
        fields.forEach((field, index) => {
            field.order = index + 1;
        });

        this.fields.set(fields);
        this.buildFieldsForms();
    }

    public onFieldTypeChange(index: number, newType: FieldType): void {
        const fields = [ ...this.fields() ];
        fields[index] = {
            ...fields[index],
            type  : newType,
            config: {} // Reset config when type changes
        };

        this.fields.set(fields);
        this.buildFieldsForms();
    }

    // Field Form Helpers
    public getFieldForm(index: number): FormGroup {
        return this.fieldsFormArray.at(index) as FormGroup;
    }

    public getFieldOptions(index: number): Array<{ value: string; label: string }> {
        const field = this.fields()[index];
        return field.config.options || [];
    }

    public addFieldOption(index: number): void {
        const fields = [ ...this.fields() ];
        const field = fields[index];

        if (!field.config.options) {
            field.config.options = [];
        }

        field.config.options.push({value: '', label: ''});
        this.fields.set(fields);
    }

    public removeFieldOption(fieldIndex: number, option: { value: string; label: string }): void {
        const fields = [ ...this.fields() ];
        const field = fields[fieldIndex];

        if (field.config.options) {
            field.config.options = field.config.options.filter(opt => opt !== option);
        }

        this.fields.set(fields);
    }

    // Helper Methods
    public getCategoryName(categoryId: string): string {
        const category = this.categories().find(cat => cat.id === categoryId);
        return category?.name || 'Sin categoría';
    }

    public getFieldTypeIcon(type: FieldType): string {
        switch (type) {
            case FieldType.TEXT:
                return 'text_fields';
            case FieldType.NUMBER:
                return 'numbers';
            case FieldType.DATE:
                return 'calendar_today';
            case FieldType.BOOLEAN:
                return 'check_box';
            case FieldType.SELECT:
                return 'radio_button_checked';
            case FieldType.MULTI_SELECT:
                return 'checklist';
            case FieldType.USER:
                return 'person';
            case FieldType.MULTI_USER:
                return 'group';
            case FieldType.FILE:
                return 'attach_file';
            case FieldType.TEXTAREA:
                return 'notes';
            default:
                return 'help';
        }
    }

    public getFieldTypeIconClass(type: FieldType): string {
        switch (type) {
            case FieldType.TEXT:
            case FieldType.TEXTAREA:
                return 'text-blue-600';
            case FieldType.NUMBER:
                return 'text-green-600';
            case FieldType.DATE:
                return 'text-purple-600';
            case FieldType.BOOLEAN:
                return 'text-orange-600';
            case FieldType.SELECT:
            case FieldType.MULTI_SELECT:
                return 'text-indigo-600';
            case FieldType.USER:
            case FieldType.MULTI_USER:
                return 'text-pink-600';
            case FieldType.FILE:
                return 'text-gray-600';
            default:
                return 'text-gray-400';
        }
    }

    public getFieldTypeLabel(type: FieldType): string {
        switch (type) {
            case FieldType.TEXT:
                return 'Texto';
            case FieldType.NUMBER:
                return 'Número';
            case FieldType.DATE:
                return 'Fecha';
            case FieldType.BOOLEAN:
                return 'Sí/No';
            case FieldType.SELECT:
                return 'Selección Simple';
            case FieldType.MULTI_SELECT:
                return 'Selección Múltiple';
            case FieldType.USER:
                return 'Usuario';
            case FieldType.MULTI_USER:
                return 'Múltiples Usuarios';
            case FieldType.FILE:
                return 'Archivo';
            case FieldType.TEXTAREA:
                return 'Área de Texto';
            default:
                return 'Desconocido';
        }
    }
}
