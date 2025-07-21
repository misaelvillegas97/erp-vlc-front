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
import { RouterLink }                                                                          from '@angular/router';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { TableBuilderComponent }                                                               from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                                                        from '@shared/components/table-builder/column.type';
import { ChecklistService }                                                                    from '../../services/checklist.service';
import { ChecklistGroup }                                                                      from '../../domain/interfaces/checklist-group.interface';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import { FuseConfirmationService }                                                             from '@fuse/services/confirmation';
import { FindCount }                                                                           from '@shared/domain/model/find-count';

@Component({
    selector   : 'app-checklist-groups-list',
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
        RouterLink,
        PageHeaderComponent,
        TableBuilderComponent
    ],
    templateUrl: './checklist-groups-list.component.html'
})
export class ChecklistGroupsListComponent {
    readonly #checklistService = inject(ChecklistService);
    readonly #notyf = inject(NotyfService);
    readonly #confirmationService = inject(FuseConfirmationService);

    // Filters
    searchControl = new FormControl<string>('');
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});

    showActiveOnly = new FormControl<boolean>(false);
    showActiveOnlySignal = toSignal(this.showActiveOnly.valueChanges, {initialValue: false});

    // Table
    readonly actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell');
    columnsConfig: WritableSignal<ColumnConfig<ChecklistGroup>[]> = signal(undefined);

    // Data
    groupsResource = resource({
        request: () => ({
            search    : this.searchControlSignal(),
            activeOnly: this.showActiveOnlySignal()
        }),
        loader : async ({request}) => {
            try {
                let params: any = {};

                if (request.search?.trim()) {
                    params.search = request.search.trim();
                }

                if (request.activeOnly) {
                    params.isActive = true;
                }

                return await firstValueFrom<FindCount<ChecklistGroup>>(this.#checklistService.loadGroups());
            } catch (error) {
                this.#notyf.error('Error al cargar los grupos de checklists');
                return {items: [], count: 0};
            }
        }
    });

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    clearFilters(): void {
        this.searchControl.setValue('');
        this.showActiveOnly.setValue(false);
    }

    toggleGroupStatus(group: ChecklistGroup): void {
        const newStatus = !group.isActive;
        this.#checklistService.updateGroup(group.id!, {isActive: newStatus}).subscribe({
            next : () => {
                this.#notyf.success(`Grupo ${ newStatus ? 'activado' : 'desactivado' } exitosamente`);
                this.groupsResource.reload();
            },
            error: (error) => {
                this.#notyf.error('Error al actualizar el estado del grupo');
            }
        });
    }

    deleteGroup(group: ChecklistGroup): void {
        const dialog = this.#confirmationService.open({
            title  : 'Eliminar grupo de checklist',
            message: `¿Está seguro que desea eliminar el grupo "${ group.name }"?`,
            actions: {
                confirm: {label: 'Eliminar'},
                cancel : {label: 'Cancelar'}
            }
        });

        dialog.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.#checklistService.deleteGroup(group.id!).subscribe({
                    next : () => {
                        this.#notyf.success('Grupo eliminado exitosamente');
                        this.groupsResource.reload();
                    },
                    error: () => {
                        this.#notyf.error('Error al eliminar el grupo');
                    }
                });
            }
        });
    }

    private buildColumnsConfig(): ColumnConfig<ChecklistGroup>[] {
        return [
            {
                key     : 'name',
                header  : 'Nombre',
                sortable: true,
                visible : true,
                render  : (group: ChecklistGroup) => `
                      <div class="flex flex-col">
                        <span class="font-medium">${ group.name }</span>
                        ${ group.description ? `<span class="text-sm text-gray-600">${ group.description }</span>` : '' }
                      </div>
                    `
            },
            {
                key     : 'weight',
                header  : 'Peso',
                sortable: true,
                visible : true,
                render  : (group: ChecklistGroup) => {
                    const percentage = (group.weight * 100).toFixed(1);
                    const colorClass = group.weight >= 0.7 ? 'bg-blue-100 text-blue-800' :
                        group.weight >= 0.4 ? 'bg-orange-100 text-orange-800' :
                            'bg-pink-100 text-pink-800';
                    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ colorClass }">${ percentage }%</span>`;
                }
            },
            {
                key    : 'templates',
                header : 'Plantillas',
                visible: true,
                render : (group: ChecklistGroup) => {
                    const templateCount = group.templates?.length || 0;
                    const questionCount = this.getTotalQuestions(group);
                    return `
                        <div class="flex items-center gap-2">
                          <mat-icon class="text-gray-500 text-sm">assignment</mat-icon>
                          <span>${ templateCount }</span>
                          ${ questionCount > 0 ? `<span class="text-sm text-gray-600">(${ questionCount } preguntas)</span>` : '' }
                        </div>
                      `;
                }
            },
            {
                key     : 'isActive',
                header  : 'Estado',
                sortable: true,
                visible : true,
                render  : (group: ChecklistGroup) => {
                    const colorClass = group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
                    const label = group.isActive ? 'Activo' : 'Inactivo';
                    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ colorClass }">${ label }</span>`;
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

    private getTotalQuestions(group: ChecklistGroup): number {
        return group.templates?.reduce((total, template) => {
            return total + (template.categories?.reduce((catTotal, category) => {
                return catTotal + (category.questions?.length || 0);
            }, 0) || 0);
        }, 0) || 0;
    }
}
