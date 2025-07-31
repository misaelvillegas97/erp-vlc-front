import { ChangeDetectionStrategy, Component, computed, effect, inject, resource, Signal, signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
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
import { MatDialogModule } from '@angular/material/dialog';
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
    selector       : 'app-checklist-templates-list',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
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
        MatDialogModule,
        RouterLink,
        PageHeaderComponent,
        TableBuilderComponent
    ],
    templateUrl    : './checklist-templates-list.component.html'
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

    // Computed column configuration
    readonly columnsConfig = computed(() => {
        const actionsTemplate = this.actionsCell();
        if (!actionsTemplate) return [];

        return this.buildColumnsConfig();
    });

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
        loader: () => firstValueFrom<FindCount<ChecklistGroup>>(this.#checklistService.loadGroups())
            .catch((error) => {
                this.#notyf.error('Error al cargar los grupos de checklists');
                console.warn('Error loading checklist groups:', error);
                return {items: [], total: 0};
            })
    });

    // Computed query parameters for better performance
    private readonly queryParams = computed(() => {
        const params: any = {};

        const search = this.searchControlSignal()?.trim();
        if (search) {
            params.search = search;
        }

        const type = this.typeControlSignal();
        if (type) {
            params.type = type;
        }

        const group = this.groupControlSignal()?.trim();
        if (group) {
            if (group === 'unassigned') {
                params.groupId = '';
            } else {
                params.groupId = group;
            }
        }

        if (this.showActiveOnlySignal()) {
            params.isActive = true;
        }

        return params;
    });

    templatesResource = resource({
        params: () => this.queryParams(),
        loader: async ({params}) => {
            try {
                return await firstValueFrom<FindCount<ChecklistTemplate>>(
                    this.#checklistService.loadTemplates()
                );
            } catch (error) {
                this.#notyf.error('Error al cargar las plantillas de checklists');
                return {items: [], total: 0};
            }
        }
    });


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
        const dialog = this.#confirmationService.open({
            title  : 'Duplicar plantilla',
            message: `¿Desea duplicar la plantilla "${ template.name }"?`,
            icon   : {
                show : true,
                name : 'heroicons_outline:document-duplicate',
                color: 'info'
            },
            actions: {
                confirm: {
                    show : true,
                    label: 'Duplicar',
                    color: 'primary'
                },
                cancel : {
                    show : true,
                    label: 'Cancelar'
                }
            },
            dismissible: true
        });

        dialog.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const newName = `${ template.name } (Copia)`;
                this.#checklistService.duplicateTemplate(template.id!, newName).subscribe({
                    next : () => {
                        this.#notyf.success('Plantilla duplicada exitosamente');
                        this.templatesResource.reload();
                    },
                    error: () => {
                        this.#notyf.error('Error al duplicar la plantilla');
                    }
                });
            }
        });
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
}
