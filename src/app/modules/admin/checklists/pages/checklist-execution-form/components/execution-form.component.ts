import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal }            from '@angular/core';
import { CommonModule }                                                                    from '@angular/common';
import { ActivatedRoute, Router, RouterLink }                                              from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Angular Material
import { MatCardModule }              from '@angular/material/card';
import { MatFormFieldModule }         from '@angular/material/form-field';
import { MatInputModule }             from '@angular/material/input';
import { MatButtonModule }            from '@angular/material/button';
import { MatIconModule }              from '@angular/material/icon';
import { MatRadioModule }             from '@angular/material/radio';
import { MatExpansionModule }         from '@angular/material/expansion';
import { MatProgressBarModule }       from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule }          from '@angular/material/snack-bar';
import { MatSelectModule }            from '@angular/material/select';
import { MatTooltipModule }           from '@angular/material/tooltip';
import { MatButtonToggleModule }      from '@angular/material/button-toggle';

import { ChecklistService }                             from '../../../services/checklist.service';
import { ChecklistTemplate }                            from '../../../domain/interfaces/checklist-template.interface';
import { ChecklistGroup }                               from '../../../domain/interfaces/checklist-group.interface';
import { ChecklistCategory, ChecklistCategoryResponse } from '../../../domain/interfaces/checklist-category.interface';
import { ChecklistQuestion, ChecklistQuestionResponse } from '../../../domain/interfaces/checklist-question.interface';
import { ChecklistType }                                from '../../../domain/enums/checklist-type.enum';
import { ChecklistScoreCalculator }                     from '../../../domain/models/checklist-score-calculator.model';
import { ChecklistExecution, ExecutionStatus }          from '../../../domain/interfaces/checklist-execution.interface';
import { NotyfService }                                 from '@shared/services/notyf.service';
import { PageHeaderComponent }                          from '@layout/components/page-header/page-header.component';
import { firstValueFrom }                               from 'rxjs';
import { toSignal }                                     from '@angular/core/rxjs-interop';

interface ExecutionFormData {
    categories: FormArray;
    vehicleId: FormControl<string>;
    userId: FormControl<string>;
    notes: FormControl<string>;
}

