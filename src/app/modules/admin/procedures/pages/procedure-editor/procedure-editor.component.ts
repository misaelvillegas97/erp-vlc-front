import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal }           from '@angular/core';
import { CommonModule }                                                                    from '@angular/common';
import { ActivatedRoute, CanDeactivate, Router }                                           from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule }                                                                 from '@angular/material/button';
import { MatCardModule }                                                                   from '@angular/material/card';
import { MatChipsModule }                                                                  from '@angular/material/chips';
import { MatDialogModule }                                                                 from '@angular/material/dialog';
import { MatExpansionModule }                                                              from '@angular/material/expansion';
import { MatFormFieldModule }                                                              from '@angular/material/form-field';
import { MatIconModule }                                                                   from '@angular/material/icon';
import { MatInputModule }                                                                  from '@angular/material/input';
import { MatProgressSpinnerModule }                                                        from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                 from '@angular/material/select';
import { MatSnackBarModule }                                                               from '@angular/material/snack-bar';
import { MatTabsModule }                                                                   from '@angular/material/tabs';
import { MatToolbarModule }                                                                from '@angular/material/toolbar';
import { MatTooltipModule }                                                                from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, takeUntil }                                   from 'rxjs/operators';
import { Subject }                                                                         from 'rxjs';
import { PageHeaderComponent }                                                             from '@layout/components/page-header/page-header.component';
import { NotyfService }                                                                    from '@shared/services/notyf.service';
import { RichTextEditorComponent }                                                         from '@shared/components/rich-text-editor';

import { ProcedureStore }                                          from '../../store/procedure.store';
import { CreateProcedureDto, CreateVersionDto, ProceduresService } from '../../services/procedures.service';
import { ProcedureVersionStatus }                                  from '../../domain/enums';

interface ProcedureSectionForm {
    title: FormControl<string>;
    body: FormControl<string>;
    attachments: FormControl<string[]>;
}

