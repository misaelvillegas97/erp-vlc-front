import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                                               from '@angular/common';
import { RouterModule }                                               from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup }                from '@angular/forms';
import { MatButtonModule }                                            from '@angular/material/button';
import { MatCardModule }                                              from '@angular/material/card';
import { MatFormFieldModule }                                         from '@angular/material/form-field';
import { MatInputModule }                                             from '@angular/material/input';
import { MatSelectModule }                                            from '@angular/material/select';
import { MatIconModule }                                              from '@angular/material/icon';
import { MatChipsModule }                                             from '@angular/material/chips';
import { MatMenuModule }                                              from '@angular/material/menu';
import { MatDialogModule, MatDialog }                                 from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar }                             from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                   from '@angular/material/progress-spinner';
import { MatTooltipModule }                                           from '@angular/material/tooltip';
import { MatBadgeModule }                                             from '@angular/material/badge';
import { MatDividerModule }                                           from '@angular/material/divider';
import { PageHeaderComponent }                                        from '@layout/components/page-header/page-header.component';
import { debounceTime, distinctUntilChanged, switchMap, catchError }  from 'rxjs/operators';
import { of, EMPTY }                                                  from 'rxjs';

import { TracingApiService }         from '../../../services/tracing-api.service';
import { FlowTemplate, FlowVersion } from '../../../models/entities';
import { FlowVersionStatus }         from '../../../models/enums';

interface TemplateWithVersions extends FlowTemplate {
    versions: FlowVersion[];
    latestVersion?: FlowVersion;
    publishedVersion?: FlowVersion;
    totalVersions: number;
}

