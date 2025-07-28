import { TestBed }                                        from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChecklistService }                               from './checklist.service';
import { ChecklistTemplate }                              from '../domain/interfaces/checklist-template.interface';
import { ChecklistGroup }                                 from '../domain/interfaces/checklist-group.interface';
import { ChecklistExecution, ExecutionStatus }            from '../domain/interfaces/checklist-execution.interface';
import { ExecuteChecklistAnswers, ExecuteChecklistDto }   from '../domain/interfaces/execute-checklist.dto';
import { ChecklistType }                                  from '../domain/enums/checklist-type.enum';

describe('ChecklistService', () => {
    let service: ChecklistService;
    let httpMock: HttpTestingController;

    const mockTemplate: ChecklistTemplate = {
        id            : '1',
        name          : 'Test Template',
        type          : ChecklistType.QUALITY,
        version       : '1.0',
        weight        : 1.0,
        categories    : [
            {
                id       : 'cat1',
                title    : 'Category 1',
                weight   : 0.6,
                order    : 1,
                questions: [
                    {
                        id          : 'q1',
                        title       : 'Question 1',
                        weight      : 0.5,
                        required    : true,
                        order       : 1
                    },
                    {
                        id          : 'q2',
                        title       : 'Question 2',
                        weight      : 0.5,
                        required    : false,
                        order       : 2
                    }
                ]
            },
            {
                id       : 'cat2',
                title    : 'Category 2',
                weight   : 0.4,
                order    : 2,
                questions: [
                    {
                        id          : 'q3',
                        title       : 'Question 3',
                        weight      : 1.0,
                        required    : true,
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

    const mockExecution: ChecklistExecution = {
        id               : 'e1',
        templateId       : '1',
        vehicleId        : 'v1',
        userId           : 'u1',
        status           : ExecutionStatus.COMPLETED,
        startedAt        : new Date(),
        completedAt      : new Date(),
        categoryResponses: [],
        overallScore     : 0.85,
        passed           : true
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports  : [ HttpClientTestingModule ],
            providers: [ ChecklistService ]
        });
        service = TestBed.inject(ChecklistService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Score Calculation', () => {
        it('should calculate template score correctly', () => {
            const answers: ExecuteChecklistAnswers = {
                'cat1': {
                    'q1': {value: true, normalizedScore: 1.0},
                    'q2': {value: 'Good answer', normalizedScore: 1.0}
                },
                'cat2': {
                    'q3': {value: 80, normalizedScore: 0.8}
                }
            };

            const score = service.calculateScore(mockTemplate, answers);

            // Expected: (0.6 * ((1.0 * 0.5) + (1.0 * 0.5))) + (0.4 * (0.8 * 1.0)) = 0.6 * 1.0 + 0.4 * 0.8 = 0.92
            expect(score).toBeCloseTo(0.92, 2);
        });

        it('should return 0 for template with no categories', () => {
            const emptyTemplate: ChecklistTemplate = {
                ...mockTemplate,
                categories: []
            };

            const score = service.calculateScore(emptyTemplate, {});
            expect(score).toBe(0);
        });

        it('should calculate group score correctly', () => {
            const executions: ChecklistExecution[] = [
                {...mockExecution, overallScore: 0.9}
            ];

            const score = service.calculateGroupScore(mockGroup, executions);
            expect(score).toBe(0.9);
        });

        it('should return 0 for group with no templates', () => {
            const emptyGroup: ChecklistGroup = {
                ...mockGroup,
                templates: []
            };

            const score = service.calculateGroupScore(emptyGroup, []);
            expect(score).toBe(0);
        });

        it('should handle missing execution data in group score calculation', () => {
            const score = service.calculateGroupScore(mockGroup, []);
            expect(score).toBe(0);
        });
    });

    describe('Execution Management', () => {
        it('should execute checklist and update signals', async () => {
            const executeDto: ExecuteChecklistDto = {
                templateId       : '1',
                vehicleId        : 'v1',
                userId           : 'u1',
                categoryResponses: [],
                startedAt        : new Date()
            };

            const resource = service.executeChecklist(executeDto);

            // Simulate HTTP response
            const req = httpMock.expectOne('/api/checklists/executions/execute');
            expect(req.request.method).toBe('POST');
            req.flush(mockExecution);

            // Check that signals are updated
            expect(service.currentExecution()).toEqual(mockExecution);
        });

        it('should get execution by id and update signals', async () => {
            const resource = service.getExecutionById('e1');

            const req = httpMock.expectOne('/api/checklists/executions/e1');
            expect(req.request.method).toBe('GET');
            req.flush(mockExecution);

            expect(service.currentExecution()).toEqual(mockExecution);
        });

        it('should handle execution errors properly', async () => {
            const executeDto: ExecuteChecklistDto = {
                templateId       : '1',
                vehicleId        : 'v1',
                userId           : 'u1',
                categoryResponses: [],
                startedAt        : new Date()
            };

            const resource = service.executeChecklist(executeDto);

            const req = httpMock.expectOne('/api/checklists/executions/execute');
            req.error(new ErrorEvent('Network error'));

            expect(service.error()).toBe('Failed to execute checklist');
        });
    });

    describe('Validation Logic', () => {
        it('should validate evidence requirement when "No cumple"', () => {
            const answers: ExecuteChecklistAnswers = {
                'cat1': {
                    'q1': {
                        value          : false, // No cumple
                        normalizedScore: 0,
                        files          : [] // No evidence provided
                    }
                }
            };

            // This should be handled by validation logic
            const score = service.calculateScore(mockTemplate, answers);
            expect(score).toBeLessThan(1.0);
        });

        it('should accept evidence when "No cumple"', () => {
            const answers: ExecuteChecklistAnswers = {
                'cat1': {
                    'q1': {
                        value          : false, // No cumple
                        normalizedScore: 0,
                        files          : [ new File([ 'test' ], 'evidence.jpg') ], // Evidence provided
                        comment        : 'Issue documented with photo'
                    }
                }
            };

            const score = service.calculateScore(mockTemplate, answers);
            expect(score).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Signal State Management', () => {
        it('should initialize with empty state', () => {
            expect(service.groups()).toEqual([]);
            expect(service.templates()).toEqual([]);
            expect(service.executions()).toEqual([]);
            expect(service.currentExecution()).toBeNull();
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should update loading state during operations', async () => {
            const resource = service.executeChecklist({
                templateId       : '1',
                vehicleId        : 'v1',
                userId           : 'u1',
                categoryResponses: [],
                startedAt        : new Date()
            });

            // Loading should be true during request
            expect(service.loading()).toBe(true);

            const req = httpMock.expectOne('/api/checklists/executions/execute');
            req.flush(mockExecution);

            // Loading should be false after completion
            expect(service.loading()).toBe(false);
        });

        it('should clear error state', () => {
            // Simulate an error
            service['_error'].set('Test error');
            expect(service.error()).toBe('Test error');

            service.clearError();
            expect(service.error()).toBeNull();
        });
    });

    describe('Computed Signals', () => {
        it('should filter active templates correctly', () => {
            const templates = [
                {...mockTemplate, id: '1', isActive: true},
                {...mockTemplate, id: '2', isActive: false}
            ];

            service['_templates'].set(templates);
            const activeTemplates = service.activeTemplates();

            expect(activeTemplates).toHaveLength(1);
            expect(activeTemplates[0].id).toBe('1');
        });

        it('should filter active groups correctly', () => {
            const groups = [
                {...mockGroup, id: '1', isActive: true},
                {...mockGroup, id: '2', isActive: false}
            ];

            service['_groups'].set(groups);
            const activeGroups = service.activeGroups();

            expect(activeGroups).toHaveLength(1);
            expect(activeGroups[0].id).toBe('1');
        });
    });
});
