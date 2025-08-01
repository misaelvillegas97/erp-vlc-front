import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal } from '@angular/core';
import { CommonModule }                                                                 from '@angular/common';
import { FormControl, ReactiveFormsModule }                                             from '@angular/forms';
import { Router }                                                                       from '@angular/router';
import { takeUntilDestroyed, toSignal }                                                 from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom, catchError, of }                                 from 'rxjs';

// Angular Material
import { MatCardModule }                         from '@angular/material/card';
import { MatFormFieldModule }                    from '@angular/material/form-field';
import { MatSelectModule }                       from '@angular/material/select';
import { MatInputModule }                        from '@angular/material/input';
import { MatButtonModule }                       from '@angular/material/button';
import { MatIconModule }                         from '@angular/material/icon';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatProgressSpinner }                    from '@angular/material/progress-spinner';

import { ChecklistService }    from '../../../services/checklist.service';
import { ChecklistTemplate }   from '../../../domain/interfaces/checklist-template.interface';
import { ChecklistGroup }      from '../../../domain/interfaces/checklist-group.interface';
import { PageHeaderComponent } from '@layout/components/page-header/page-header.component';

export interface ExecutionSelection {
    templateId?: string;
    groupId?: string;
    vehicleId: string;
    userId: string;
}

interface ExecutionTarget {
    type: 'template' | 'group';
    data: ChecklistTemplate | ChecklistGroup;
    id: string;
}

@Component({
    selector       : 'app-execution-selector',
    templateUrl    : './execution-selector.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatButtonToggleGroup,
        MatButtonToggle,
        MatProgressSpinner,
        PageHeaderComponent
    ]
})
export class ExecutionSelectorComponent {
    readonly checklistService = inject(ChecklistService);
    private readonly router = inject(Router);

    // Outputs
    selectionChanged = output<ExecutionSelection>();
    cancelled = output<void>();

    // Form controls with better typing
    executionTypeControl = new FormControl<'template' | 'group'>('template', {nonNullable: true});
    searchControl = new FormControl<string>('', {nonNullable: true});
    vehicleFilterControl = new FormControl<string[]>([], {nonNullable: true});
    roleFilterControl = new FormControl<string[]>([], {nonNullable: true});

    // Signals from form controls
    executionTypeSignal = toSignal(this.executionTypeControl.valueChanges, {initialValue: 'template' as const});
    vehicleFilterSignal = toSignal(this.vehicleFilterControl.valueChanges, {initialValue: [] as string[]});
    roleFilterSignal = toSignal(this.roleFilterControl.valueChanges, {initialValue: [] as string[]});
    searchSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    // Selection state
    selectedTemplateOrGroup = signal<ExecutionTarget | null>(null);

    // Mock data (replace with actual service calls)
    availableVehicles = signal([
        {id: '1', name: 'Camión 001', plate: 'ABC-123'},
        {id: '2', name: 'Camión 002', plate: 'DEF-456'},
        {id: '3', name: 'Van 001', plate: 'GHI-789'}
    ]);

    availableRoles = signal([
        {id: '1', name: 'Conductor'},
        {id: '2', name: 'Supervisor'},
        {id: '3', name: 'Inspector de calidad'},
        {id: '4', name: 'Técnico de mantenimiento'}
    ]);

    // Computed properties
    availableTemplates = computed(() => this.checklistService.templates());
    availableGroups = computed(() => this.checklistService.groups());

    // Available filters computed from data
    availableVehicleTypes = computed(() => {
        const templates = this.availableTemplates();
        const groups = this.availableGroups();

        const vehicleTypes = new Set<string>();

        // Extract vehicle types from templates
        templates.forEach(template => {
            template.vehicleTypes?.forEach(type => vehicleTypes.add(type));
        });

        // Extract vehicle types from groups
        groups.forEach(group => {
            group.templates?.forEach(template => {
                template.vehicleTypes?.forEach(type => vehicleTypes.add(type));
            });
        });

        return Array.from(vehicleTypes).sort();
    });

    availableUserRoles = computed(() => {
        const templates = this.availableTemplates();
        const groups = this.availableGroups();

        const roles = new Set<string>();

        // Extract roles from templates
        templates.forEach(template => {
            template.userRoles?.forEach(role => roles.add(role));
        });

        // Extract roles from groups
        groups.forEach(group => {
            group.templates?.forEach(template => {
                template.userRoles?.forEach(role => roles.add(role));
            });
        });

        return Array.from(roles).sort();
    });

