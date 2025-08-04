import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient }                                      from '@angular/common/http';
import { catchError, firstValueFrom, Observable, of, tap } from 'rxjs';
import { memoize }                                                from '@shared/decorators/memoize/memoize.decorator';

import { ChecklistGroup, ChecklistGroupValidation }     from '../domain/interfaces/checklist-group.interface';
import { ChecklistTemplate }                            from '../domain/interfaces/checklist-template.interface';
import { ChecklistExecution, ChecklistExecutionReport } from '../domain/interfaces/checklist-execution.interface';
import { ChecklistScoreCalculator }                     from '../domain/models/checklist-score-calculator.model';
import { ChecklistType }                                from '../domain/enums/checklist-type.enum';
import { ExecuteChecklistAnswers, ExecuteChecklistDto } from '../domain/interfaces/execute-checklist.dto';
import { CreateChecklistExecutionDto }                            from '../domain/interfaces/checklist-execution-dto.interface';
import { CreateChecklistTemplateDto, UpdateChecklistTemplateDto } from '../domain/interfaces/checklist-template-dto.interface';
import { CreateChecklistGroupDto, UpdateChecklistGroupDto }       from '../domain/interfaces/checklist-group-dto.interface';
import { FindCount }                                    from '@shared/domain/model/find-count';

export interface ChecklistFilters {
    type?: ChecklistType;
    vehicleId?: string;
    roleId?: string;
    groupId?: string;
    isActive?: boolean;
    search?: string;
}

export interface PaginationParams {
    page: number;
    size: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

@Injectable({
    providedIn: 'root'
})
export class ChecklistService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/checklists';

    // Signal-based state management
    private readonly _groups = signal<ChecklistGroup[]>([]);
    private readonly _templates = signal<ChecklistTemplate[]>([]);
    private readonly _executions = signal<ChecklistExecution[]>([]);
    private readonly _loading = signal<boolean>(false);
    private readonly _error = signal<string | null>(null);

    // Execution state management
    private readonly _executionSignal = signal<ChecklistExecution | null>(null);

    // Filters and pagination
    private readonly _groupFilters = signal<ChecklistFilters>({});
    private readonly _templateFilters = signal<ChecklistFilters>({});
    private readonly _executionFilters = signal<ChecklistFilters>({});
    private readonly _pagination = signal<PaginationParams>({page: 0, size: 10});

    // Public readonly signals
    readonly groups = this._groups.asReadonly();
    readonly templates = this._templates.asReadonly();
    readonly executions = this._executions.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly currentExecution = this._executionSignal.asReadonly();

    // Computed signals
    readonly filteredGroups = computed(() => {
        const groups = this._groups();
        const filters = this._groupFilters();

        return groups.filter(group => {
            if (filters.search && !group.name.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.isActive !== undefined && group.isActive !== filters.isActive) {
                return false;
            }
            return true;
        });
    });

