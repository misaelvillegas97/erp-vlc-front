import { Component, computed, inject, OnInit, signal }                        from '@angular/core';
import { CommonModule }                                                       from '@angular/common';
import { ActivatedRoute, Router, RouterModule }                               from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Angular Material
import { MatCardModule }        from '@angular/material/card';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatSelectModule }      from '@angular/material/select';
import { MatCheckboxModule }    from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule }       from '@angular/material/chips';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { MatExpansionModule }   from '@angular/material/expansion';
import { MatDividerModule }     from '@angular/material/divider';

import { ChecklistService }    from '../../services/checklist.service';
import { ChecklistTemplate }   from '../../domain/interfaces/checklist-template.interface';
import { ChecklistType }       from '../../domain/enums/checklist-type.enum';
import { NotyfService }        from '@shared/services/notyf.service';
import { PageHeaderComponent } from '@layout/components/page-header/page-header.component';
import { toSignal }            from '@angular/core/rxjs-interop';
import { RoleEnum, roleNames } from '@core/user/role.type';
import { VehicleType }         from '@modules/admin/maintainers/vehicles/domain/model/vehicle';

// ❌ REMOVED: weightSumValidator - No longer needed with free weight system

@Component({
    selector   : 'app-checklist-template-form',
    standalone : true,
    imports    : [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatProgressBarModule,
        MatChipsModule,
        MatTooltipModule,
        MatExpansionModule,
        MatDividerModule,
        PageHeaderComponent
    ],
    templateUrl: './checklist-template-form.component.html'
})
export class ChecklistTemplateFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notyf = inject(NotyfService);

    checklistService = inject(ChecklistService);

    // Component state
    readonly isEditMode = signal<boolean>(false);
    readonly templateId = signal<string | null>(null);

    // Static data
    readonly checklistTypes = [
        {value: ChecklistType.INSPECTION, label: 'Inspección'},
        {value: ChecklistType.MAINTENANCE, label: 'Mantenimiento'},
        {value: ChecklistType.SAFETY, label: 'Seguridad'},
        {value: ChecklistType.QUALITY, label: 'Calidad'},
        {value: ChecklistType.COMPLIANCE, label: 'Cumplimiento'},
        {value: ChecklistType.OPERATIONAL, label: 'Operacional'}
    ];


    // Mock data for vehicles and roles (replace with actual service calls)
    readonly availableVehicles = signal([
        {id: '1', name: 'Camión 001', plate: 'ABC-123'},
        {id: '2', name: 'Camión 002', plate: 'DEF-456'},
        {id: '3', name: 'Van 001', plate: 'GHI-789'}
    ]);

    readonly availableRoles = signal([
        {id: '1', name: 'Conductor'},
        {id: '2', name: 'Supervisor'},
        {id: '3', name: 'Inspector de calidad'},
        {id: '4', name: 'Técnico de mantenimiento'}
    ]);

    roles = Object.values(RoleEnum).filter(value => typeof value === 'number');

    // Form - Structured according to FormTemplate interface
    readonly templateForm: FormGroup = this.fb.group({
        // Section 1: Basic Information
        basicInfo: this.fb.group({
            type                : [ '', Validators.required ],
            name                : [ '', [ Validators.required, Validators.minLength(2) ] ],
            description         : [ '' ],
            version             : [ '1.0' ],
            performanceThreshold: [ 75, [ Validators.min(0), Validators.max(100) ] ],
            isActive            : [ true ]
        }),

        // Section 2: Application Filters
        filters: this.fb.group({
            vehicleTypes: [ [] ],
            userRoles   : [ [] ]
        }),

        // Section 3: Content Structure
        content: this.fb.group({
            categories: this.fb.array([]) // ❌ REMOVED weightSumValidator
        })
    });

    // Computed signals
    readonly categoriesArraySignal = toSignal(this.templateForm.get('content.categories').valueChanges);
    readonly categoriesArray = computed(() => this.templateForm.get('content.categories') as FormArray);

    // ✅ NEW: Calculate total checklist weight (sum of all question weights)
    readonly totalChecklistWeight = computed(() => {
        const categories = this.categoriesArraySignal();
        if (!categories) return 0;

        return categories.reduce((totalWeight, category) => {
            const questions = category.questions || [];
            const categoryWeight = questions.reduce((sum, question) => sum + (question.weight || 0), 0);
            return totalWeight + categoryWeight;
        }, 0);
    });

    readonly checklistWeightValidation = computed(() => {
        const total = this.totalChecklistWeight();
        const isValid = total > 0; // Only verify that there's positive weight
        return {
            isValid,
            total,
            class: isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        };
    });

    // ✅ NEW: Computed signal for form submission validation
    readonly canSubmitForm = computed(() => {
        const categories = this.categoriesArraySignal();
        const hasQuestions = categories?.some(category =>
            category.questions && category.questions.length > 0
        ) || false;

        return this.templateForm.valid &&
            hasQuestions &&
            this.totalChecklistWeight() > 0 &&
            !this.checklistService.loading();
    });

    ngOnInit(): void {
        console.log(this.roles);
        this.checkRouteParams();
        this.addInitialCategory();
    }

    // Category management
    addCategory(): void {
        const categoryGroup = this.createCategoryFormGroup();
        this.categoriesArray().push(categoryGroup);
    }

    removeCategory(index: number): void {
        this.categoriesArray().removeAt(index);
    }

    // Question management
    getQuestionsArray(categoryIndex: number): FormArray {
        return this.categoriesArray().at(categoryIndex).get('questions') as FormArray;
    }

    addQuestion(categoryIndex: number): void {
        const questionGroup = this.createQuestionFormGroup(categoryIndex);
        this.getQuestionsArray(categoryIndex).push(questionGroup);
    }

    removeQuestion(categoryIndex: number, questionIndex: number): void {
        this.getQuestionsArray(categoryIndex).removeAt(questionIndex);
    }

    // Approval system helpers
    getApprovalPreview(hasIntermediateApproval: boolean, intermediateValue: number): string {
        if (hasIntermediateApproval) {
            return `Aprobado (1.0) | Parcial (${ intermediateValue.toFixed(2) }) | No Aprobado (0.0)`;
        } else {
            return 'Aprobado (1.0) | No Aprobado (0.0)';
        }
    }

    // ✅ UPDATED: Weight calculation helpers for new free weight system
    getCategoryTotalWeight(categoryIndex: number): number {
        const questionsArray = this.getQuestionsArray(categoryIndex);
        return questionsArray.controls.reduce((sum, control) => {
            return sum + (control.get('weight')?.value || 0);
        }, 0);
    }

    getCategoryWeightValidation(categoryIndex: number): { isValid: boolean; total: number; class: string } {
        const total = this.getCategoryTotalWeight(categoryIndex);
        const isValid = total > 0; // Only verify that there's positive weight
        return {
            isValid,
            total,
            class: isValid ? 'text-green-600' : 'text-red-600'
        };
    }

    // Form submission
    onSubmit(): void {
        const hasQuestions = this.categoriesArraySignal()?.some(category =>
            category.questions && category.questions.length > 0
        ) || false;

        if (!(this.templateForm.valid &&
            hasQuestions &&
            this.totalChecklistWeight() > 0 &&
            !this.checklistService.loading())) return;

        const formValue = this.templateForm.value;
        const templateData: Omit<ChecklistTemplate, 'id'> = {
            // Basic Information
            type                : formValue.basicInfo.type,
            name                : formValue.basicInfo.name,
            description         : formValue.basicInfo.description,
            version             : formValue.basicInfo.version,
            performanceThreshold: formValue.basicInfo.performanceThreshold / 100, // Convert percentage to decimal
            isActive            : formValue.basicInfo.isActive,

            // Application Filters
            vehicleTypes: formValue.filters.vehicleTypes,
            userRoles   : formValue.filters.userRoles,

            // Content Structure
            categories: formValue.content.categories.map((category: any, categoryIndex: number) => ({
                title      : category.title,
                description: category.description,
                // weight     : category.weight, // ❌ REMOVED - Categories no longer have weight
                sortOrder  : categoryIndex,
                questions  : category.questions.map((question: any, questionIndex: number) => ({
                    title                  : question.title,
                    description            : question.description,
                    weight                 : question.weight,
                    required               : question.required,
                    hasIntermediateApproval: question.hasIntermediateApproval,
                    intermediateValue      : question.intermediateValue,
                    extraFields            : question.extraFields,
                    sortOrder              : questionIndex,
                    isActive               : question.isActive
                }))
            }))
        };

        const operation = this.isEditMode()
            ? this.checklistService.updateTemplate(this.templateId()!, templateData)
            : this.checklistService.createTemplate(templateData);

        operation.subscribe({
            next : (template) => {
                this.notyf.success(
                    `Plantilla ${ this.isEditMode() ? 'actualizada' : 'creada' } exitosamente`
                );
                this.router.navigate([ '../' ], {relativeTo: this.route});
            },
            error: (error) => {
                console.log('error', error);
                this.notyf.error(
                    `Error al ${ this.isEditMode() ? 'actualizar' : 'crear' } la plantilla`
                );
            }
        });
    }

    // Route handling
    private checkRouteParams(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.templateId.set(id);
            this.loadTemplate(id);
        }
    }

    private loadTemplate(id: string): void {
        // In a real implementation, you would load the template from the service
        // For now, we'll use mock data or the existing templates from the service
        const template = this.checklistService.templates().find(t => t.id === id);
        if (template) {
            this.populateForm(template);
        }
    }

    private populateForm(template: ChecklistTemplate): void {
        this.templateForm.patchValue({
            basicInfo: {
                name                : template.name,
                type                : template.type,
                version             : template.version,
                description         : template.description,
                performanceThreshold: template.performanceThreshold ? template.performanceThreshold * 100 : 75, // Convert decimal to percentage
                isActive            : template.isActive
            },
            filters  : {
                vehicleTypes: template.vehicleTypes || [],
                userRoles   : template.userRoles || []
            }
        });

        // Clear existing categories
        const categoriesArray = this.categoriesArray();
        while (categoriesArray.length !== 0) {
            categoriesArray.removeAt(0);
        }

        // Add categories from template
        template.categories.forEach(category => {
            const categoryGroup = this.createCategoryFormGroup();
            categoryGroup.patchValue({
                title      : category.title,
                description: category.description,
                // weight     : category.weight, // ❌ REMOVED - Categories no longer have weight
                sortOrder: category.sortOrder
            });

            // Add questions to category
            const questionsArray = categoryGroup.get('questions') as FormArray;
            category.questions.forEach(question => {
                const questionGroup = this.createQuestionFormGroup(0); // Index doesn't matter for creation
                questionGroup.patchValue({
                    title      : question.title,
                    description: question.description,
                    weight     : question.weight,
                    required   : question.required,

                    // ✅ NEW: Sistema de aprobación configurable
                    hasIntermediateApproval: question.hasIntermediateApproval || false,
                    intermediateValue      : question.intermediateValue || 0.5,

                    sortOrder: question.sortOrder
                });

                questionsArray.push(questionGroup);
            });

            categoriesArray.push(categoryGroup);
        });
    }

    private addInitialCategory(): void {
        if (this.categoriesArray().length === 0) {
            this.addCategory();
            // Add initial question to the first category
            this.addQuestion(0);
        }
    }

    private createCategoryFormGroup(): FormGroup {
        return this.fb.group({
            title      : [ '', Validators.required ],
            description: [ '' ],
            // weight     : [ 0, [ Validators.required, Validators.min(0), Validators.max(1) ] ], // ❌ REMOVED - Categories no longer have weight
            sortOrder: [ this.categoriesArray().length ],
            questions: this.fb.array([]) // ❌ REMOVED weightSumValidator
        });
    }

    private createQuestionFormGroup(categoryIndex: number): FormGroup {
        const questionsArray = this.getQuestionsArray(categoryIndex);
        return this.fb.group({
            title      : [ '', Validators.required ],
            description: [ '' ],
            weight     : [ 1, [ Validators.required, Validators.min(0.1) ] ], // ✅ CHANGED: Default 1, minimum 0.1, removed max limit
            required   : [ true ],

            // ✅ NEW: Sistema de aprobación configurable
            hasIntermediateApproval: [ false ],
            intermediateValue      : [ 0.5, [ Validators.required, Validators.min(0), Validators.max(1) ] ],

            extraFields: [ {} ],
            sortOrder  : [ questionsArray.length ],
            isActive   : [ true ]
        });
    }

    protected readonly roleNames = roleNames;
    protected readonly VehicleType = Object.values(VehicleType);
}
