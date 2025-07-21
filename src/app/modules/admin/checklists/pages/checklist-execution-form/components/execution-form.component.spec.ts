import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule }       from '@angular/forms';
import { ActivatedRoute, Router }    from '@angular/router';
import { NoopAnimationsModule }      from '@angular/platform-browser/animations';
import { signal }                    from '@angular/core';
import { of, throwError }            from 'rxjs';

import { ExecutionFormComponent } from './execution-form.component';
import { ChecklistService }       from '../../../services/checklist.service';
import { NotyfService }           from '@shared/services/notyf.service';
import { ChecklistTemplate }      from '../../../domain/interfaces/checklist-template.interface';
import { ChecklistGroup }         from '../../../domain/interfaces/checklist-group.interface';
import { ChecklistType }          from '../../../domain/enums/checklist-type.enum';
import { ResponseType }           from '../../../domain/enums/response-type.enum';
import { ExecutionStatus }        from '../../../domain/interfaces/checklist-execution.interface';

// Angular Material Modules
import { MatCardModule }        from '@angular/material/card';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatRadioModule }       from '@angular/material/radio';
import { MatExpansionModule }   from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule }      from '@angular/material/dialog';
import { MatSnackBarModule }    from '@angular/material/snack-bar';
import { MatSelectModule }      from '@angular/material/select';