    // Filtered data using signals for proper reactivity
    filteredTemplates = computed(() => {
        const templates = this.availableTemplates();
        const search = this.searchSignal()?.toLowerCase() || '';
        const vehicleFilter = this.vehicleFilterSignal() || [];
        const roleFilter = this.roleFilterSignal() || [];

        return templates.filter(template => {
            // Search filter
            if (search && !template.name.toLowerCase().includes(search)) {
                return false;
            }

            // Vehicle type filter
            if (vehicleFilter.length > 0 && !vehicleFilter.some(vType => template.vehicleTypes?.includes(vType))) {
                return false;
            }

            // Role filter
            if (roleFilter.length > 0 && !roleFilter.some(rId => template.userRoles?.includes(rId))) {
                return false;
            }

            return true;
        });
    });

    filteredGroups = computed(() => {
        const groups = this.availableGroups();
        const search = this.searchSignal()?.toLowerCase() || '';
        const vehicleFilter = this.vehicleFilterSignal() || [];
        const roleFilter = this.roleFilterSignal() || [];

        return groups.filter(group => {
            // Search filter
            if (search && !group.name.toLowerCase().includes(search)) {
                return false;
            }

            // Vehicle type filter - check within group templates
            if (vehicleFilter.length > 0) {
                const hasMatchingVehicle = group.templates?.some(template =>
                    vehicleFilter.some(vType => template.vehicleTypes?.includes(vType))
                );
                if (!hasMatchingVehicle) return false;
            }

            // Role filter - check within group templates
            if (roleFilter.length > 0) {
                const hasMatchingRole = group.templates?.some(template =>
                    roleFilter.some(role => template.userRoles?.includes(role))
                );
                if (!hasMatchingRole) return false;
            }

            return true;
        });
    });

    constructor() {
        this.loadTemplates();
        this.loadGroups();

        // Use effect instead of manual subscription for better signal integration
        effect(() => {
            const type = this.executionTypeSignal();
            if (type === 'template') {
                this.loadTemplates();
            } else if (type === 'group') {
                this.loadGroups();
            }
        });
    }

    private loadTemplates(): void {
        firstValueFrom(
            this.checklistService.loadTemplates().pipe(
                catchError(error => {
                    console.error('Error loading templates:', error);
                    return of(() => []);
                })
            )
        ).catch(error => {
            console.error('Failed to load templates:', error);
        });
    }

    private loadGroups(): void {
        firstValueFrom(
            this.checklistService.loadGroups().pipe(
                catchError(error => {
                    console.error('Error loading groups:', error);
                    return of(() => []);
                })
            )
        ).catch(error => {
            console.error('Failed to load groups:', error);
        });
    }

    selectTarget(selection: { type: 'template' | 'group'; data: ChecklistTemplate | ChecklistGroup }): void {
        this.selectedTemplateOrGroup.set({
            ...selection,
            id: selection.data.id!
        });
    }

    clearSelection(): void {
        console.log('Clearing selection');
        this.selectedTemplateOrGroup.set(null);
        this.executionTypeControl.setValue('template', {emitEvent: false});
        this.vehicleFilterControl.setValue([]);
        this.roleFilterControl.setValue([]);
        this.searchControl.setValue('');
    }

    clearFilters(): void {
        this.searchControl.setValue('');
        this.vehicleFilterControl.setValue([]);
        this.roleFilterControl.setValue([]);
    }

    getTotalQuestions(template: ChecklistTemplate): number {
        if (!template.categories) return 0;
        return template.categories.reduce((total, category) =>
            total + (category.questions?.length || 0), 0);
    }

    proceedToExecution(): void {
        const selected = this.selectedTemplateOrGroup();

        console.log('Proceeding with selection:', selected);
        if (!selected) return;

        const selection: ExecutionSelection = {
            vehicleId: '', // These will be filled in the next step
            userId   : ''
        };

        if (selected.type === 'template') {
            void this.router.navigate([ 'checklists', 'execute', 'template', selected.data.id ]);
        } else {
            void this.router.navigate([ 'checklists', 'execute', 'group', selected.data.id ]);
        }
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