@Component({
    selector       : 'app-execution-form',
    standalone     : true,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatRadioModule,
        MatExpansionModule,
        MatProgressBarModule,
        MatDialogModule,
        MatSnackBarModule,
        MatSelectModule,
        MatTooltipModule,
        MatButtonToggleModule,
        RouterLink,
        PageHeaderComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './execution-form.component.html'
})
export class ExecutionFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly checklistService = inject(ChecklistService);
    private readonly notyf = inject(NotyfService);
    private readonly dialog = inject(MatDialog);

    // State
    currentTemplate = signal<ChecklistTemplate | null>(null);
    currentGroup = signal<ChecklistGroup | null>(null);
    isGroupExecution = computed(() => !!this.currentGroup());

    // Mock data - all available vehicles and users
    allVehicles = signal([
        {id: '1', name: 'Camión 001', plate: 'ABC-123', type: 'truck'},
        {id: '2', name: 'Camión 002', plate: 'DEF-456', type: 'truck'},
        {id: '3', name: 'Van 001', plate: 'GHI-789', type: 'van'},
        {id: '4', name: 'Sedán 001', plate: 'JKL-012', type: 'car'}
    ]);

    allUsers = signal([
        {id: '1', name: 'Juan Pérez', role: '1'}, // Conductor
        {id: '2', name: 'María García', role: '2'}, // Supervisor
        {id: '3', name: 'Carlos López', role: '3'}, // Inspector de calidad
        {id: '4', name: 'Ana Martínez', role: '4'}, // Técnico de mantenimiento
        {id: '5', name: 'Pedro Rodríguez', role: '1'}, // Conductor
    ]);

    // Computed filtered lists based on current template
    availableVehicles = computed(() => {
        const template = this.currentTemplate();
        if (!template || !template.vehicleTypes || template.vehicleTypes.length === 0) {
            return []; // Don't show vehicles if no vehicle types are specified
        }
        return this.allVehicles().filter(vehicle =>
            template.vehicleTypes!.includes(vehicle.type)
        );
    });

    availableUsers = computed(() => {
        const template = this.currentTemplate();
        if (!template || !template.userRoles || template.userRoles.length === 0) {
            return []; // Don't show users if no roles are specified
        }
        return this.allUsers().filter(user =>
            template.userRoles!.includes(user.role)
        );
    });

    // Form
    executionForm: FormGroup<ExecutionFormData> = this.fb.group({
        categories: this.fb.array([]),
        vehicleId: this.fb.control('', {nonNullable: true}),
        userId   : this.fb.control('', {nonNullable: true}),
        notes     : this.fb.control('', {nonNullable: true})
    });

    // Reactive form signals
    formValue = toSignal(this.executionForm.valueChanges, {initialValue: this.executionForm.value});
    formStatus = toSignal(this.executionForm.statusChanges, {initialValue: this.executionForm.status});

    // Computed scores
    templateScore = computed(() => {
        const template = this.currentTemplate();
        if (!template) return 0;

        const formVal = this.formValue();
        const categoryResponses = this.buildCategoryResponsesForScore(formVal?.categories || []);

        const categoryScores = template.categories.map(category =>
            ChecklistScoreCalculator.calculateCategoryScore(category, categoryResponses[category.id!] || [])
        );

        const templateScore = ChecklistScoreCalculator.calculateTemplateScore(template, categoryScores);
        return templateScore.score;
    });

    groupScore = computed(() => {
        if (!this.isGroupExecution()) return 0;

        const group = this.currentGroup();
        if (!group) return 0;

        // For group execution, calculate based on all templates in the group
        const templateScores = group.templates.map(template => {
            const categoryScores = template.categories.map(category =>
                ChecklistScoreCalculator.calculateCategoryScore(category, [])
            );
            return ChecklistScoreCalculator.calculateTemplateScore(template, categoryScores);
        });

        const groupScore = ChecklistScoreCalculator.calculateGroupScore(
            group.id!,
            group.name,
            group.weight,
            templateScores,
            group.performanceThreshold
        );

        return groupScore.score;
    });

    completionPercentage = computed(() => {
        const formVal = this.formValue();
        const categories = formVal?.categories || [];

        let totalQuestions = 0;
        let answeredQuestions = 0;

        categories.forEach((category: any) => {
            if (category.questions) {
                category.questions.forEach((question: any) => {
                    totalQuestions++;
                    if (question.complianceStatus) {
                        answeredQuestions++;
                    }
                });
            }
        });

        return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    });

    canSubmit = computed(() => {
        return this.formStatus() === 'VALID' && this.completionPercentage() === 100;
    });

    // State for tracking open comment sections
    private openCommentSections = signal<Set<string>>(new Set());

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            // Get the type from the URL path - should be the segment before the ID
            const urlSegments = this.route.snapshot.url;
            const type = urlSegments.find(segment => segment.path === 'template' || segment.path === 'group')?.path;
            const id = params['id'];

            if (type === 'template' && id) {
                this.loadTemplate(id);
            } else if (type === 'group' && id) {
                this.loadGroup(id);
            } else {
                console.error('Invalid route configuration. Expected /template/{id} or /group/{id}');
                this.notyf.error('Configuración de ruta inválida');
            }
        });
    }

    private loadTemplate(id: string): void {
        void firstValueFrom(this.checklistService.getTemplate(id))
            .then((template) => {
                if (!template) throw new Error('Template not found');
                if (!template.categories || template.categories.length === 0) {
                    console.warn('Template has no categories:', template);
                    this.notyf.error('La plantilla no tiene categorías configuradas');
                    return;
                }

                if (template.vehicleTypes.length > 0) {
                    this.executionForm.get('vehicleId')?.setValidators([ Validators.required ]);
                }

                if (template.userRoles.length > 0) {
                    this.executionForm.get('userId')?.setValidators([ Validators.required ]);
                }

                this.currentTemplate.set(template);
                this.buildForm(template.categories);
            })
            .catch((error) => {
                console.error('Error loading template:', error);
                this.notyf.error('Error al cargar la plantilla del checklist');
                this.router.navigate([ '/checklists/execute' ]);
            });
    }

    private loadGroup(id: string): void {
        void firstValueFrom(this.checklistService.getGroup(id))
            .then((group) => {
                if (!group) {
                    throw new Error('Group not found');
                }
                if (!group.templates || group.templates.length === 0) {
                    console.warn('Group has no templates:', group);
                    this.notyf.error('El grupo no tiene plantillas asignadas');
                    return;
                }
                this.currentGroup.set(group);
                // For group execution, we'll execute the first template or allow selection
                const firstTemplate = group.templates[0];
                if (!firstTemplate.categories || firstTemplate.categories.length === 0) {
                    console.warn('First template in group has no categories:', firstTemplate);
                    this.notyf.error('La plantilla del grupo no tiene categorías configuradas');
                    return;
                }
                this.currentTemplate.set(firstTemplate);
                this.buildForm(firstTemplate.categories);
            })
            .catch((error) => {
                console.error('Error loading group:', error);
                this.notyf.error('Error al cargar el grupo de checklists');
                this.router.navigate([ '/checklists/execute' ]);
            });
    }

    private buildForm(categories: ChecklistCategory[]): void {
        const categoriesArray = this.fb.array(
            categories.map(category => this.createCategoryFormGroup(category))
        );

        console.log('Building form with categories:', categoriesArray.value);
        this.executionForm.setControl('categories', categoriesArray, {emitEvent: true});

        console.log('Execution form built:', this.executionForm.value);
    }

    private createCategoryFormGroup(category: ChecklistCategory): FormGroup {
        return this.fb.group({
            categoryId: [ category.id ],
            questions : this.fb.array(
                category.questions.map(question => this.createQuestionFormGroup(question))
            )
        });
    }

    private createQuestionFormGroup(question: ChecklistQuestion): FormGroup {
        return this.fb.group({
            questionId      : [ question.id ],
            complianceStatus: [ '', question.required ? [ Validators.required ] : [] ],
            evidenceFile    : [ null ],
            comment         : [ '' ]
        });
    }

    categoriesFormArray(): FormArray {
        return this.executionForm.get('categories') as FormArray;
    }

    getQuestionsFormArray(categoryIndex: number): FormArray {
        return this.categoriesFormArray().at(categoryIndex).get('questions') as FormArray;
    }

    getQuestionIndices(categoryIndex: number): number[] {
        const questionsArray = this.getQuestionsFormArray(categoryIndex);
        return Array.from({length: questionsArray.length}, (_, i) => i);
    }

    getCategory(index: number): ChecklistCategory | undefined {
        return this.currentTemplate()?.categories[index];
    }

    getQuestion(categoryIndex: number, questionIndex: number): ChecklistQuestion | undefined {
        return this.currentTemplate()?.categories[categoryIndex]?.questions[questionIndex];
    }

    getCategoryCompletion(categoryIndex: number): number {
        const questionsArray = this.getQuestionsFormArray(categoryIndex);
        const totalQuestions = questionsArray.length;
        const answeredQuestions = questionsArray.controls.filter(
            control => control.get('complianceStatus')?.value
        ).length;

        return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    }

    getCategoryCompletionText(categoryIndex: number): string {
        const questionsArray = this.getQuestionsFormArray(categoryIndex);
        const totalQuestions = questionsArray.length;
        const answeredQuestions = questionsArray.controls.filter(
            control => control.get('complianceStatus')?.value
        ).length;

        return `${ answeredQuestions }/${ totalQuestions } completadas`;
    }

    private buildCategoryResponses(): ChecklistCategoryResponse[] {
        const formValue = this.executionForm.value;
        const categoryResponses: ChecklistCategoryResponse[] = [];

        if (formValue.categories) {
            formValue.categories.forEach((category: any, categoryIndex: number) => {
                const categoryData = this.getCategory(categoryIndex);
                if (categoryData?.id && category.questions) {
                    const responses: ChecklistQuestionResponse[] = category.questions.map((question: any, questionIndex: number) => {
                        const questionData = this.getQuestion(categoryIndex, questionIndex);
                        return {
                            questionId: questionData?.id!,
                            value     : question.complianceStatus ? Number(question.complianceStatus) : null,
                            timestamp : new Date(),
                            files     : question.evidenceFile ? [ question.evidenceFile ] : [],
                            comment   : question.comment || ''
                        };
                    });

                    categoryResponses.push({
                        categoryId : categoryData.id,
                        responses  : responses,
                        completedAt: new Date()
                    });
                }
            });
        }

        return categoryResponses;
    }

    private buildCategoryResponsesForScore(categories: any[]): Record<string, ChecklistQuestionResponse[]> {
        const responses: Record<string, ChecklistQuestionResponse[]> = {};

        categories.forEach((category, categoryIndex) => {
            const categoryId = this.getCategory(categoryIndex)?.id;
            if (categoryId && category.questions) {
                responses[categoryId] = category.questions.map((question: any, questionIndex: number) => ({
                    questionId: this.getQuestion(categoryIndex, questionIndex)?.id!,
                    value     : question.complianceStatus ? Number(question.complianceStatus) : null,
                    timestamp : new Date(),
                    files     : question.evidenceFile ? [ question.evidenceFile ] : []
                }));
            }
        });

        return responses;
    }

    onSubmit(): void {
        if (!this.canSubmit()) return;

        const template = this.currentTemplate();
        if (!template) return;

        // Check if score is below threshold for final type
        const score = this.templateScore();
        const threshold = template.performanceThreshold ? template.performanceThreshold / 100 : 0.7;

        if (template.type === ChecklistType.QUALITY && score < threshold) {
            this.showLowScoreWarning(score, threshold);
            return;
        }

        this.submitExecution();
    }

    private showLowScoreWarning(score: number, threshold: number): void {
        // Simple confirmation dialog for now - can be replaced with custom modal
        const message = `El score obtenido (${ (score * 100).toFixed(1) }%) está por debajo del umbral requerido (${ (threshold * 100).toFixed(1) }%). ¿Desea continuar?`;

        if (confirm(message)) {
            this.submitExecution();
        }
    }

    private submitExecution(): void {
        const formValue = this.executionForm.value;
        const template = this.currentTemplate();

        if (template?.vehicleTypes?.length > 0 && !formValue.vehicleId) {
            this.notyf.error('Debe seleccionar un vehículo válido para esta plantilla');
            return;
        }

        if (template?.userRoles?.length > 0 && !formValue.userId) {
            this.notyf.error('Debe seleccionar un usuario válido para esta plantilla');
            return;
        }

        const execution: Omit<ChecklistExecution, 'id'> = {
            templateId       : template.id,
            groupId          : this.currentGroup()?.id,
            vehicleId        : formValue.vehicleId,
            userId           : formValue.userId,
            status           : ExecutionStatus.COMPLETED,
            startedAt        : new Date(),
            completedAt      : new Date(),
            categoryResponses: this.buildCategoryResponses(),
            overallScore     : this.templateScore(),
            passed           : this.templateScore() >= (template.performanceThreshold ? template.performanceThreshold / 100 : 0.7),
            notes            : formValue.notes || undefined
        };

        this.checklistService.createExecution(execution).subscribe({
            next : (createdExecution) => {
                this.notyf.success('Ejecución completada exitosamente');
                this.router.navigate([ '/checklists/reports', createdExecution.id ]);
            },
            error: (error) => {
                this.notyf.error('Error al completar la ejecución');
            }
        });
    }

    saveDraft(): void {
        // Implementation for saving draft
        this.notyf.success('Borrador guardado');
    }

    cancel(): void {
        this.router.navigate([ '/checklists/execute' ]);
    }

    // File handling methods
    onFileSelected(event: Event, categoryIndex: number, questionIndex: number): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.notyf.error('Solo se permiten archivos de imagen');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                this.notyf.error('El archivo no puede ser mayor a 5MB');
                return;
            }

            // Update form control
            const questionFormGroup = this.getQuestionsFormArray(categoryIndex).at(questionIndex);
            questionFormGroup.get('evidenceFile')?.setValue(file);

            this.notyf.success('Imagen adjuntada correctamente');
        }

        // Reset input value to allow selecting the same file again
        input.value = '';
    }

    removeFile(categoryIndex: number, questionIndex: number): void {
        const questionFormGroup = this.getQuestionsFormArray(categoryIndex).at(questionIndex);
        questionFormGroup.get('evidenceFile')?.setValue(null);
        this.notyf.success('Imagen removida');
    }

    // Comment section methods
    toggleCommentSection(categoryIndex: number, questionIndex: number): void {
        const key = `${ categoryIndex }-${ questionIndex }`;
        const currentSections = this.openCommentSections();
        const newSections = new Set(currentSections);

        if (newSections.has(key)) {
            newSections.delete(key);
        } else {
            newSections.add(key);
        }

        this.openCommentSections.set(newSections);
    }

    isCommentSectionOpen(categoryIndex: number, questionIndex: number): boolean {
        const key = `${ categoryIndex }-${ questionIndex }`;
        return this.openCommentSections().has(key);
    }

    protected readonly Number = Number;
}
