import { Component, inject, resource, Signal, signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { CommonModule }                                                                        from '@angular/common';
import { FormControl, ReactiveFormsModule }                                                    from '@angular/forms';
import { MatButtonModule }                                                                     from '@angular/material/button';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { MatIconModule }                                                                       from '@angular/material/icon';
import { MatInputModule }                                                                      from '@angular/material/input';
import { MatTooltipModule }                                                                    from '@angular/material/tooltip';
import { MatMenuModule }                                                                       from '@angular/material/menu';
import { MatCheckboxModule }                                                                   from '@angular/material/checkbox';
import { MatSelectModule }                                                                     from '@angular/material/select';
import { RouterLink }                                                                          from '@angular/router';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { TableBuilderComponent }                                                               from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                                                        from '@shared/components/table-builder/column.type';
import { ChecklistService }                                                                    from '../../services/checklist.service';
import { ChecklistTemplate }                                                                   from '../../domain/interfaces/checklist-template.interface';
import { ChecklistType, ChecklistTypeConfig }                                                  from '../../domain/enums/checklist-type.enum';
import { ChecklistGroup }                                                                      from '../../domain/interfaces/checklist-group.interface';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import { FuseConfirmationService }                                                             from '@fuse/services/confirmation';
import { FindCount }                                                                           from '@shared/domain/model/find-count';

@Component({
    selector   : 'app-checklist-templates-list',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTooltipModule,
        MatMenuModule,
        MatCheckboxModule,
        MatSelectModule,
        RouterLink,
        PageHeaderComponent,
        TableBuilderComponent
    ],
    templateUrl: './checklist-templates-list.component.html'
})
export class ChecklistTemplatesListComponent {
    readonly #checklistService = inject(ChecklistService);
    readonly #notyf = inject(NotyfService);
    readonly #confirmationService = inject(FuseConfirmationService);

    // Filters
    searchControl = new FormControl<string>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    typeControl = new FormControl<ChecklistType | null>(null);
    typeControlSignal = toSignal(this.typeControl.valueChanges, {initialValue: null});

    groupControl = new FormControl<string>('');
    groupControlSignal = toSignal(this.groupControl.valueChanges, {initialValue: ''});

    showActiveOnly = new FormControl<boolean>(false);
    showActiveOnlySignal = toSignal(this.showActiveOnly.valueChanges, {initialValue: false});

    // Table
    readonly actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell');
    columnsConfig: WritableSignal<ColumnConfig<ChecklistTemplate>[]> = signal(undefined);

    // Static data
    readonly checklistTypes = [
        {value: ChecklistType.INSPECTION, label: 'Inspección'},
        {value: ChecklistType.MAINTENANCE, label: 'Mantenimiento'},
        {value: ChecklistType.SAFETY, label: 'Seguridad'},
        {value: ChecklistType.QUALITY, label: 'Calidad'},
        {value: ChecklistType.COMPLIANCE, label: 'Cumplimiento'},
        {value: ChecklistType.OPERATIONAL, label: 'Operacional'}
    ];

    // Data resources
    groupsResource = resource({
        loader: async () => {
            try {
                return firstValueFrom<FindCount<ChecklistGroup>>(this.#checklistService.loadGroups());
            } catch (error) {
                this.#notyf.error('Error al cargar los grupos');
                return {items: [], total: 0};
            }
        }
    });

    templatesResource = resource({
        params: () => ({
            search    : this.searchControlSignal(),
            type      : this.typeControlSignal(),
            group     : this.groupControlSignal(),
            activeOnly: this.showActiveOnlySignal()
        }),
        loader: async ({params}) => {
            try {
                let query: any = {};

                if (params.search?.trim()) {
                    query.search = params.search.trim();
                }

                if (params.type) {
                    query.type = params.type;
                }

                if (params.group?.trim()) {
                    if (params.group === 'unassigned') {
                        query.groupId = '';
                    } else {
                        query.groupId = params.group;
                    }
                }

                if (params.activeOnly) {
                    query.isActive = true;
                }

                return await firstValueFrom<FindCount<ChecklistTemplate>>(this.#checklistService.loadTemplates());
            } catch (error) {
                this.#notyf.error('Error al cargar las plantillas de checklists');
                return {items: [], total: 0};
            }
        }
    });

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    clearFilters(): void {
        this.searchControl.setValue('');
        this.typeControl.setValue(null);
        this.groupControl.setValue('');
        this.showActiveOnly.setValue(false);
    }

    toggleTemplateStatus(template: ChecklistTemplate): void {
        const newStatus = !template.isActive;
        this.#checklistService.updateTemplate(template.id!, {isActive: newStatus}).subscribe({
            next : () => {
                this.#notyf.success(`Plantilla ${ newStatus ? 'activada' : 'desactivada' } exitosamente`);
                this.templatesResource.reload();
            },
            error: (error) => {
                this.#notyf.error('Error al actualizar el estado de la plantilla');
            }
        });
    }

