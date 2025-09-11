import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                                          from '@angular/common';
import { ActivatedRoute, CanDeactivate, Router }                                 from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators }               from '@angular/forms';
import { MatButtonModule }                                                       from '@angular/material/button';
import { MatCardModule }                                                         from '@angular/material/card';
import { MatChipsModule }                                                        from '@angular/material/chips';
import { MatCheckboxModule }                                                     from '@angular/material/checkbox';
import { MatDatepickerModule }                                                   from '@angular/material/datepicker';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatIconModule }                                                         from '@angular/material/icon';
import { MatInputModule }                                                        from '@angular/material/input';
import { MatProgressSpinnerModule }                                              from '@angular/material/progress-spinner';
import { MatSelectModule }                                                       from '@angular/material/select';
import { MatSnackBarModule }                                                     from '@angular/material/snack-bar';
import { MatTooltipModule }                                                      from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, takeUntil }                         from 'rxjs/operators';
import { Subject }                                                               from 'rxjs';
import { PageHeaderComponent }                                                   from '@layout/components/page-header/page-header.component';
import { NotyfService }                                                          from '@shared/services/notyf.service';
import { FileUploadComponent }                                                   from '@shared/components/file-upload/file-upload.component';

import { ProcedureStore }                                          from '../../store/procedure.store';
import { CreateProcedureDto, CreateVersionDto, ProceduresService } from '../../services/procedures.service';
import { LegalReferenceCategory, ProcedureVersionStatus, ProcedureCategory } from '../../domain/enums';
import { ProcedurePriority }                                                     from '../../domain/interfaces/base.interface';
import { RoleEnum, roleNames }                                                   from '@core/user/role.type';
import { ProcedureCategoryUtils, ProcedureCategoryOption }                   from '../../utils/procedure-category.utils';

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
        MatCheckboxModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
        FileUploadComponent
    ],
    templateUrl    : './procedure-editor.component.html',
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

    quillModules = {
        toolbar: [
            [ 'bold', 'italic', 'underline' ],
            [ {header: [ 1, 2, 3, 4, 5, 6, false ]} ],
            [ {align: []}, {list: 'ordered'}, {list: 'bullet'} ],
            [ {'color': []}, {'background': []} ],
            [ 'clean' ],
            [ 'link' ]
        ]
    };

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
            code                     : [ '', [ Validators.required, Validators.minLength(3), Validators.maxLength(50) ] ],
            title                    : [ '', [ Validators.required, Validators.minLength(10), Validators.maxLength(500) ] ],
            description              : [ '', Validators.maxLength(2000) ],
            category                 : [ '', Validators.required ],
            tags                     : [ [] ],
            priority                 : [ 'MEDIUM' as ProcedurePriority, Validators.required ],
            department               : [ '', Validators.required ],
            roles                    : [ [], Validators.required ],
            legalCategories          : [ [] ],
            affectsInternalRegulation: [ false ],
            requiresQuiz             : [ false ],
            expiresAt                : [ null ],
            content                  : [ null, Validators.required ]
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

    private loadProcedure(id: string): void {
        this.store.selectProcedure(id);
        // Form will be populated when store updates
    }

    private initializeNewProcedure(): void {
        // Initialize with empty form
    }

    // Tags management
    addTag(event: any): void {
        const value = (event.value || '').trim().toLowerCase();
        if (value) {
            const currentTags = this.procedureForm.get('tags')?.value || [];
            if (!currentTags.includes(value)) {
                this.procedureForm.get('tags')?.setValue([ ...currentTags, value ]);
            }
        }
        event.chipInput!.clear();
    }

    removeTag(tag: string): void {
        const currentTags = this.procedureForm.get('tags')?.value || [];
        this.procedureForm.get('tags')?.setValue(currentTags.filter((t: string) => t !== tag));
    }

    getTags(): string[] {
        return this.procedureForm.get('tags')?.value || [];
    }

    // Category options
    getCategoryOptions(): ProcedureCategoryOption[] {
        return ProcedureCategoryUtils.getAllCategories();
    }

    // Legal categories
    getLegalCategoryOptions(): { value: LegalReferenceCategory; label: string }[] {
        return [
            {value: LegalReferenceCategory.LABOR_CODE, label: 'Código del Trabajo'},
            {value: LegalReferenceCategory.HEALTH_SAFETY, label: 'DS 594/1999'},
            {value: LegalReferenceCategory.RISK_PREVENTION, label: 'Ley 16.744, DS 40/1969'},
            {value: LegalReferenceCategory.JOINT_COMMITTEE, label: 'DS 54/1969'},
            {value: LegalReferenceCategory.INTERNAL_REGULATION, label: 'Arts. 153 y 156 CT'},
            {value: LegalReferenceCategory.ELECTRONIC_SIGNATURE, label: 'Ley 19.799'},
            {value: LegalReferenceCategory.DATA_PROTECTION, label: 'Ley 19.628'}
        ];
    }

    // Role options
    getRoleOptions(): { value: RoleEnum; label: string }[] {
        return [
            {value: RoleEnum.driver, label: roleNames[RoleEnum.driver]},
            {value: RoleEnum.supervisor, label: roleNames[RoleEnum.supervisor]},
            {value: RoleEnum.admin, label: roleNames[RoleEnum.admin]},
            {value: RoleEnum.dispatcher, label: roleNames[RoleEnum.dispatcher]},
            {value: RoleEnum.operator, label: roleNames[RoleEnum.operator]},
            {value: RoleEnum.quality_manager, label: roleNames[RoleEnum.quality_manager]},
            {value: RoleEnum.inventory_manager, label: roleNames[RoleEnum.inventory_manager]},
            {value: RoleEnum.warehouse_staff, label: roleNames[RoleEnum.warehouse_staff]},
            {value: RoleEnum.procedure_reviewer, label: roleNames[RoleEnum.procedure_reviewer]},
            {value: RoleEnum.procedure_publisher, label: roleNames[RoleEnum.procedure_publisher]}
        ];
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
            code                     : formData.code,
            title                    : formData.title,
            description              : formData.description || '',
            category                 : formData.category,
            tags                     : formData.tags || [],
            roles                    : formData.roles || [],
            priority                 : formData.priority,
            department               : formData.department,
            legalCategories          : formData.legalCategories || [],
            affectsInternalRegulation: formData.affectsInternalRegulation || false,
            requiresQuiz             : formData.requiresQuiz || false,
            expiresAt                : formData.expiresAt,
            content                  : formData.content
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
            [ProcedureVersionStatus.DRAFT]    : 'bg-gray-100 text-gray-800',
            [ProcedureVersionStatus.IN_REVIEW]: 'bg-blue-100 text-blue-800',
            [ProcedureVersionStatus.REJECTED] : 'bg-red-100 text-red-800',
            // [ProcedureVersionStatus.ChangesRequested]: 'bg-amber-100 text-amber-800',
            [ProcedureVersionStatus.APPROVED] : 'bg-green-100 text-green-800',
            [ProcedureVersionStatus.PUBLISHED]: 'bg-purple-100 text-purple-800',
            [ProcedureVersionStatus.ARCHIVED] : 'bg-gray-100 text-gray-600'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusText(status: ProcedureVersionStatus): string {
        const texts: Record<ProcedureVersionStatus, string> = {
            [ProcedureVersionStatus.DRAFT]    : 'Draft',
            [ProcedureVersionStatus.IN_REVIEW]: 'In Review',
            [ProcedureVersionStatus.REJECTED] : 'Rejected',
            // [ProcedureVersionStatus.ChangesRequested]: 'Changes Requested',
            [ProcedureVersionStatus.APPROVED] : 'Approved',
            [ProcedureVersionStatus.PUBLISHED]: 'Published',
            [ProcedureVersionStatus.ARCHIVED] : 'Archived'
        };
        return texts[status] || 'Unknown';
    }

    goBack(): void {
        this.router.navigate([ '../list' ], {relativeTo: this.route});
    }
}
