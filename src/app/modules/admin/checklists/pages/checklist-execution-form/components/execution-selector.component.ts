import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                                                 from '@angular/common';
import { FormControl, ReactiveFormsModule }                             from '@angular/forms';
import { Router, RouterLink }                                           from '@angular/router';
import { toSignal }                                                     from '@angular/core/rxjs-interop';
import { debounceTime }                                                 from 'rxjs';

// Angular Material
import { MatCardModule }      from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule }    from '@angular/material/select';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatChipsModule }     from '@angular/material/chips';
import { MatRadioModule }     from '@angular/material/radio';
import { MatTooltipModule }   from '@angular/material/tooltip';

import { ChecklistService }    from '../../../services/checklist.service';
import { ChecklistTemplate }   from '../../../domain/interfaces/checklist-template.interface';
import { ChecklistGroup }      from '../../../domain/interfaces/checklist-group.interface';
import { PageHeaderComponent } from '@layout/components/page-header/page-header.component';

export type ExecutionTarget = ChecklistTemplate | ChecklistGroup;

@Component({
    selector       : 'app-execution-selector',
    standalone     : true,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatRadioModule,
        MatTooltipModule,
        RouterLink,
        PageHeaderComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './execution-selector.component.html'
})
export class ExecutionSelectorComponent {
    private readonly checklistService = inject(ChecklistService);
    private readonly router = inject(Router);

    // Form Controls
    executionTypeControl = new FormControl<'template' | 'group'>('template');
    vehicleFilterControl = new FormControl<string[]>([]);
    roleFilterControl = new FormControl<string[]>([]);
    searchControl = new FormControl<string>('');

    // Signals from form controls
    executionTypeSignal = toSignal(this.executionTypeControl.valueChanges, {initialValue: 'template'});
    vehicleFilterSignal = toSignal(this.vehicleFilterControl.valueChanges, {initialValue: []});
    roleFilterSignal = toSignal(this.roleFilterControl.valueChanges, {initialValue: []});
    searchSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    // State
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

    // Computed filtered lists
    filteredTemplates = computed(() => {
        const templates = this.checklistService.activeTemplates();
        const vehicleFilter = this.vehicleFilterSignal();
        const roleFilter = this.roleFilterSignal();
        const search = this.searchSignal()?.toLowerCase() || '';

        return templates.filter(template => {
            // Search filter
            if (search && !template.name.toLowerCase().includes(search)) {
                return false;
            }

            // Vehicle filter
            if (vehicleFilter && vehicleFilter.length > 0 && !vehicleFilter.some(vId => template.vehicleTypes?.includes(vId))) {
                return false;
            }

            // Role filter
            if (roleFilter && roleFilter.length > 0 && !roleFilter.some(rId => template.userRoles?.includes(rId))) {
                return false;
            }

            return true;
        });
    });

    filteredGroups = computed(() => {
        const groups = this.checklistService.activeGroups();
        const search = this.searchSignal()?.toLowerCase() || '';

        return groups.filter(group => {
            if (search && !group.name.toLowerCase().includes(search)) {
                return false;
            }
            return true;
        });
    });

    selectTarget(target: ExecutionTarget): void {
        this.selectedTemplateOrGroup.set(target);
    }

    clearSelection(): void {
        this.selectedTemplateOrGroup.set(null);
        this.executionTypeControl.setValue('template');
        this.vehicleFilterControl.setValue([]);
        this.roleFilterControl.setValue([]);
        this.searchControl.setValue('');
    }

    getTotalQuestions(template: ChecklistTemplate): number {
        return template.categories?.reduce((total, category) => {
            return total + (category.questions?.length || 0);
        }, 0) || 0;
    }

    getVehicleName(vehicleId: string): string {
        const vehicle = this.availableVehicles().find(v => v.id === vehicleId);
        return vehicle?.name || `Vehículo ${ vehicleId }`;
    }

    isSelectedItemGroup(): boolean {
        const target = this.selectedTemplateOrGroup();
        if (!target) return false;
        return 'templates' in target;
    }

    startExecution(): void {
        const target = this.selectedTemplateOrGroup();
        if (!target) return;

        const isGroup = this.isSelectedItemGroup();
        const route = isGroup
            ? `/admin/checklists/execute/group/${ target.id }`
            : `/admin/checklists/execute/template/${ target.id }`;

        this.router.navigate([ route ]);
    }
}