@Component({
    selector       : 'app-procedure-editor',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        PageHeaderComponent,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatDialogModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTabsModule,
        MatTooltipModule,
        RichTextEditorComponent
    ],
    template       : `
        <div class="flex flex-col min-w-0 w-full">
            <page-header
                [title]="isEditing() ? 'Editar Procedimiento' : 'Crear Procedimiento'"
                [subtitle]="isEditing() ? 'Modificar un procedimiento existente en el sistema' : 'Registrar un nuevo procedimiento en el sistema'"
                icon="heroicons_outline:document-text">
            </page-header>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 w-full p-6">
                <!-- Formulario principal -->
                <div class="md:col-span-8">
                    <!-- Status bar for editing mode -->
                    @if (isEditing()) {
                        <div class="flex items-center justify-between p-4 mb-6 bg-card border rounded-lg shadow-sm">
                            <div class="flex items-center gap-4">
                                @if (currentVersion()) {
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                                          [class]="getStatusClass(currentVersion()!.status)">
                                        {{ getStatusText(currentVersion()!.status) }}
                                    </span>
                                }
                                @if (hasUnsavedChanges()) {
                                    <span class="text-sm text-amber-600 flex items-center">
                                        <mat-icon class="mr-1 text-sm">edit</mat-icon>
                                        Cambios sin guardar
                                    </span>
                                }
                            </div>
                            @if (isAutoSaving()) {
                                <div class="flex items-center text-sm text-blue-600">
                                    <mat-progress-spinner diameter="16" class="mr-2"></mat-progress-spinner>
                                    Guardando...
                                </div>
                            }
                        </div>
                    }

                    <form [formGroup]="procedureForm">
                        <!-- Basic Information -->
                        <mat-card class="mb-6">
                            <mat-card-header>
                                <mat-card-title>Información Básica</mat-card-title>
                            </mat-card-header>
                            <mat-card-content class="pt-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <mat-form-field>
                                        <mat-label>Título</mat-label>
                                        <input matInput formControlName="title" placeholder="Título del procedimiento">
                                        @if (procedureForm.get('title').hasError('required')) {
                                            <mat-error>El título es obligatorio</mat-error>
                                        }
                                    </mat-form-field>

                                    <mat-form-field>
                                        <mat-label>Categoría</mat-label>
                                        <mat-select formControlName="category">
                                            <mat-option value="">Seleccionar categoría</mat-option>
                                            <mat-option value="Reglamento Interno">Reglamento Interno</mat-option>
                                            <mat-option value="SSO">Seguridad y Salud</mat-option>
                                            <mat-option value="Operacional">Operacional</mat-option>
                                            <mat-option value="Calidad">Calidad</mat-option>
                                        </mat-select>
                                    </mat-form-field>
                                </div>

                                <!-- Tags -->
                                <mat-form-field class="w-full">
                                    <mat-label>Etiquetas</mat-label>
                                    <mat-chip-grid #chipGrid aria-label="Etiquetas del procedimiento">
                                        @for (tag of tags(); track tag) {
                                            <mat-chip-row (removed)="removeTag(tag)">
                                                {{ tag }}
                                                <mat-icon matChipRemove>cancel</mat-icon>
                                            </mat-chip-row>
                                        }
                                    </mat-chip-grid>
                                    <input matInput [matChipInputFor]="chipGrid"
                                           (matChipInputTokenEnd)="addTag($event)"
                                           placeholder="Agregar etiquetas...">
                                </mat-form-field>
                            </mat-card-content>
                        </mat-card>

                        <!-- Procedure Sections -->
                        <mat-card class="mb-6">
                            <mat-card-header>
                                <mat-card-title class="flex items-center justify-between w-full">
                                    <span>Secciones del Procedimiento</span>
                                    <button mat-button color="primary" type="button" (click)="addSection()">
                                        <mat-icon>add</mat-icon>
                                        Agregar Sección
                                    </button>
                                </mat-card-title>
                            </mat-card-header>
                            <mat-card-content class="pt-4">
                                <mat-accordion formArrayName="sections">
                                    @for (sectionGroup of sectionsFormArray.controls; track $index; let i = $index) {
                                        <mat-expansion-panel [formGroupName]="i">
                                            <mat-expansion-panel-header>
                                                <mat-panel-title>
                                                    {{ getSectionTitle(i) || 'Sección ' + (i + 1) }}
                                                </mat-panel-title>
                                                <mat-panel-description>
                                                    {{ getSectionBodyPreview(i) }}
                                                </mat-panel-description>
                                            </mat-expansion-panel-header>

                                            <div class="space-y-4">
                                                <mat-form-field class="w-full">
                                                    <mat-label>Título de la Sección</mat-label>
                                                    <input matInput formControlName="title" placeholder="ej., Propósito, Alcance, Pasos del Procedimiento">
                                                </mat-form-field>

                                                <rich-text-editor
                                                    formControlName="body"
                                                    label="Contenido"
                                                    placeholder="Ingrese el contenido de la sección..."
                                                    controlClasses="w-full">
                                                </rich-text-editor>

                                                <!-- Section Actions -->
                                                <div class="flex justify-between items-center pt-2">
                                                    <div class="flex gap-2">
                                                        <button mat-button type="button" (click)="moveSectionUp(i)"
                                                                [disabled]="i === 0">
                                                            <mat-icon>keyboard_arrow_up</mat-icon>
                                                            Subir
                                                        </button>
                                                        <button mat-button type="button" (click)="moveSectionDown(i)"
                                                                [disabled]="i === sectionsFormArray.length - 1">
                                                            <mat-icon>keyboard_arrow_down</mat-icon>
                                                            Bajar
                                                        </button>
                                                    </div>
                                                    <button mat-button color="warn" type="button" (click)="removeSection(i)"
                                                            [disabled]="sectionsFormArray.length <= 1">
                                                        <mat-icon>delete</mat-icon>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </mat-expansion-panel>
                                    }
                                </mat-accordion>
                            </mat-card-content>
                        </mat-card>

                        <!-- Legal References -->
                        <mat-card class="mb-6">
                            <mat-card-header>
                                <mat-card-title class="flex items-center justify-between w-full">
                                    <span>Referencias Legales</span>
                                    <button mat-button color="primary" type="button" (click)="addLegalReference()">
                                        <mat-icon>add</mat-icon>
                                        Agregar Referencia
                                    </button>
                                </mat-card-title>
                            </mat-card-header>
                            <mat-card-content class="pt-4">
                                <div formArrayName="legalReferences" class="space-y-4">
                                    @for (refGroup of legalReferencesFormArray.controls; track $index; let i = $index) {
                                        <div [formGroupName]="i" class="p-4 border border-gray-200 rounded-lg">
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <mat-form-field>
                                                    <mat-label>Norma Legal</mat-label>
                                                    <mat-select formControlName="norma">
                                                        <mat-option value="Código del Trabajo">Código del Trabajo</mat-option>
                                                        <mat-option value="DS 594/1999">DS 594/1999</mat-option>
                                                        <mat-option value="Ley 16.744">Ley 16.744</mat-option>
                                                        <mat-option value="DS 40/1969">DS 40/1969</mat-option>
                                                        <mat-option value="DS 54/1969">DS 54/1969</mat-option>
                                                        <mat-option value="Ley 19.799">Ley 19.799</mat-option>
                                                        <mat-option value="Ley 19.628">Ley 19.628</mat-option>
                                                    </mat-select>
                                                </mat-form-field>

                                                <mat-form-field>
                                                    <mat-label>Artículo (opcional)</mat-label>
                                                    <input matInput formControlName="articulo" placeholder="ej., Art. 184">
                                                </mat-form-field>

                                                <div class="flex items-end">
                                                    <button mat-icon-button color="warn" type="button"
                                                            (click)="removeLegalReference(i)"
                                                            matTooltip="Eliminar referencia">
                                                        <mat-icon>delete</mat-icon>
                                                    </button>
                                                </div>
                                            </div>

                                            <rich-text-editor
                                                formControlName="nota"
                                                label="Notas (opcional)"
                                                placeholder="Contexto adicional o notas sobre esta referencia..."
                                                controlClasses="w-full mt-2"
                                                [minHeight]="80"
                                                [maxHeight]="200">
                                            </rich-text-editor>
                                        </div>
                                    }
                                </div>
                            </mat-card-content>
                        </mat-card>

                        <!-- Compliance Settings -->
                        @if (isEditing()) {
                            <mat-card class="mb-6">
                                <mat-card-header>
                                    <mat-card-title>Configuración de Cumplimiento</mat-card-title>
                                </mat-card-header>
                                <mat-card-content class="pt-4">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="flex items-center">
                                                <input type="checkbox" formControlName="modifiesInternalRegulations" class="mr-2">
                                                <span class="text-sm">Este procedimiento modifica el Reglamento Interno (requiere aviso de 30 días)</span>
                                            </label>
                                            <p class="text-xs text-gray-600 mt-1">
                                                Según el Código del Trabajo artículos 153 y 156
                                            </p>
                                        </div>
                                    </div>
                                </mat-card-content>
                            </mat-card>
                        }

                        <!-- Actions -->
                        <div class="flex justify-between items-center py-6 border-t border-gray-200">
                            <div class="flex gap-2">
                                <button mat-button type="button" (click)="goBack()">Cancelar</button>
                                <button mat-button color="accent" type="button" (click)="saveDraft()"
                                        [disabled]="isSaving() || !procedureForm.valid">
                                    @if (isSaving()) {
                                        <mat-progress-spinner diameter="16" class="mr-2"></mat-progress-spinner>
                                    }
                                    Guardar Borrador
                                </button>
                            </div>

                            <div class="flex gap-2">
                                @if (canSubmitForReview()) {
                                    <button mat-raised-button color="primary" type="button"
                                            (click)="submitForReview()"
                                            [disabled]="!procedureForm.valid || isSaving()">
                                        Enviar para Revisión
                                    </button>
                                }
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Panel de información lateral -->
                <div class="md:col-span-4 flex flex-col gap-6">
                    <!-- Información general -->
                    <mat-card class="rounded-md shadow">
                        <mat-card-content>
                            <h2 class="text-xl font-medium mb-4 flex items-center">
                                <mat-icon svgIcon="mat_solid:info"></mat-icon>
                                <span class="ml-2">Información</span>
                            </h2>
                            <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                <p>Los procedimientos son documentos que establecen la forma específica de llevar a cabo una actividad o proceso.</p>
                                <p><strong>Título:</strong> Debe ser claro y descriptivo del procedimiento.</p>
                                <p><strong>Categoría:</strong> Clasifica el procedimiento según su ámbito de aplicación.</p>
                            </div>
                        </mat-card-content>
                    </mat-card>

                    <!-- Consejos -->
                    <mat-card class="rounded-md shadow">
                        <mat-card-content>
                            <h2 class="text-xl font-medium mb-4 flex items-center">
                                <mat-icon svgIcon="mat_solid:tips_and_updates"></mat-icon>
                                <span class="ml-2">Consejos</span>
                            </h2>
                            <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                <p><strong>Secciones:</strong> Organice el contenido en secciones lógicas como Propósito, Alcance, Procedimiento, etc.</p>
                                <p><strong>Referencias Legales:</strong> Incluya las normativas aplicables para garantizar el cumplimiento.</p>
                                <p><strong>Autoguardado:</strong> Los cambios se guardan automáticamente mientras edita.</p>
                            </div>
                        </mat-card-content>
                    </mat-card>

                    <!-- Estado del procedimiento -->
                    @if (isEditing() && selectedProcedure()) {
                        <mat-card class="rounded-md shadow">
                            <mat-card-content>
                                <h2 class="text-xl font-medium mb-4 flex items-center">
                                    <mat-icon svgIcon="mat_solid:assignment"></mat-icon>
                                    <span class="ml-2">Estado del Procedimiento</span>
                                </h2>
                                <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                    <p><strong>Procedimiento:</strong> {{ selectedProcedure()?.title }}</p>
                                    @if (currentVersion()) {
                                        <p><strong>Versión:</strong> {{ currentVersion()?.number }}</p>
                                        <p><strong>Estado:</strong>
                                            <span [class]="getStatusClass(currentVersion()!.status)">
                                                {{ getStatusText(currentVersion()!.status) }}
                                            </span>
                                        </p>
                                    }
                                </div>
                            </mat-card-content>
                        </mat-card>
                    }
                </div>
            </div>
        </div>
    `
})
export class ProcedureEditorComponent implements OnInit, OnDestroy, CanDeactivate<ProcedureEditorComponent> {
    private store = inject(ProcedureStore);
    private proceduresService = inject(ProceduresService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    private notyf = inject(NotyfService);
    private destroy$ = new Subject<void>();

    // Form
    procedureForm: FormGroup;

    // State signals
    isEditing = signal(false);
    isSaving = signal(false);
    isAutoSaving = signal(false);
    hasUnsavedChanges = signal(false);
    tags = signal<string[]>([]);

    // Store signals
    selectedProcedure = this.store.selectedProcedure;
    currentVersion = this.store.currentVersion;
    canSubmitForReview = this.store.canSubmitForReview;

    constructor() {
        this.procedureForm = this.createForm();
        this.setupAutoSave();
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id'] && params['id'] !== 'new') {
                this.isEditing.set(true);
                this.loadProcedure(params['id']);
            } else {
                this.isEditing.set(false);
                this.initializeNewProcedure();
            }
        });

        // Track form changes
        this.procedureForm.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.hasUnsavedChanges.set(this.procedureForm.dirty);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    canDeactivate(): boolean {
        if (this.hasUnsavedChanges()) {
            return confirm('You have unsaved changes. Are you sure you want to leave?');
        }
        return true;
    }

    private createForm(): FormGroup {
        return this.fb.group({
            title                      : [ '', Validators.required ],
            category                   : [ '' ],
            sections                   : this.fb.array([]),
            legalReferences            : this.fb.array([]),
            modifiesInternalRegulations: [ false ]
        });
    }

    private setupAutoSave(): void {
        this.procedureForm.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            if (this.procedureForm.valid && this.hasUnsavedChanges() && this.isEditing()) {
                this.autoSave();
            }
        });
    }

    private async autoSave(): Promise<void> {
        if (this.isAutoSaving()) return;

        this.isAutoSaving.set(true);
        try {
            await this.saveDraft();
        } finally {
            this.isAutoSaving.set(false);
        }
    }

    get sectionsFormArray(): FormArray {
        return this.procedureForm.get('sections') as FormArray;
    }

    get legalReferencesFormArray(): FormArray {
        return this.procedureForm.get('legalReferences') as FormArray;
    }

    private loadProcedure(id: string): void {
        this.store.selectProcedure(id);
        // Form will be populated when store updates
    }

    private initializeNewProcedure(): void {
        this.addSection(); // Start with one section
        this.addLegalReference(); // Start with one legal reference
    }

    // Section management
    addSection(): void {
        const sectionForm = this.fb.group({
            title      : [ '' ],
            body       : [ '' ],
            attachments: this.fb.control<string[]>([])
        });
        this.sectionsFormArray.push(sectionForm);
    }

    removeSection(index: number): void {
        if (this.sectionsFormArray.length > 1) {
            this.sectionsFormArray.removeAt(index);
        }
    }

    moveSectionUp(index: number): void {
        if (index > 0) {
            const section = this.sectionsFormArray.at(index);
            this.sectionsFormArray.removeAt(index);
            this.sectionsFormArray.insert(index - 1, section);
        }
    }

    moveSectionDown(index: number): void {
        if (index < this.sectionsFormArray.length - 1) {
            const section = this.sectionsFormArray.at(index);
            this.sectionsFormArray.removeAt(index);
            this.sectionsFormArray.insert(index + 1, section);
        }
    }

    getSectionTitle(index: number): string {
        return this.sectionsFormArray.at(index)?.get('title')?.value || '';
    }

    getSectionBodyPreview(index: number): string {
        const body = this.sectionsFormArray.at(index)?.get('body')?.value || '';
        return body.length > 50 ? body.substring(0, 50) + '...' : body;
    }

    // Legal references management
    addLegalReference(): void {
        const refForm = this.fb.group({
            norma   : [ '', Validators.required ],
            articulo: [ '' ],
            nota    : [ '' ]
        });
        this.legalReferencesFormArray.push(refForm);
    }

    removeLegalReference(index: number): void {
        this.legalReferencesFormArray.removeAt(index);
    }

    // Tags management
    addTag(event: any): void {
        const value = (event.value || '').trim();
        if (value) {
            const currentTags = this.tags();
            if (!currentTags.includes(value)) {
                this.tags.set([ ...currentTags, value ]);
            }
        }
        event.chipInput!.clear();
    }

    removeTag(tag: string): void {
        const currentTags = this.tags();
        this.tags.set(currentTags.filter(t => t !== tag));
    }

    // Actions
    async saveDraft(): Promise<void> {
        if (!this.procedureForm.valid) return;

        this.isSaving.set(true);
        try {
            const formData = this.procedureForm.value;
            const dto = this.isEditing() ? this.buildVersionDto(formData) : this.buildProcedureDto(formData);

            if (this.isEditing()) {
                // Create new version or update existing draft
                const procedure = this.selectedProcedure();
                if (procedure) {
                    await this.proceduresService.createVersion(procedure.id, dto as CreateVersionDto).toPromise();
                }
            } else {
                // Create new procedure
                await this.proceduresService.createProcedure(dto as CreateProcedureDto).toPromise();
            }

            this.hasUnsavedChanges.set(false);
            this.procedureForm.markAsPristine();
        } finally {
            this.isSaving.set(false);
        }
    }

    async submitForReview(): Promise<void> {
        await this.saveDraft();
        // TODO: Implement review submission logic
        // This would open a dialog to select reviewers
    }

    private buildProcedureDto(formData: any): CreateProcedureDto {
        return {
            title          : formData.title,
            category       : formData.category || undefined,
            tags           : this.tags(),
            content        : {
                sections: formData.sections,
                meta    : {}
            },
            legalReferences: formData.legalReferences
        };
    }

    private buildVersionDto(formData: any): CreateVersionDto {
        return {
            content                    : {
                sections: formData.sections,
                meta    : {}
            },
            legalReferences            : formData.legalReferences,
            modifiesInternalRegulations: formData.modifiesInternalRegulations
        };
    }

    getStatusClass(status: ProcedureVersionStatus): string {
        const classes: Record<ProcedureVersionStatus, string> = {
            [ProcedureVersionStatus.Draft]           : 'bg-gray-100 text-gray-800',
            [ProcedureVersionStatus.InReview]        : 'bg-blue-100 text-blue-800',
            [ProcedureVersionStatus.ChangesRequested]: 'bg-amber-100 text-amber-800',
            [ProcedureVersionStatus.Approved]        : 'bg-green-100 text-green-800',
            [ProcedureVersionStatus.Published]       : 'bg-purple-100 text-purple-800',
            [ProcedureVersionStatus.Archived]        : 'bg-gray-100 text-gray-600'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusText(status: ProcedureVersionStatus): string {
        const texts: Record<ProcedureVersionStatus, string> = {
            [ProcedureVersionStatus.Draft]           : 'Draft',
            [ProcedureVersionStatus.InReview]        : 'In Review',
            [ProcedureVersionStatus.ChangesRequested]: 'Changes Requested',
            [ProcedureVersionStatus.Approved]        : 'Approved',
            [ProcedureVersionStatus.Published]       : 'Published',
            [ProcedureVersionStatus.Archived]        : 'Archived'
        };
        return texts[status] || 'Unknown';
    }

    goBack(): void {
        this.router.navigate([ '../list' ], {relativeTo: this.route});
    }
}