    readonly filteredTemplates = computed(() => {
        const templates = this._templates();
        const filters = this._templateFilters();

        return templates.filter(template => {
            if (filters.type && template.type !== filters.type) {
                return false;
            }
            if (filters.groupId && template.groupId !== filters.groupId) {
                return false;
            }
            if (filters.vehicleId && !template.vehicleTypes?.includes(filters.vehicleId)) {
                return false;
            }
            if (filters.roleId && !template.userRoles?.includes(filters.roleId)) {
                return false;
            }
            if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.isActive !== undefined && template.isActive !== filters.isActive) {
                return false;
            }
            return true;
        });
    });

    readonly activeGroups = computed(() => this._groups().filter(g => g.isActive));
    readonly activeTemplates = computed(() => this._templates().filter(t => t.isActive));

    // Group Management
    loadGroups(): Observable<FindCount<ChecklistGroup>> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<FindCount<ChecklistGroup>>(`${ this.baseUrl }/groups`).pipe(
            tap(groups => {
                this._groups.set(groups.items);
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to load checklist groups');
                this._loading.set(false);
                return of({total: 0, items: []});
            })
        );
    }

    createGroup(group: CreateChecklistGroupDto): Observable<ChecklistGroup> {
        this._loading.set(true);
        return this.http.post<ChecklistGroup>(`${ this.baseUrl }/groups`, group).pipe(
            tap(newGroup => {
                this._groups.update(groups => [ ...groups, newGroup ]);
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to create checklist group');
                this._loading.set(false);
                throw error;
            })
        );
    }

    updateGroup(id: string, group: CreateChecklistGroupDto): Observable<ChecklistGroup> {
        this._loading.set(true);
        return this.http.put<ChecklistGroup>(`${ this.baseUrl }/groups/${ id }`, group).pipe(
            tap(updatedGroup => {
                this._groups.update(groups =>
                    groups.map(g => g.id === id ? updatedGroup : g)
                );
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to update checklist group');
                this._loading.set(false);
                throw error;
            })
        );
    }

    toggleGroupStatus(id: string, isActive: boolean): Observable<ChecklistGroup> {
        this._loading.set(true);
        return this.http.patch<ChecklistGroup>(`${ this.baseUrl }/groups/${ id }/status`, {isActive}).pipe(
            tap(updatedGroup => {
                this._groups.update(groups =>
                    groups.map(g => g.id === id ? updatedGroup : g)
                );
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to toggle group status');
                this._loading.set(false);
                throw error;
            })
        );
    }

    deleteGroup(id: string): Observable<void> {
        this._loading.set(true);
        return this.http.delete<void>(`${ this.baseUrl }/groups/${ id }`).pipe(
            tap(() => {
                this._groups.update(groups => groups.filter(g => g.id !== id));
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to delete checklist group');
                this._loading.set(false);
                throw error;
            })
        );
    }

    validateGroup(group: ChecklistGroup): ChecklistGroupValidation {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!group.name?.trim()) {
            errors.push('Group name is required');
        }

        if (group.weight < 0 || group.weight > 1) {
            errors.push('Group weight must be between 0 and 1');
        }

        const templateWeights = group.templates.map(t => t.weight);
        const totalWeight = templateWeights.reduce((sum, w) => sum + w, 0);

        if (!ChecklistScoreCalculator.validateWeights(templateWeights)) {
            errors.push('Template weights must sum to 1.0');
        }

        if (group.templates.length === 0) {
            warnings.push('Group has no templates assigned');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            totalWeight
        };
    }

    // Template Management
    loadTemplates(): Observable<FindCount<ChecklistTemplate>> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<FindCount<ChecklistTemplate>>(`${ this.baseUrl }/templates`).pipe(
            tap(templates => {
                this._templates.set(templates.items);
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to load checklist templates');
                this._loading.set(false);
                return of({total: 0, items: []});
            })
        );
    }

    createTemplate(template: CreateChecklistTemplateDto): Observable<ChecklistTemplate> {
        this._loading.set(true);
        return this.http.post<ChecklistTemplate>(`${ this.baseUrl }/templates`, template).pipe(
            tap(newTemplate => {
                this._templates.update(templates => [ ...templates, newTemplate ]);
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to create checklist template');
                this._loading.set(false);
                throw error;
            })
        );
    }

    updateTemplate(id: string, template: CreateChecklistTemplateDto): Observable<ChecklistTemplate> {
        this._loading.set(true);
        return this.http.put<ChecklistTemplate>(`${ this.baseUrl }/templates/${ id }`, template).pipe(
            tap(updatedTemplate => {
                this._templates.update(templates =>
                    templates.map(t => t.id === id ? updatedTemplate : t)
                );
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to update checklist template');
                this._loading.set(false);
                throw error;
            })
        );
    }

    toggleTemplateStatus(id: string, isActive: boolean): Observable<ChecklistTemplate> {
        this._loading.set(true);
        return this.http.patch<ChecklistTemplate>(`${ this.baseUrl }/templates/${ id }/status`, {isActive}).pipe(
            tap(updatedTemplate => {
                this._templates.update(templates =>
                    templates.map(t => t.id === id ? updatedTemplate : t)
                );
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to toggle template status');
                this._loading.set(false);
                throw error;
            })
        );
    }

    deleteTemplate(id: string): Observable<void> {
        this._loading.set(true);
        return this.http.delete<void>(`${ this.baseUrl }/templates/${ id }`).pipe(
            tap(() => {
                this._templates.update(templates => templates.filter(t => t.id !== id));
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to delete checklist template');
                this._loading.set(false);
                throw error;
            })
        );
    }

    duplicateTemplate(id: string, newName: string): Observable<ChecklistTemplate> {
        this._loading.set(true);
        return this.http.post<ChecklistTemplate>(`${ this.baseUrl }/templates/${ id }/duplicate`, {name: newName}).pipe(
            tap(duplicatedTemplate => {
                this._templates.update(templates => [ ...templates, duplicatedTemplate ]);
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to duplicate checklist template');
                this._loading.set(false);
                throw error;
            })
        );
    }

    getTemplate(id: string): Observable<ChecklistTemplate> {
        return this.http.get<ChecklistTemplate>(`${ this.baseUrl }/templates/${ id }`).pipe(
            catchError(error => {
                this._error.set('Failed to load checklist template');
                throw error;
            })
        );
    }

    getGroup(id: string): Observable<ChecklistGroup> {
        return this.http.get<ChecklistGroup>(`${ this.baseUrl }/groups/${ id }`).pipe(
            catchError(error => {
                this._error.set('Failed to load checklist group');
                throw error;
            })
        );
    }

    // Execution Management
    loadExecutions(): Observable<ChecklistExecution[]> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<ChecklistExecution[]>(`${ this.baseUrl }/executions`).pipe(
            tap(executions => {
                this._executions.set(executions);
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to load checklist executions');
                this._loading.set(false);
                return of([]);
            })
        );
    }

    createExecution(execution: CreateChecklistExecutionDto): Observable<ChecklistExecution> {
        this._loading.set(true);
        return this.http.post<ChecklistExecution>(`${ this.baseUrl }/executions`, execution).pipe(
            tap(newExecution => {
                this._executions.update(executions => [ ...executions, newExecution ]);
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to create checklist execution');
                this._loading.set(false);
                throw error;
            })
        );
    }

    updateExecution(id: string, execution: Partial<ChecklistExecution>): Observable<ChecklistExecution> {
        this._loading.set(true);
        return this.http.put<ChecklistExecution>(`${ this.baseUrl }/executions/${ id }`, execution).pipe(
            tap(updatedExecution => {
                this._executions.update(executions =>
                    executions.map(e => e.id === id ? updatedExecution : e)
                );
                this._loading.set(false);
            }),
            catchError(error => {
                this._error.set('Failed to update checklist execution');
                this._loading.set(false);
                throw error;
            })
        );
    }

    getExecutionReport(id: string): Observable<ChecklistExecutionReport> {
        return this.http.get<ChecklistExecutionReport>(`${ this.baseUrl }/executions/${ id }/report`);
    }

    exportExecutionReport(id: string, format: 'pdf' | 'csv'): Observable<Blob> {
        return this.http.get(`${ this.baseUrl }/executions/${ id }/export/${ format }`, {
            responseType: 'blob'
        });
    }

    // Enhanced execution methods with resource() and signals
    executeChecklist(payload: ExecuteChecklistDto) {
        return resource({
            params: () => payload,
            loader: async ({params}) => {
                try {
                    this._loading.set(true);
                    this._error.set(null);

                    const execution = await firstValueFrom(this.http.post<ChecklistExecution>(`${ this.baseUrl }/executions/execute`, params));

                    if (execution) {
                        this._executionSignal.set(execution);
                        this._executions.update(executions => [ ...executions, execution ]);
                    }

                    this._loading.set(false);
                    return execution!;
                } catch (error) {
                    this._error.set('Failed to execute checklist');
                    this._loading.set(false);
                    throw error;
                }
            }
        });
    }

    getExecutionById(id: string) {
        return resource({
            params: () => id,
            loader: async ({params}) => {
                try {
                    this._loading.set(true);
                    this._error.set(null);

                    const execution = await firstValueFrom(this.http.get<ChecklistExecution>(`${ this.baseUrl }/executions/${ params }`));

                    if (execution) {
                        this._executionSignal.set(execution);
                    }

                    this._loading.set(false);
                    return execution!;
                } catch (error) {
                    this._error.set('Failed to load execution');
                    this._loading.set(false);
                    throw error;
                }
            }
        });
    }

    // Score calculation methods
    @memoize({
        extractUniqueId  : (template: ChecklistTemplate, answers: ExecuteChecklistAnswers) =>
            `${ template.id }-${ JSON.stringify(answers) }`,
        clearCacheTimeout: 300000, // 5 minutes
        maxCacheSize     : 100
    })
    calculateScore(template: ChecklistTemplate, answers: ExecuteChecklistAnswers): number {
        if (!template.categories || template.categories.length === 0) {
            return 0;
        }

        let totalWeightedScore = 0;
        let totalWeight = 0;

        template.categories.forEach(category => {
            const categoryAnswers = answers[category.id!] || {};
            const categoryScore = this.calculateCategoryScore(category, categoryAnswers);

            const categoryWeight = category.questions.reduce((sum, question) => sum + question.weight, 0);

            totalWeightedScore += categoryScore * categoryWeight;
            totalWeight += categoryWeight;
        });

        return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    }

    @memoize({
        extractUniqueId  : (group: ChecklistGroup, executions: ChecklistExecution[]) =>
            `${ group.id }-${ JSON.stringify(executions.map(e => ({id: e.id, score: e.overallScore}))) }`,
        clearCacheTimeout: 300000, // 5 minutes
        maxCacheSize     : 50
    })
    calculateGroupScore(group: ChecklistGroup, executions: ChecklistExecution[]): number {
        if (!group.templates || group.templates.length === 0) {
            return 0;
        }

        let totalWeightedScore = 0;
        let totalWeight = 0;

        group.templates.forEach(template => {
            const templateExecution = executions.find(exec => exec.templateId === template.id);
            if (templateExecution) {
                totalWeightedScore += templateExecution.overallScore * template.weight;
                totalWeight += template.weight;
            }
        });

        return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    }

    // Helper method for category score calculation
    private calculateCategoryScore(category: any, categoryAnswers: any): number {
        if (!category.questions || category.questions.length === 0) {
            return 0;
        }

        let totalWeightedScore = 0;
        let totalWeight = 0;

        category.questions.forEach((question: any) => {
            const answer = categoryAnswers[question.id!];
            if (answer) {
                const questionScore = this.calculateQuestionScore(question, answer);
                totalWeightedScore += questionScore * question.weight;
                totalWeight += question.weight;
            }
        });

        return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    }

    // Helper method for question score calculation
    private calculateQuestionScore(question: any, answer: any): number {
        // Use the existing ChecklistScoreCalculator for consistency
        const mockResponse = {
            questionId     : question.id,
            value          : answer.value,
            normalizedScore: answer.normalizedScore,
            timestamp      : new Date(),
            files          : answer.files || []
        };

        return ChecklistScoreCalculator.calculateQuestionScore(question, mockResponse);
    }

    // Filter and pagination methods
    setGroupFilters(filters: ChecklistFilters): void {
        this._groupFilters.set(filters);
    }

    setTemplateFilters(filters: ChecklistFilters): void {
        this._templateFilters.set(filters);
    }

    setExecutionFilters(filters: ChecklistFilters): void {
        this._executionFilters.set(filters);
    }

    setPagination(pagination: PaginationParams): void {
        this._pagination.set(pagination);
    }

    // Utility methods
    clearError(): void {
        this._error.set(null);
    }

    refreshData(): void {
        this.loadGroups().subscribe();
        this.loadTemplates().subscribe();
        this.loadExecutions().subscribe();
    }
}
