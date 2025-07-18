import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy }                from '@angular/core';
import { CommonModule }                                                                        from '@angular/common';
import { Router, ActivatedRoute, RouterModule }                                                from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

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

import { ChecklistService }         from '../../services/checklist.service';
import { ChecklistTemplate }        from '../../domain/interfaces/checklist-template.interface';
import { ChecklistCategory }        from '../../domain/interfaces/checklist-category.interface';
import { ChecklistQuestion }        from '../../domain/interfaces/checklist-question.interface';
import { ChecklistType }            from '../../domain/enums/checklist-type.enum';
import { ResponseType }             from '../../domain/enums/response-type.enum';
import { ChecklistScoreCalculator } from '../../domain/models/checklist-score-calculator.model';
import { NotyfService }             from '@shared/services/notyf.service';
import { PageHeaderComponent }      from '@layout/components/page-header/page-header.component';

// Custom validators
function weightSumValidator(control: AbstractControl): { [key: string]: any } | null {
    if (control instanceof FormArray) {
        const weights = control.controls.map(c => c.get('weight')?.value || 0);
        const sum = weights.reduce((acc, weight) => acc + weight, 0);
        const isValid = ChecklistScoreCalculator.validateWeights(weights);
        return isValid ? null : {weightSum: {actual: sum, expected: 1.0}};
    }
    return null;
}