@Component({
    selector       : 'app-templates-list',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatChipsModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatBadgeModule,
        MatDividerModule,
        PageHeaderComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col min-w-0 w-full">
            <page-header
                title="Plantillas de Flujo"
                subtitle="Gestiona las plantillas y versiones de tus flujos de trabajo">
            </page-header>

            <div class="flex flex-col items-center justify-center w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto py-6 sm:py-10 gap-y-4 sm:gap-y-6 px-4 sm:px-6">
                <div class="flex flex-col sm:flex-row w-full items-start sm:items-center gap-3 sm:gap-4">
                    <div class="flex-1 min-w-0">
                        <h2 class="font-bold text-secondary text-lg sm:text-xl leading-tight">Plantillas de Flujo</h2>
                        <p class="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">Gestiona las plantillas y versiones de tus flujos de trabajo</p>
                    </div>

                    <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            (click)="loadTemplates()"
                            [matTooltip]="'Recargar'"
                            mat-icon-button
                            class="flex-shrink-0"
                        >
                            <mat-icon class="icon-size-5">refresh</mat-icon>
                        </button>
                        <button
                            [matTooltip]="'Nueva plantilla'"
                            routerLink="new"
                            class="flex-shrink-0"
                            color="primary"
                            mat-raised-button
                        >
                            <mat-icon>add</mat-icon>
                            <span class="hidden sm:inline ml-2">Nueva Plantilla</span>
                            <span class="sm:hidden ml-2">Nueva</span>
                        </button>
                    </div>
                </div>

                <!-- Panel de filtros -->
                <div class="w-full bg-card rounded-md shadow p-4 sm:p-6 mb-4 sm:mb-6">
                    <form [formGroup]="filtersForm" class="space-y-4">
                        <!-- Filtros principales -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <mat-form-field class="w-full fuse-mat-dense">
                                <mat-label>Buscar plantillas</mat-label>
                                <input matInput formControlName="search" placeholder="Nombre de plantilla...">
                                <mat-icon matSuffix>search</mat-icon>
                            </mat-form-field>

                            <mat-form-field class="w-full fuse-mat-dense">
                                <mat-label>Estado</mat-label>
                                <mat-select formControlName="status">
                                    <mat-option value="">Todos los estados</mat-option>
                                    <mat-option value="active">Activas</mat-option>
                                    <mat-option value="inactive">Inactivas</mat-option>
                                    <mat-option value="with-published">Con versión publicada</mat-option>
                                    <mat-option value="draft-only">Solo borradores</mat-option>
                                </mat-select>
                            </mat-form-field>

                            <mat-form-field class="w-full fuse-mat-dense">
                                <mat-label>Ordenar por</mat-label>
                                <mat-select formControlName="sortBy">
                                    <mat-option value="name">Nombre</mat-option>
                                    <mat-option value="createdAt">Fecha de creación</mat-option>
                                    <mat-option value="updatedAt">Última modificación</mat-option>
                                    <mat-option value="versions">Número de versiones</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>
                    </form>
                </div>

                <!-- Loading State -->
                @if (isLoading()) {
                    <div class="flex justify-center items-center py-12">
                        <mat-spinner diameter="40"></mat-spinner>
                    </div>
                }

                <!-- Templates Grid -->
                @if (!isLoading() && templates().length > 0) {
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        @for (template of templates(); track template.id) {
                            <mat-card class="h-full flex flex-col transform transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                                <mat-card-header class="pb-2">
                                    <div class="flex justify-between items-start w-full">
                                        <div class="flex-1">
                                            <mat-card-title class="text-lg font-semibold text-gray-900 mb-1">
                                                {{ template.name }}
                                            </mat-card-title>
                                            <mat-card-subtitle class="text-sm text-gray-600">
                                                {{ template.description || 'Sin descripción' }}
                                            </mat-card-subtitle>
                                        </div>

                                        <button
                                            mat-icon-button
                                            [matMenuTriggerFor]="templateMenu"
                                            class="ml-2">
                                            <mat-icon>more_vert</mat-icon>
                                        </button>

                                        <mat-menu #templateMenu="matMenu">
                                            <button mat-menu-item [routerLink]="[template.id]">
                                                <mat-icon>visibility</mat-icon>
                                                <span>Ver detalles</span>
                                            </button>
                                            <button mat-menu-item [routerLink]="['/tracing/builder/version', template.latestVersion?.id]">
                                                <mat-icon>edit</mat-icon>
                                                <span>Editar</span>
                                            </button>
                                            <button mat-menu-item (click)="cloneTemplate(template)">
                                                <mat-icon>content_copy</mat-icon>
                                                <span>Clonar</span>
                                            </button>
                                            <mat-divider></mat-divider>
                                            <button mat-menu-item (click)="toggleTemplateStatus(template)"
                                                    [class.text-red-600]="template.isActive">
                                                <mat-icon>{{ template.isActive ? 'block' : 'check_circle' }}</mat-icon>
                                                <span>{{ template.isActive ? 'Desactivar' : 'Activar' }}</span>
                                            </button>
                                        </mat-menu>
                                    </div>
                                </mat-card-header>

                                <mat-card-content class="pt-2">
                                    <!-- Status Chips -->
                                    <div class="flex flex-wrap gap-2 mb-4">
                                        <mat-chip-set>
                                            <mat-chip [class]="template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                                <mat-icon matChipAvatar>{{ template.isActive ? 'check_circle' : 'pause_circle' }}</mat-icon>
                                                {{ template.isActive ? 'Activa' : 'Inactiva' }}
                                            </mat-chip>

                                            @if (template.publishedVersion) {
                                                <mat-chip class="bg-blue-100 text-blue-800">
                                                    <mat-icon matChipAvatar>publish</mat-icon>
                                                    v{{ template.publishedVersion.version }}
                                                </mat-chip>
                                            }

                                            @if (template.totalVersions > 1) {
                                                <mat-chip class="bg-purple-100 text-purple-800"
                                                          [matTooltip]="template.totalVersions + ' versiones en total'">
                                                    <mat-icon matChipAvatar>layers</mat-icon>
                                                    {{ template.totalVersions }}
                                                </mat-chip>
                                            }
                                        </mat-chip-set>
                                    </div>

                                    <!-- Version Info -->
                                    <div class="space-y-2 text-sm">
                                        @if (template.latestVersion) {
                                            <div class="flex justify-between items-center">
                                                <span class="text-gray-600">Última versión:</span>
                                                <div class="flex items-center space-x-2">
                                                    <span class="font-medium">v{{ template.latestVersion.version }}</span>
                                                    <mat-chip class="text-xs"
                                                              [class]="getVersionStatusClass(template.latestVersion.status)">
                                                        {{ getVersionStatusLabel(template.latestVersion.status) }}
                                                    </mat-chip>
                                                </div>
                                            </div>
                                        }

                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-600">Creada:</span>
                                            <span class="font-medium">{{ template.createdAt | date:'short' }}</span>
                                        </div>

                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-600">Modificada:</span>
                                            <span class="font-medium">{{ template.updatedAt | date:'short' }}</span>
                                        </div>
                                    </div>
                                </mat-card-content>

                                <mat-card-actions class="flex justify-between p-4">
                                    <button
                                        mat-button
                                        color="primary"
                                        [routerLink]="[template.id]">
                                        <mat-icon>visibility</mat-icon>
                                        Ver Detalles
                                    </button>

                                    @if (template.latestVersion) {
                                        <button
                                            mat-raised-button
                                            color="accent"
                                            [routerLink]="['/tracing/builder/version', template.latestVersion.id]">
                                            <mat-icon>edit</mat-icon>
                                            Editar
                                        </button>
                                    }
                                </mat-card-actions>
                            </mat-card>
                        }
                    </div>
                }

                <!-- Empty State -->
                @if (!isLoading() && templates().length === 0) {
                    <div class="text-center py-12">
                        <mat-icon class="text-6xl text-gray-400 mb-4">description</mat-icon>
                        <h3 class="text-xl font-medium text-gray-900 mb-2">No hay plantillas</h3>
                        <p class="text-gray-600 mb-6">Comienza creando tu primera plantilla de flujo</p>
                        <button
                            mat-raised-button
                            color="primary"
                            routerLink="new">
                            <mat-icon>add</mat-icon>
                            Crear Primera Plantilla
                        </button>
                    </div>
                }
            </div>
        </div>
    `
})
export class TemplatesListComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    private readonly fb = inject(FormBuilder);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly templates = signal<TemplateWithVersions[]>([]);
    public readonly isLoading = signal(false);

    // Form
    public filtersForm: FormGroup;

    constructor() {
        this.filtersForm = this.fb.group({
            search: [ '' ],
            status: [ '' ],
            sortBy: [ 'updatedAt' ]
        });
    }

    ngOnInit(): void {
        this.loadTemplates();
        this.setupFilters();
    }

    private setupFilters(): void {
        this.filtersForm.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(() => {
            this.loadTemplates();
        });
    }

    loadTemplates(): void {
        this.isLoading.set(true);

        const filters = this.filtersForm.value;
        const apiFilters: any = {};

        if (filters.search) {
            apiFilters.name = filters.search;
        }

        if (filters.status === 'active') {
            apiFilters.isActive = true;
        } else if (filters.status === 'inactive') {
            apiFilters.isActive = false;
        }

        this.api.getTemplates(apiFilters).pipe(
            switchMap(templates => {
                // Load versions for each template
                const templatesWithVersions$ = templates.map(template =>
                    this.api.getVersionsByTemplate(template.id).pipe(
                        catchError(() => of([])),
                        switchMap(versions => {
                            const templateWithVersions: TemplateWithVersions = {
                                ...template,
                                versions,
                                latestVersion   : versions.length > 0 ? versions[versions.length - 1] : undefined,
                                publishedVersion: versions.find(v => v.status === FlowVersionStatus.PUBLISHED),
                                totalVersions   : versions.length
                            };
                            return of(templateWithVersions);
                        })
                    )
                );

                return templatesWithVersions$.length > 0 ?
                    Promise.all(templatesWithVersions$.map(obs => obs.toPromise())) :
                    of([]);
            }),
            catchError(error => {
                console.error('Error loading templates:', error);
                this.snackBar.open('Error al cargar las plantillas', 'Cerrar', {duration: 5000});
                return of([]);
            })
        ).subscribe(templates => {
            this.templates.set(this.sortTemplates(templates, filters.sortBy));
            this.isLoading.set(false);
        });
    }

    private sortTemplates(templates: TemplateWithVersions[], sortBy: string): TemplateWithVersions[] {
        return [ ...templates ].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'createdAt':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'updatedAt':
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'versions':
                    return b.totalVersions - a.totalVersions;
                default:
                    return 0;
            }
        });
    }

    public cloneTemplate(template: TemplateWithVersions): void {
        // TODO: Implement clone template dialog
        this.snackBar.open('Funcionalidad de clonado próximamente', 'Cerrar', {duration: 3000});
    }

    public toggleTemplateStatus(template: TemplateWithVersions): void {
        const newStatus = !template.isActive;
        const action = newStatus ? 'activar' : 'desactivar';

        if (confirm(`¿Estás seguro de que quieres ${ action } esta plantilla?`)) {
            this.api.updateTemplate(template.id, {isActive: newStatus} as any).pipe(
                catchError(error => {
                    console.error('Error updating template:', error);
                    this.snackBar.open(`Error al ${ action } la plantilla`, 'Cerrar', {duration: 5000});
                    return EMPTY;
                })
            ).subscribe(() => {
                this.snackBar.open(`Plantilla ${ action }da exitosamente`, 'Cerrar', {duration: 3000});
                this.loadTemplates();
            });
        }
    }

    public getVersionStatusClass(status: FlowVersionStatus): string {
        switch (status) {
            case FlowVersionStatus.DRAFT:
                return 'bg-yellow-100 text-yellow-800';
            case FlowVersionStatus.PUBLISHED:
                return 'bg-green-100 text-green-800';
            case FlowVersionStatus.ARCHIVED:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    public getVersionStatusLabel(status: FlowVersionStatus): string {
        switch (status) {
            case FlowVersionStatus.DRAFT:
                return 'Borrador';
            case FlowVersionStatus.PUBLISHED:
                return 'Publicada';
            case FlowVersionStatus.ARCHIVED:
                return 'Archivada';
            default:
                return 'Desconocido';
        }
    }
}