    duplicateTemplate(template: ChecklistTemplate): void {
        const newName = prompt(`Ingrese el nombre para la plantilla duplicada:`, `${ template.name } (Copia)`);
        if (newName && newName.trim()) {
            this.#checklistService.duplicateTemplate(template.id!, newName.trim()).subscribe({
                next : () => {
                    this.#notyf.success('Plantilla duplicada exitosamente');
                    this.templatesResource.reload();
                },
                error: (error) => {
                    this.#notyf.error('Error al duplicar la plantilla');
                }
            });
        }
    }

    deleteTemplate(template: ChecklistTemplate): void {
        const dialog = this.#confirmationService.open({
            title  : 'Eliminar plantilla de checklist',
            message: `¿Está seguro que desea eliminar la plantilla "${ template.name }"?`,
            actions: {
                confirm: {label: 'Eliminar'},
                cancel : {label: 'Cancelar'}
            }
        });

        dialog.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.#checklistService.deleteTemplate(template.id!).subscribe({
                    next : () => {
                        this.#notyf.success('Plantilla eliminada exitosamente');
                        this.templatesResource.reload();
                    },
                    error: () => {
                        this.#notyf.error('Error al eliminar la plantilla');
                    }
                });
            }
        });
    }

    private buildColumnsConfig(): ColumnConfig<ChecklistTemplate>[] {
        return [
            {
                key     : 'name',
                header  : 'Plantilla',
                visible : true,
                sortable: true,
                display: {
                    type : 'text',
                    label: (value, row) => `${ row.name } (${ row.version })`,
                },
            },
            {
                key    : 'type',
                header : 'Tipo',
                visible: true,
                display: {
                    type : 'badge',
                    color: (value, row) => ChecklistTypeConfig[row.type]?.color || 'gray',
                    label: (value, row) => ChecklistTypeConfig[row.type]?.label || row.type
                }
            },
            {
                key    : 'structure',
                header : 'Estructura',
                visible: true,
                display: {
                    type : 'text',
                    label: (value, row) => {
                        const totalQuestions = this.getTotalQuestions(row);
                        return `${ totalQuestions } pregunta${ totalQuestions !== 1 ? 's' : '' }`;
                    }
                }
            },
            {
                key     : 'isActive',
                header  : 'Estado',
                visible : true,
                sortable: true,
                display: {
                    type : 'text',
                    label: (value, row) => {
                        return row.isActive ? 'Activo' : 'Inactivo';
                    }
                }
            },
            {
                key    : 'actions',
                header : 'Acciones',
                visible: true,
                display: {
                    type          : 'custom',
                    customTemplate: this.actionsCell()
                }
            }
        ];
    }

    private getTotalQuestions(template: ChecklistTemplate): number {
        return template.categories?.reduce((total, category) => {
            return total + (category.questions?.length || 0);
        }, 0) || 0;
    }

    private getGroupName(groupId: string): string {
        const group = this.groupsResource.value().items?.find(g => g.id === groupId);
        return group?.name || 'Grupo desconocido';
    }

    private getTypeChipClass(type: ChecklistType): string {
        const typeClasses = {
            [ChecklistType.INSPECTION] : 'bg-blue-100 text-blue-800',
            [ChecklistType.MAINTENANCE]: 'bg-orange-100 text-orange-800',
            [ChecklistType.SAFETY]     : 'bg-red-100 text-red-800',
            [ChecklistType.QUALITY]    : 'bg-purple-100 text-purple-800',
            [ChecklistType.COMPLIANCE] : 'bg-green-100 text-green-800',
            [ChecklistType.OPERATIONAL]: 'bg-pink-100 text-pink-800'
        };
        return typeClasses[type] || 'bg-gray-100 text-gray-800';
    }

    private getTypeLabel(type: ChecklistType): string {
        const typeLabels = {
            [ChecklistType.INSPECTION] : 'Inspección',
            [ChecklistType.MAINTENANCE]: 'Mantenimiento',
            [ChecklistType.SAFETY]     : 'Seguridad',
            [ChecklistType.QUALITY]    : 'Calidad',
            [ChecklistType.COMPLIANCE] : 'Cumplimiento',
            [ChecklistType.OPERATIONAL]: 'Operacional'
        };
        return typeLabels[type] || type;
    }
}
