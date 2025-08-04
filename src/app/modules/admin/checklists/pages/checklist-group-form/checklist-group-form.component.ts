import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { Router, ActivatedRoute, RouterModule }                                 from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule }   from '@angular/forms';

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

import { ChecklistService }                         from '../../services/checklist.service';
import { ChecklistGroup, ChecklistGroupValidation } from '../../domain/interfaces/checklist-group.interface';
import { ChecklistTemplate }                        from '../../domain/interfaces/checklist-template.interface';
import { CreateChecklistGroupDto, UpdateChecklistGroupDto } from '../../domain/interfaces/checklist-group-dto.interface';
import { PageHeaderComponent }                      from '@layout/components/page-header/page-header.component';
import { NotyfService }                             from '@shared/services/notyf.service';

@Component({
    selector       : 'app-checklist-group-form',
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
        PageHeaderComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './checklist-group-form.component.html'
})
export class ChecklistGroupFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notyf = inject(NotyfService);

    readonly #checklistService = inject(ChecklistService);

    // Component state
    readonly isEditMode = signal<boolean>(false);
    readonly groupId = signal<string | null>(null);
    readonly selectedTemplates = signal<Map<string, number>>(new Map());

    // Form
    readonly groupForm: FormGroup = this.fb.group({
        name       : [ '', [ Validators.required, Validators.minLength(2) ] ],
        description: [ '' ],
        weight     : [ 0, [ Validators.required, Validators.min(0), Validators.max(1) ] ],
        isActive   : [ true ]
    });

    // Computed signals
    readonly availableTemplates = computed(() => {
        return this.#checklistService.activeTemplates().filter(template => !template.groupId);
    });

    readonly totalTemplateWeight = computed(() => {
        const weights = Array.from(this.selectedTemplates().values());
        return weights.reduce((sum, weight) => sum + weight, 0);
    });

    readonly validationResult = computed(() => {
        if (!this.groupForm.valid) return null;

        const formValue = this.groupForm.value;
        const mockGroup: ChecklistGroup = {
            name       : formValue.name,
            description: formValue.description,
            weight     : formValue.weight,
            isActive   : formValue.isActive,
            templates  : Array.from(this.selectedTemplates().entries()).map(([ templateId, weight ]) => {
                const template = this.availableTemplates().find(t => t.id === templateId);
                return {...template!, weight};
            })
        };

        return this.#checklistService.validateGroup(mockGroup);
    });

    readonly canSubmit = computed(() => {
        return this.groupForm.valid &&
            this.validationResult()?.isValid === true &&
            !this.#checklistService.loading();
    });

    // Public getters for template access
    get loading() {
        return this.#checklistService.loading();
    }

    ngOnInit(): void {
        this.loadTemplates();
        this.checkRouteParams();
    }

    onTemplateSelectionChange(template: ChecklistTemplate, selected: boolean): void {
        const templateId = template.id!;
        const currentSelection = new Map(this.selectedTemplates());

        if (selected) {
            // Add template with default weight
            const remainingWeight = Math.max(0, 1 - this.totalTemplateWeight());
            const defaultWeight = Math.min(0.1, remainingWeight);
            currentSelection.set(templateId, defaultWeight);
        } else {
            // Remove template
            currentSelection.delete(templateId);
        }

        this.selectedTemplates.set(currentSelection);
    }

    onTemplateWeightChange(templateId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        const weight = parseFloat(input.value) || 0;

        const currentSelection = new Map(this.selectedTemplates());
        currentSelection.set(templateId, Math.max(0, Math.min(1, weight)));
        this.selectedTemplates.set(currentSelection);
    }

    isTemplateSelected(templateId: string): boolean {
        return this.selectedTemplates().has(templateId);
    }

    getTemplateWeight(templateId: string): number {
        return this.selectedTemplates().get(templateId) || 0;
    }

    getTotalQuestions(template: ChecklistTemplate): number {
        return template.categories?.reduce((total, category) => {
            return total + (category.questions?.length || 0);
        }, 0) || 0;
    }

    getWeightValidationClass(): string {
        const total = this.totalTemplateWeight();
        if (Math.abs(total - 1.0) <= 0.01) return 'weight-valid';
        if (total > 1.0) return 'weight-invalid';
        return 'weight-warning';
    }

    onSubmit(): void {
        if (!this.canSubmit()) return;

        const formValue = this.groupForm.value;
        const groupDto: CreateChecklistGroupDto = {
            name       : formValue.name,
            description: formValue.description,
            weight     : formValue.weight,
            isActive   : formValue.isActive,
            templates: Array.from(this.selectedTemplates().entries()).map(([ templateId, weight ]) => ({
                templateId,
                weight
            }))
        };

        const operation = this.isEditMode()
            ? this.#checklistService.updateGroup(this.groupId()!, groupDto)
            : this.#checklistService.createGroup(groupDto);

        operation.subscribe({
            next : (group) => {
                this.notyf.success(
                    `Grupo ${ this.isEditMode() ? 'actualizado' : 'creado' } exitosamente`
                );
                this.router.navigate([ '../' ], {relativeTo: this.route});
            },
            error: (error) => {
                this.notyf.error(
                    `Error al ${ this.isEditMode() ? 'actualizar' : 'crear' } el grupo`
                );
            }
        });
    }

    private checkRouteParams(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.groupId.set(id);
            this.loadGroup(id);
        }
    }

    private loadGroup(id: string): void {
        const group = this.#checklistService.groups().find(g => g.id === id);
        if (group) {
            this.groupForm.patchValue({
                name       : group.name,
                description: group.description,
                weight     : group.weight,
                isActive   : group.isActive
            });

            // Set selected templates
            const templateSelection = new Map<string, number>();
            group.templates?.forEach(template => {
                if (template.id) {
                    templateSelection.set(template.id, template.weight);
                }
            });
            this.selectedTemplates.set(templateSelection);
        }
    }

    private loadTemplates(): void {
        this.#checklistService.loadTemplates().subscribe();
    }
}