describe('ExecutionFormComponent', () => {
    let component: ExecutionFormComponent;
    let fixture: ComponentFixture<ExecutionFormComponent>;
    let mockChecklistService: jasmine.SpyObj<ChecklistService>;
    let mockNotyfService: jasmine.SpyObj<NotyfService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: any;

    const mockTemplate: ChecklistTemplate = {
        id            : '1',
        name          : 'Test Template',
        type          : ChecklistType.QUALITY,
        version       : '1.0',
        weight        : 1.0,
        categories    : [
            {
                id         : 'cat1',
                title      : 'Safety Category',
                description: 'Safety related questions',
                weight     : 0.6,
                order      : 1,
                questions  : [
                    {
                        id          : 'q1',
                        title       : 'Are safety protocols followed?',
                        description : 'Check if all safety measures are in place',
                        weight      : 0.5,
                        required    : true,
                        responseType: ResponseType.CHECKBOX,
                        order       : 1
                    },
                    {
                        id          : 'q2',
                        title       : 'Additional safety notes',
                        weight      : 0.5,
                        required    : false,
                        responseType: ResponseType.TEXT,
                        order       : 2
                    }
                ]
            },
            {
                id       : 'cat2',
                title    : 'Quality Category',
                weight   : 0.4,
                order    : 2,
                questions: [
                    {
                        id          : 'q3',
                        title       : 'Quality score (0-100)',
                        weight      : 1.0,
                        required    : true,
                        responseType: ResponseType.NUMERIC,
                        numericRange: {min: 0, max: 100},
                        order       : 1
                    }
                ]
            }
        ],
        vehicleIds    : [ 'v1' ],
        roleIds       : [ 'r1' ],
        isActive      : true,
        scoreThreshold: 0.7
    };

    const mockGroup: ChecklistGroup = {
        id            : 'g1',
        name          : 'Test Group',
        weight        : 1.0,
        templates     : [ mockTemplate ],
        isActive      : true,
        scoreThreshold: 0.8
    };

    beforeEach(async () => {
        const checklistServiceSpy = jasmine.createSpyObj('ChecklistService', [
            'getTemplate',
            'getGroup',
            'createExecution'
        ]);
        const notyfServiceSpy = jasmine.createSpyObj('NotyfService', [ 'success', 'error' ]);
        const routerSpy = jasmine.createSpyObj('Router', [ 'navigate' ]);

        mockActivatedRoute = {
            params  : of({id: '1'}),
            snapshot: {
                url: [ {path: 'template'}, {path: '1'} ]
            }
        };

        await TestBed.configureTestingModule({
            imports  : [
                ExecutionFormComponent,
                ReactiveFormsModule,
                NoopAnimationsModule,
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
                MatSelectModule
            ],
            providers: [
                {provide: ChecklistService, useValue: checklistServiceSpy},
                {provide: NotyfService, useValue: notyfServiceSpy},
                {provide: Router, useValue: routerSpy},
                {provide: ActivatedRoute, useValue: mockActivatedRoute}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ExecutionFormComponent);
        component = fixture.componentInstance;
        mockChecklistService = TestBed.inject(ChecklistService) as jasmine.SpyObj<ChecklistService>;
        mockNotyfService = TestBed.inject(NotyfService) as jasmine.SpyObj<NotyfService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should load template on init for template execution', () => {
            mockChecklistService.getTemplate.and.returnValue(of(mockTemplate));

            component.ngOnInit();

            expect(mockChecklistService.getTemplate).toHaveBeenCalledWith('1');
            expect(component.currentTemplate()).toEqual(mockTemplate);
            expect(component.isGroupExecution()).toBe(false);
        });

        it('should load group on init for group execution', () => {
            mockActivatedRoute.snapshot.url = [ {path: 'group'}, {path: '1'} ];
            mockChecklistService.getGroup.and.returnValue(of(mockGroup));

            component.ngOnInit();

            expect(mockChecklistService.getGroup).toHaveBeenCalledWith('1');
            expect(component.currentGroup()).toEqual(mockGroup);
            expect(component.isGroupExecution()).toBe(true);
        });

        it('should build form correctly when template is loaded', () => {
            mockChecklistService.getTemplate.and.returnValue(of(mockTemplate));

            component.ngOnInit();

            expect(component.executionForm.get('categories')).toBeTruthy();
            expect(component.categoriesFormArray().length).toBe(2);
            expect(component.executionForm.get('vehicleId')).toBeTruthy();
            expect(component.executionForm.get('notes')).toBeTruthy();
        });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            mockChecklistService.getTemplate.and.returnValue(of(mockTemplate));
            component.ngOnInit();
            fixture.detectChanges();
        });

        it('should require vehicle selection', () => {
            const vehicleControl = component.executionForm.get('vehicleId');
            expect(vehicleControl?.hasError('required')).toBe(true);

            vehicleControl?.setValue('v1');
            expect(vehicleControl?.hasError('required')).toBe(false);
        });

        it('should validate required questions', () => {
            const firstCategoryQuestions = component.getQuestionsFormArray(0);
            const requiredQuestion = firstCategoryQuestions.at(0);

            expect(requiredQuestion.get('complianceStatus')?.hasError('required')).toBe(true);

            requiredQuestion.get('complianceStatus')?.setValue('complies');
            expect(requiredQuestion.get('complianceStatus')?.hasError('required')).toBe(false);
        });

        it('should not allow submission with incomplete form', () => {
            expect(component.canSubmit()).toBe(false);
        });

        it('should allow submission with complete form', () => {
            // Fill required fields
            component.executionForm.get('vehicleId')?.setValue('v1');

            // Fill all required questions
            const categories = component.categoriesFormArray();
            categories.controls.forEach((categoryControl, categoryIndex) => {
                const questions = component.getQuestionsFormArray(categoryIndex);
                questions.controls.forEach((questionControl, questionIndex) => {
                    const question = component.getQuestion(categoryIndex, questionIndex);
                    if (question?.required) {
                        questionControl.get('complianceStatus')?.setValue('complies');
                    }
                });
            });

            fixture.detectChanges();
            expect(component.canSubmit()).toBe(true);
        });
    });

    describe('Score Calculation', () => {
        beforeEach(() => {
            mockChecklistService.getTemplate.and.returnValue(of(mockTemplate));
            component.ngOnInit();
            fixture.detectChanges();
        });

        it('should calculate template score correctly', () => {
            // Set up form with answers
            component.executionForm.get('vehicleId')?.setValue('v1');

            const categories = component.categoriesFormArray();

            // Category 1 - both questions compliant
            const cat1Questions = component.getQuestionsFormArray(0);
            cat1Questions.at(0).get('complianceStatus')?.setValue('complies');
            cat1Questions.at(1).get('complianceStatus')?.setValue('complies');

            // Category 2 - question compliant
            const cat2Questions = component.getQuestionsFormArray(1);
            cat2Questions.at(0).get('complianceStatus')?.setValue('complies');

            fixture.detectChanges();

            // Should calculate a score > 0
            expect(component.templateScore()).toBeGreaterThan(0);
        });

        it('should calculate completion percentage correctly', () => {
            component.executionForm.get('vehicleId')?.setValue('v1');

            // Answer half the questions
            const cat1Questions = component.getQuestionsFormArray(0);
            cat1Questions.at(0).get('complianceStatus')?.setValue('complies');

            fixture.detectChanges();

            // Should be around 33% (1 out of 3 questions)
            expect(component.completionPercentage()).toBeCloseTo(33.33, 1);
        });

        it('should show 100% completion when all questions answered', () => {
            component.executionForm.get('vehicleId')?.setValue('v1');

            // Answer all questions
            const categories = component.categoriesFormArray();
            categories.controls.forEach((categoryControl, categoryIndex) => {
                const questions = component.getQuestionsFormArray(categoryIndex);
                questions.controls.forEach(questionControl => {
                    questionControl.get('complianceStatus')?.setValue('complies');
                });
            });

            fixture.detectChanges();

            expect(component.completionPercentage()).toBe(100);
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            mockChecklistService.getTemplate.and.returnValue(of(mockTemplate));
            component.ngOnInit();
            fixture.detectChanges();

            // Set up complete form
            component.executionForm.get('vehicleId')?.setValue('v1');
            const categories = component.categoriesFormArray();
            categories.controls.forEach((categoryControl, categoryIndex) => {
                const questions = component.getQuestionsFormArray(categoryIndex);
                questions.controls.forEach(questionControl => {
                    questionControl.get('complianceStatus')?.setValue('complies');
                });
            });
        });

        it('should submit execution successfully', () => {
            const mockExecution = {
                id               : 'e1',
                templateId       : '1',
                vehicleId        : 'v1',
                userId           : 'current-user-id',
                status           : ExecutionStatus.COMPLETED,
                startedAt        : new Date(),
                completedAt      : new Date(),
                categoryResponses: [],
                overallScore     : 0.85,
                passed           : true
            };

            mockChecklistService.createExecution.and.returnValue(of(mockExecution));

            component.onSubmit();

            expect(mockChecklistService.createExecution).toHaveBeenCalled();
            expect(mockNotyfService.success).toHaveBeenCalledWith('Ejecución completada exitosamente');
            expect(mockRouter.navigate).toHaveBeenCalledWith([ '/admin/checklists/reports', 'e1' ]);
        });

        it('should handle submission errors', () => {
            mockChecklistService.createExecution.and.returnValue(throwError('Network error'));

            component.onSubmit();

            expect(mockNotyfService.error).toHaveBeenCalledWith('Error al completar la ejecución');
        });

        it('should show low score warning for quality checklists', () => {
            // Set up low score scenario
            const categories = component.categoriesFormArray();
            const cat1Questions = component.getQuestionsFormArray(0);
            cat1Questions.at(0).get('complianceStatus')?.setValue('not_complies');
            cat1Questions.at(1).get('complianceStatus')?.setValue('not_complies');

            const cat2Questions = component.getQuestionsFormArray(1);
            cat2Questions.at(0).get('complianceStatus')?.setValue('not_complies');

            spyOn(window, 'confirm').and.returnValue(false);

            component.onSubmit();

            expect(window.confirm).toHaveBeenCalled();
            expect(mockChecklistService.createExecution).not.toHaveBeenCalled();
        });
    });

    describe('Signal Updates', () => {
        it('should update signals when template changes', () => {
            const newTemplate = {...mockTemplate, name: 'Updated Template'};
            mockChecklistService.getTemplate.and.returnValue(of(newTemplate));

            component.ngOnInit();

            expect(component.currentTemplate()).toEqual(newTemplate);
        });

        it('should update signals when group changes', () => {
            mockActivatedRoute.snapshot.url = [ {path: 'group'}, {path: '1'} ];
            const newGroup = {...mockGroup, name: 'Updated Group'};
            mockChecklistService.getGroup.and.returnValue(of(newGroup));

            component.ngOnInit();

            expect(component.currentGroup()).toEqual(newGroup);
        });
    });

    describe('Helper Methods', () => {
        beforeEach(() => {
            mockChecklistService.getTemplate.and.returnValue(of(mockTemplate));
            component.ngOnInit();
            fixture.detectChanges();
        });

        it('should get category correctly', () => {
            const category = component.getCategory(0);
            expect(category?.title).toBe('Safety Category');
        });

        it('should get question correctly', () => {
            const question = component.getQuestion(0, 0);
            expect(question?.title).toBe('Are safety protocols followed?');
        });

        it('should calculate category completion correctly', () => {
            // Answer one question in first category
            const cat1Questions = component.getQuestionsFormArray(0);
            cat1Questions.at(0).get('complianceStatus')?.setValue('complies');

            const completion = component.getCategoryCompletion(0);
            expect(completion).toBe(50); // 1 out of 2 questions
        });

        it('should get category completion text correctly', () => {
            const text = component.getCategoryCompletionText(0);
            expect(text).toBe('0/2 completadas');

            // Answer one question
            const cat1Questions = component.getQuestionsFormArray(0);
            cat1Questions.at(0).get('complianceStatus')?.setValue('complies');

            const updatedText = component.getCategoryCompletionText(0);
            expect(updatedText).toBe('1/2 completadas');
        });
    });

    describe('Navigation', () => {
        it('should navigate to execution selector on cancel', () => {
            component.cancel();
            expect(mockRouter.navigate).toHaveBeenCalledWith([ '/admin/checklists/execute' ]);
        });

        it('should save draft successfully', () => {
            component.saveDraft();
            expect(mockNotyfService.success).toHaveBeenCalledWith('Borrador guardado');
        });
    });
});