@Component({
    selector       : 'app-checklist-template-form',
    standalone     : true,
    imports        : [
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './checklist-template-form.component.html'
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

    readonly responseTypes = [
        {value: ResponseType.TEXT, label: 'Texto'},
        {value: ResponseType.NUMERIC, label: 'Numérico'},
        {value: ResponseType.CHECKBOX, label: 'Checkbox'},
        {value: ResponseType.MULTIPLE_CHOICE, label: 'Opción múltiple'},
        {value: ResponseType.FILE_UPLOAD, label: 'Subir archivo'}
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

    // Form
    readonly templateForm: FormGroup = this.fb.group({
        name          : [ '', [ Validators.required, Validators.minLength(2) ] ],
        type          : [ '', Validators.required ],
        version       : [ '1.0', Validators.required ],
        description   : [ '' ],
        weight        : [ 0, [ Validators.required, Validators.min(0), Validators.max(1) ] ],
        scoreThreshold: [ 0.7, [ Validators.min(0), Validators.max(1) ] ],
        vehicleIds    : [ [], Validators.required ],
        roleIds       : [ [], Validators.required ],
        isActive      : [ true ],
        categories    : this.fb.array([], weightSumValidator)
    });

    // Computed signals
    readonly categoriesArray = computed(() => this.templateForm.get('categories') as FormArray);

    readonly totalCategoryWeight = computed(() => {
        const categories = this.categoriesArray();
        if (!categories) return 0;
        return categories.controls.reduce((sum, control) => {
            return sum + (control.get('weight')?.value || 0);
        }, 0);
    });

    readonly categoryWeightValidation = computed(() => {
        const total = this.totalCategoryWeight();
        const isValid = Math.abs(total - 1.0) <= 0.01;
        return {
            isValid,
            total,
            class: isValid ? 'text-green-600' : total > 1.0 ? 'text-red-600' : 'text-orange-600'
        };
    });

    readonly canSubmit = computed(() => {
        return this.templateForm.valid &&
            this.categoryWeightValidation().isValid &&
            this.categoriesArray().length > 0 &&
            !this.checklistService.loading();
    });

    ngOnInit(): void {
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

    private createCategoryFormGroup(): FormGroup {
        return this.fb.group({
            title      : [ '', Validators.required ],
            description: [ '' ],
            weight     : [ 0, [ Validators.required, Validators.min(0), Validators.max(1) ] ],
            order      : [ this.categoriesArray().length ],
            questions  : this.fb.array([], weightSumValidator)
        });
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

    private createQuestionFormGroup(categoryIndex: number): FormGroup {
        const questionsArray = this.getQuestionsArray(categoryIndex);
        return this.fb.group({
            title       : [ '', Validators.required ],
            description : [ '' ],
            weight      : [ 0, [ Validators.required, Validators.min(0), Validators.max(1) ] ],
            required    : [ true ],
            responseType: [ ResponseType.TEXT, Validators.required ],
            options     : this.fb.array([]),
            numericRange: this.fb.group({
                min: [ 0 ],
                max: [ 100 ]
            }),
            order       : [ questionsArray.length ]
        });
    }

    // Response type handling
    onResponseTypeChange(categoryIndex: number, questionIndex: number, responseType: ResponseType): void {
        const questionGroup = this.getQuestionsArray(categoryIndex).at(questionIndex) as FormGroup;
        const optionsArray = questionGroup.get('options') as FormArray;

        // Clear existing options
        while (optionsArray.length !== 0) {
            optionsArray.removeAt(0);
        }

        // Add default options for multiple choice
        if (responseType === ResponseType.MULTIPLE_CHOICE) {
            this.addOption(categoryIndex, questionIndex);
            this.addOption(categoryIndex, questionIndex);
        }
    }

    // Options management for multiple choice questions
    getOptionsArray(categoryIndex: number, questionIndex: number): FormArray {
        return this.getQuestionsArray(categoryIndex).at(questionIndex).get('options') as FormArray;
    }

    addOption(categoryIndex: number, questionIndex: number): void {
        const optionsArray = this.getOptionsArray(categoryIndex, questionIndex);
        optionsArray.push(this.fb.control('', Validators.required));
    }

    removeOption(categoryIndex: number, questionIndex: number, optionIndex: number): void {
        this.getOptionsArray(categoryIndex, questionIndex).removeAt(optionIndex);
    }

    // Weight calculation helpers
    getCategoryQuestionWeight(categoryIndex: number): number {
        const questionsArray = this.getQuestionsArray(categoryIndex);
        return questionsArray.controls.reduce((sum, control) => {
            return sum + (control.get('weight')?.value || 0);
        }, 0);
    }

    getCategoryWeightValidation(categoryIndex: number): { isValid: boolean; total: number; class: string } {
        const total = this.getCategoryQuestionWeight(categoryIndex);
        const isValid = Math.abs(total - 1.0) <= 0.01;
        return {
            isValid,
            total,
            class: isValid ? 'text-green-600' : total > 1.0 ? 'text-red-600' : 'text-orange-600'
        };
    }

    // Form submission
    onSubmit(): void {
        if (!this.canSubmit()) return;

        const formValue = this.templateForm.value;
        const templateData: Omit<ChecklistTemplate, 'id'> = {
            name          : formValue.name,
            type          : formValue.type,
            version       : formValue.version,
            description   : formValue.description,
            weight        : formValue.weight,
            scoreThreshold: formValue.scoreThreshold,
            vehicleIds    : formValue.vehicleIds,
            roleIds       : formValue.roleIds,
            isActive      : formValue.isActive,
            categories    : formValue.categories.map((category: any, categoryIndex: number) => ({
                title      : category.title,
                description: category.description,
                weight     : category.weight,
                order      : categoryIndex,
                questions  : category.questions.map((question: any, questionIndex: number) => ({
                    title       : question.title,
                    description : question.description,
                    weight      : question.weight,
                    required    : question.required,
                    responseType: question.responseType,
                    options     : question.responseType === ResponseType.MULTIPLE_CHOICE ? question.options : undefined,
                    numericRange: question.responseType === ResponseType.NUMERIC ? question.numericRange : undefined,
                    order       : questionIndex
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
            name          : template.name,
            type          : template.type,
            version       : template.version,
            description   : template.description,
            weight        : template.weight,
            scoreThreshold: template.scoreThreshold,
            vehicleIds    : template.vehicleIds,
            roleIds       : template.roleIds,
            isActive      : template.isActive
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
                weight     : category.weight,
                order      : category.order
            });

            // Add questions to category
            const questionsArray = categoryGroup.get('questions') as FormArray;
            category.questions.forEach(question => {
                const questionGroup = this.createQuestionFormGroup(0); // Index doesn't matter for creation
                questionGroup.patchValue({
                    title       : question.title,
                    description : question.description,
                    weight      : question.weight,
                    required    : question.required,
                    responseType: question.responseType,
                    numericRange: question.numericRange,
                    order       : question.order
                });

                // Add options for multiple choice questions
                if (question.responseType === ResponseType.MULTIPLE_CHOICE && question.options) {
                    const optionsArray = questionGroup.get('options') as FormArray;
                    question.options.forEach(option => {
                        optionsArray.push(this.fb.control(option, Validators.required));
                    });
                }

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
}
