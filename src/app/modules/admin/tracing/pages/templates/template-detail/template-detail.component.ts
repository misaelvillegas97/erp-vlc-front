import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                                               from '@angular/common';
import { RouterModule, ActivatedRoute, Router }                       from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators }    from '@angular/forms';
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
import { MatTabsModule }                                              from '@angular/material/tabs';
import { MatTableModule }                                             from '@angular/material/table';
import { MatSortModule }                                              from '@angular/material/sort';
import { switchMap, catchError, tap }                                 from 'rxjs/operators';
import { of, EMPTY, combineLatest }                                   from 'rxjs';

import { TracingApiService }         from '../../../services/tracing-api.service';
import { FlowTemplate, FlowVersion } from '../../../models/entities';
import { FlowVersionStatus }         from '../../../models/enums';
import { CreateFlowTemplateDto }     from '../../../models/dtos/create-flow-template.dto';
import { CreateFlowVersionDto }      from '../../../models/dtos/create-flow-version.dto';

@Component({
    selector       : 'app-template-detail',
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
        MatTabsModule,
        MatTableModule,
        MatSortModule
        , PageHeaderComponent ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col min-w-0 w-full">
            <page-header
                [title]="isNewTemplate() ? 'Nueva Plantilla' : (template()?.name || 'Plantilla de Flujo')"
                [subtitle]="isNewTemplate() ? 'Crea una nueva plantilla de flujo' : (template()?.description || 'Detalles de la plantilla')">
            </page-header>

            <div class="flex flex-col items-center justify-center w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto py-4 sm:py-10 gap-y-4 sm:gap-y-6 px-4 sm:px-6">
                <!-- Loading State -->
                @if (isLoading()) {
                    <div class="flex justify-center items-center py-12">
                        <mat-spinner diameter="40"></mat-spinner>
                    </div>
                }

                <!-- Template Details -->
                @if (!isLoading() && (template() || isNewTemplate())) {
                    <!-- Header -->
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0 w-full">
                        <div class="flex items-center space-x-4">
                            <button mat-icon-button routerLink="/tracing/templates" matTooltip="Volver a plantillas">
                                <mat-icon>arrow_back</mat-icon>
                            </button>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">{{ isNewTemplate() ? 'Nueva Plantilla' : template()!.name }}</h1>
                                <p class="text-gray-600 mt-1">{{ isNewTemplate() ? 'Crea una nueva plantilla de flujo' : (template()!.description || 'Sin descripción') }}</p>
                            </div>
                        </div>

                        <div class="flex space-x-2">
                            @if (isNewTemplate()) {
                                <button
                                    mat-raised-button
                                    color="primary"
                                    [disabled]="templateForm.invalid || isSaving()"
                                    (click)="saveTemplate()">
                                    <mat-icon>save</mat-icon>
                                    Guardar Plantilla
                                </button>
                            } @else {
                                <button
                                    mat-button
                                    color="accent"
                                    (click)="createNewVersion()">
                                    <mat-icon>add</mat-icon>
                                    Nueva Versión
                                </button>

                                <button
                                    mat-raised-button
                                    color="primary"
                                    [disabled]="templateForm.invalid || isSaving()"
                                    (click)="updateTemplate()">
                                    <mat-icon>save</mat-icon>
                                    Actualizar
                                </button>
                            }
                        </div>
                    </div>

                    <!-- Template Form -->
                    @if (isNewTemplate() || isEditing()) {
                        <mat-card class="mb-6 w-full">
                            <mat-card-header>
                                <mat-card-title>Información de la Plantilla</mat-card-title>
                            </mat-card-header>
                            <mat-card-content class="p-6">
                                <form [formGroup]="templateForm" class="space-y-4">
                                    <mat-form-field class="w-full">
                                        <mat-label>Nombre de la plantilla</mat-label>
                                        <input matInput formControlName="name" placeholder="Ej: Proceso de Control de Calidad">
                                        <mat-icon matSuffix>title</mat-icon>
                                    </mat-form-field>

                                    <mat-form-field class="w-full">
                                        <mat-label>Descripción (opcional)</mat-label>
                                        <textarea matInput formControlName="description" rows="3"
                                                  placeholder="Describe el propósito y alcance de esta plantilla..."></textarea>
                                    </mat-form-field>
                                </form>
                            </mat-card-content>
                        </mat-card>
                    }

                    <!-- Template Info and Versions -->
                    @if (!isNewTemplate()) {
                        <mat-tab-group class="bg-card rounded-md shadow w-full">
                            <!-- Overview Tab -->
                            <mat-tab label="Información General">
                                <div class="p-6 min-h-[400px]">
                                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <!-- Template Info -->
                                        <mat-card>
                                            <mat-card-header>
                                                <mat-card-title class="flex items-center space-x-2">
                                                    <mat-icon>info</mat-icon>
                                                    <span>Información de la Plantilla</span>
                                                </mat-card-title>
                                            </mat-card-header>
                                            <mat-card-content class="p-4">
                                                <div class="space-y-4">
                                                    <div class="flex justify-between items-center">
                                                        <span class="text-gray-600">Estado:</span>
                                                        <mat-chip [class]="template()!.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                                            <mat-icon matChipAvatar>{{ template()!.isActive ? 'check_circle' : 'pause_circle' }}</mat-icon>
                                                            {{ template()!.isActive ? 'Activa' : 'Inactiva' }}
                                                        </mat-chip>
                                                    </div>

                                                    <div class="flex justify-between items-center">
                                                        <span class="text-gray-600">Creada por:</span>
                                                        <span class="font-medium">{{ template()!.createdBy }}</span>
                                                    </div>

                                                    <div class="flex justify-between items-center">
                                                        <span class="text-gray-600">Fecha de creación:</span>
                                                        <span class="font-medium">{{ template()!.createdAt | date:'medium' }}</span>
                                                    </div>

                                                    <div class="flex justify-between items-center">
                                                        <span class="text-gray-600">Última modificación:</span>
                                                        <span class="font-medium">{{ template()!.updatedAt | date:'medium' }}</span>
                                                    </div>

                                                    <div class="flex justify-between items-center">
                                                        <span class="text-gray-600">Total de versiones:</span>
                                                        <span class="font-medium">{{ versions().length }}</span>
                                                    </div>
                                                </div>
                                            </mat-card-content>
                                            <mat-card-actions>
                                                <button mat-button (click)="toggleEdit()">
                                                    <mat-icon>edit</mat-icon>
                                                    {{ isEditing() ? 'Cancelar' : 'Editar' }}
                                                </button>
                                            </mat-card-actions>
                                        </mat-card>

                                        <!-- Quick Stats -->
                                        <mat-card>
                                            <mat-card-header>
                                                <mat-card-title class="flex items-center space-x-2">
                                                    <mat-icon>analytics</mat-icon>
                                                    <span>Estadísticas Rápidas</span>
                                                </mat-card-title>
                                            </mat-card-header>
                                            <mat-card-content class="p-4">
                                                <div class="grid grid-cols-2 gap-4">
                                                    <div class="text-center p-4 bg-blue-50 rounded">
                                                        <div class="text-2xl font-bold text-blue-600">{{ getVersionsByStatus('PUBLISHED').length }}</div>
                                                        <div class="text-sm text-blue-600">Publicadas</div>
                                                    </div>

                                                    <div class="text-center p-4 bg-yellow-50 rounded">
                                                        <div class="text-2xl font-bold text-yellow-600">{{ getVersionsByStatus('DRAFT').length }}</div>
                                                        <div class="text-sm text-yellow-600">Borradores</div>
                                                    </div>

                                                    <div class="text-center p-4 bg-gray-50 rounded">
                                                        <div class="text-2xl font-bold text-gray-600">{{ getVersionsByStatus('ARCHIVED').length }}</div>
                                                        <div class="text-sm text-gray-600">Archivadas</div>
                                                    </div>

                                                    <div class="text-center p-4 bg-green-50 rounded">
                                                        <div class="text-2xl font-bold text-green-600">{{ getLatestVersion()?.version || 0 }}</div>
                                                        <div class="text-sm text-green-600">Última Versión</div>
                                                    </div>
                                                </div>
                                            </mat-card-content>
                                        </mat-card>
                                    </div>
                                </div>
                            </mat-tab>

                            <!-- Versions Tab -->
                            <mat-tab label="Versiones">
                                <div class="tab-content p-6">
                                    <div class="flex justify-between items-center mb-6">
                                        <h3 class="text-lg font-medium">Historial de Versiones</h3>
                                        <button mat-raised-button color="primary" (click)="createNewVersion()">
                                            <mat-icon>add</mat-icon>
                                            Nueva Versión
                                        </button>
                                    </div>

                                    <!-- Versions Table -->
                                    <mat-card>
                                        <div class="overflow-x-auto">
                                            <table mat-table [dataSource]="versions()" class="w-full">
                                                <!-- Version Column -->
                                                <ng-container matColumnDef="version">
                                                    <th mat-header-cell *matHeaderCellDef>Versión</th>
                                                    <td mat-cell *matCellDef="let version">
                                                        <div class="flex items-center space-x-2">
                                                            <span class="font-medium">v{{ version.version }}</span>
                                                            @if (version.version === getLatestVersion()?.version) {
                                                                <mat-chip class="bg-blue-100 text-blue-800 text-xs">Última</mat-chip>
                                                            }
                                                        </div>
                                                    </td>
                                                </ng-container>

                                                <!-- Status Column -->
                                                <ng-container matColumnDef="status">
                                                    <th mat-header-cell *matHeaderCellDef>Estado</th>
                                                    <td mat-cell *matCellDef="let version">
                                                        <mat-chip [class]="getVersionStatusClass(version.status)">
                                                            {{ getVersionStatusLabel(version.status) }}
                                                        </mat-chip>
                                                    </td>
                                                </ng-container>

                                                <!-- Created Date Column -->
                                                <ng-container matColumnDef="createdAt">
                                                    <th mat-header-cell *matHeaderCellDef>Creada</th>
                                                    <td mat-cell *matCellDef="let version">{{ version.createdAt | date:'short' }}</td>
                                                </ng-container>

                                                <!-- Published Date Column -->
                                                <ng-container matColumnDef="publishedAt">
                                                    <th mat-header-cell *matHeaderCellDef>Publicada</th>
                                                    <td mat-cell *matCellDef="let version">
                                                        {{ version.publishedAt ? (version.publishedAt | date:'short') : '-' }}
                                                    </td>
                                                </ng-container>

                                                <!-- Notes Column -->
                                                <ng-container matColumnDef="note">
                                                    <th mat-header-cell *matHeaderCellDef>Notas</th>
                                                    <td mat-cell *matCellDef="let version">
                                                        {{ version.note || '-' }}
                                                    </td>
                                                </ng-container>

                                                <!-- Actions Column -->
                                                <ng-container matColumnDef="actions">
                                                    <th mat-header-cell *matHeaderCellDef>Acciones</th>
                                                    <td mat-cell *matCellDef="let version">
                                                        <button mat-icon-button [matMenuTriggerFor]="versionMenu">
                                                            <mat-icon>more_vert</mat-icon>
                                                        </button>

                                                        <mat-menu #versionMenu="matMenu">
                                                            <button mat-menu-item [routerLink]="['/tracing/builder/version', version.id]">
                                                                <mat-icon>edit</mat-icon>
                                                                <span>Editar</span>
                                                            </button>

                                                            @if (version.status === 'DRAFT') {
                                                                <button mat-menu-item (click)="publishVersion(version)">
                                                                    <mat-icon>publish</mat-icon>
                                                                    <span>Publicar</span>
                                                                </button>
                                                            }

                                                            @if (version.status === 'PUBLISHED') {
                                                                <button mat-menu-item (click)="archiveVersion(version)">
                                                                    <mat-icon>archive</mat-icon>
                                                                    <span>Archivar</span>
                                                                </button>
                                                            }

                                                            <button mat-menu-item (click)="cloneVersion(version)">
                                                                <mat-icon>content_copy</mat-icon>
                                                                <span>Clonar</span>
                                                            </button>

                                                            @if (version.status === 'DRAFT') {
                                                                <mat-divider></mat-divider>
                                                                <button mat-menu-item (click)="deleteVersion(version)" class="text-red-600">
                                                                    <mat-icon>delete</mat-icon>
                                                                    <span>Eliminar</span>
                                                                </button>
                                                            }
                                                        </mat-menu>
                                                    </td>
                                                </ng-container>

                                                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                                                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                                            </table>
                                        </div>
                                    </mat-card>
                                </div>
                            </mat-tab>
                        </mat-tab-group>
                    }
                }

                <!-- Error State -->
                @if (!isLoading() && !template() && !isNewTemplate()) {
                    <div class="text-center py-12">
                        <mat-icon class="text-6xl text-red-400 mb-4">error</mat-icon>
                        <h3 class="text-xl font-medium text-gray-900 mb-2">Plantilla no encontrada</h3>
                        <p class="text-gray-600 mb-6">La plantilla que buscas no existe o ha sido eliminada</p>
                        <button mat-raised-button color="primary" routerLink="/tracing/templates">
                            <mat-icon>arrow_back</mat-icon>
                            Volver a Plantillas
                        </button>
                    </div>
                }
            </div>
        </div>
    `,
    styles         : [ `
        .template-detail-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .template-tabs {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-content {
            min-height: 400px;
        }

        @media (max-width: 640px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    ` ]
})
export class TemplateDetailComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly template = signal<FlowTemplate | null>(null);
    public readonly versions = signal<FlowVersion[]>([]);
    public readonly isLoading = signal(false);
    public readonly isSaving = signal(false);
    public readonly isEditing = signal(false);

    // Form
    public templateForm: FormGroup;

    // Table
    public displayedColumns = [ 'version', 'status', 'createdAt', 'publishedAt', 'note', 'actions' ];

    constructor() {
        this.templateForm = this.fb.group({
            name       : [ '', [ Validators.required, Validators.minLength(3) ] ],
            description: [ '' ]
        });
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(
            switchMap(params => {
                const id = params.get('id');
                const isNew = this.route.snapshot.routeConfig?.path === 'new';
                if (isNew) {
                    this.isEditing.set(true);
                    return of(null);
                } else if (id) {
                    return this.loadTemplate(id);
                }
                return of(null);
            })
        ).subscribe();
    }

    public isNewTemplate(): boolean {
        return this.route.snapshot.routeConfig?.path === 'new';
    }

    private loadTemplate(id: string) {
        this.isLoading.set(true);

        return combineLatest([
            this.api.getTemplate(id),
            this.api.getVersionsByTemplate(id)
        ]).pipe(
            tap(([ template, versions ]) => {
                this.template.set(template);
                this.versions.set(versions.sort((a, b) => b.version - a.version));

                // Populate form
                this.templateForm.patchValue({
                    name       : template.name,
                    description: template.description
                });

                this.isLoading.set(false);
            }),
            catchError(error => {
                console.error('Error loading template:', error);
                this.snackBar.open('Error al cargar la plantilla', 'Cerrar', {duration: 5000});
                this.isLoading.set(false);
                return EMPTY;
            })
        );
    }

    public toggleEdit(): void {
        this.isEditing.set(!this.isEditing());
        if (!this.isEditing()) {
            // Reset form
            const template = this.template();
            if (template) {
                this.templateForm.patchValue({
                    name       : template.name,
                    description: template.description
                });
            }
        }
    }

    public saveTemplate(): void {
        if (this.templateForm.valid) {
            this.isSaving.set(true);
            const dto: CreateFlowTemplateDto = this.templateForm.value;

            this.api.createTemplate(dto).pipe(
                tap(template => {
                    this.snackBar.open('Plantilla creada exitosamente', 'Cerrar', {duration: 3000});
                    this.router.navigate([ '/tracing/templates', template.id ]);
                }),
                catchError(error => {
                    console.error('Error creating template:', error);
                    this.snackBar.open('Error al crear la plantilla', 'Cerrar', {duration: 5000});
                    this.isSaving.set(false);
                    return EMPTY;
                })
            ).subscribe();
        }
    }

    public updateTemplate(): void {
        if (this.templateForm.valid && this.template()) {
            this.isSaving.set(true);
            const dto = this.templateForm.value;

            this.api.updateTemplate(this.template()!.id, dto).pipe(
                tap(template => {
                    this.template.set(template);
                    this.isEditing.set(false);
                    this.snackBar.open('Plantilla actualizada exitosamente', 'Cerrar', {duration: 3000});
                    this.isSaving.set(false);
                }),
                catchError(error => {
                    console.error('Error updating template:', error);
                    this.snackBar.open('Error al actualizar la plantilla', 'Cerrar', {duration: 5000});
                    this.isSaving.set(false);
                    return EMPTY;
                })
            ).subscribe();
        }
    }

    public createNewVersion(): void {
        const template = this.template();
        if (!template) return;

        const dto: CreateFlowVersionDto = {
            templateId: template.id,
            note      : `Nueva versión creada el ${ new Date().toLocaleDateString() }`
        };

        this.api.createVersion(dto).pipe(
            tap(version => {
                this.snackBar.open('Nueva versión creada exitosamente', 'Cerrar', {duration: 3000});
                this.router.navigate([ '/tracing/builder/version', version.id ]);
            }),
            catchError(error => {
                console.error('Error creating version:', error);
                this.snackBar.open('Error al crear la versión', 'Cerrar', {duration: 5000});
                return EMPTY;
            })
        ).subscribe();
    }

    public publishVersion(version: FlowVersion): void {
        if (confirm('¿Estás seguro de que quieres publicar esta versión? Una vez publicada no podrá ser editada.')) {
            this.api.publishVersion(version.id).pipe(
                tap(() => {
                    this.snackBar.open('Versión publicada exitosamente', 'Cerrar', {duration: 3000});
                    this.loadTemplate(this.template()!.id).subscribe();
                }),
                catchError(error => {
                    console.error('Error publishing version:', error);
                    this.snackBar.open('Error al publicar la versión', 'Cerrar', {duration: 5000});
                    return EMPTY;
                })
            ).subscribe();
        }
    }

    public archiveVersion(version: FlowVersion): void {
        if (confirm('¿Estás seguro de que quieres archivar esta versión?')) {
            this.api.archiveVersion(version.id).pipe(
                tap(() => {
                    this.snackBar.open('Versión archivada exitosamente', 'Cerrar', {duration: 3000});
                    this.loadTemplate(this.template()!.id).subscribe();
                }),
                catchError(error => {
                    console.error('Error archiving version:', error);
                    this.snackBar.open('Error al archivar la versión', 'Cerrar', {duration: 5000});
                    return EMPTY;
                })
            ).subscribe();
        }
    }

    public cloneVersion(version: FlowVersion): void {
        const dto: CreateFlowVersionDto = {
            templateId : this.template()!.id,
            fromVersion: version.version,
            note       : `Clonado de v${ version.version }`
        };

        this.api.createVersion(dto).pipe(
            tap(newVersion => {
                this.snackBar.open('Versión clonada exitosamente', 'Cerrar', {duration: 3000});
                this.loadTemplate(this.template()!.id).subscribe();
            }),
            catchError(error => {
                console.error('Error cloning version:', error);
                this.snackBar.open('Error al clonar la versión', 'Cerrar', {duration: 5000});
                return EMPTY;
            })
        ).subscribe();
    }

    public deleteVersion(version: FlowVersion): void {
        if (confirm('¿Estás seguro de que quieres eliminar esta versión? Esta acción no se puede deshacer.')) {
            this.api.deleteVersion(version.id).pipe(
                tap(() => {
                    this.snackBar.open('Versión eliminada exitosamente', 'Cerrar', {duration: 3000});
                    this.loadTemplate(this.template()!.id).subscribe();
                }),
                catchError(error => {
                    console.error('Error deleting version:', error);
                    this.snackBar.open('Error al eliminar la versión', 'Cerrar', {duration: 5000});
                    return EMPTY;
                })
            ).subscribe();
        }
    }

    // Helper methods
    public getVersionsByStatus(status: FlowVersionStatus): FlowVersion[] {
        return this.versions().filter(v => v.status === status);
    }

    public getLatestVersion(): FlowVersion | undefined {
        const versions = this.versions();
        return versions.length > 0 ? versions[0] : undefined;
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
