import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { Router, ActivatedRoute }                                               from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators }                         from '@angular/forms';
import { MatButtonModule }                                                      from '@angular/material/button';
import { MatCardModule }                                                        from '@angular/material/card';
import { MatDialogModule, MatDialog }                                           from '@angular/material/dialog';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatIconModule }                                                        from '@angular/material/icon';
import { MatInputModule }                                                       from '@angular/material/input';
import { MatProgressSpinnerModule }                                             from '@angular/material/progress-spinner';
import { MatSelectModule }                                                      from '@angular/material/select';
import { MatTabsModule }                                                        from '@angular/material/tabs';
import { MatTooltipModule }                                                     from '@angular/material/tooltip';
import { MatChipsModule }                                                       from '@angular/material/chips';
import { PageHeaderComponent }                                                  from '@layout/components/page-header/page-header.component';
import { NotyfService }                                                         from '@shared/services/notyf.service';

import { ProcedureStore }                       from '../../store/procedure.store';
import { ProceduresService, ReviewResponseDto } from '../../services/procedures.service';
import { ProcedureVersion, ReviewRequest }      from '../../domain/interfaces';
import { ProcedureVersionStatus, ReviewStatus } from '../../domain/enums';
import { VersionDiffComponent }                 from '../../components/version-diff/version-diff.component';

@Component({
    selector       : 'app-procedure-version-detail',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        PageHeaderComponent,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTabsModule,
        MatTooltipModule,
        MatChipsModule,
        VersionDiffComponent
    ],
    template       : `
        <div class="flex flex-col min-w-0 w-full">
            <page-header
                [title]="getPageTitle()"
                [subtitle]="getPageSubtitle()"
                icon="heroicons_outline:document-text">
            </page-header>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 w-full p-6">
                <!-- Contenido principal -->
                <div class="md:col-span-8">
                    <!-- Estado de la versión -->
                    @if (currentVersion()) {
                        <div class="flex items-center justify-between p-4 mb-6 bg-card border rounded-lg shadow-sm">
                            <div class="flex items-center gap-4">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                                      [class]="getStatusClass(currentVersion()!.status)">
                                    {{ getStatusText(currentVersion()!.status) }}
                                </span>
                                @if (currentVersion()!.modifiesInternalRegulations) {
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                        <mat-icon class="mr-1" style="font-size: 14px;">gavel</mat-icon>
                                        Aviso Legal Requerido
                                    </span>
                                }
                            </div>
                        </div>
                    }

                    <!-- Controles de comparación de versiones -->
                    @if (availableVersions().length > 1) {
                        <mat-card class="mb-6">
                            <mat-card-content class="pt-4">
                                <div class="flex items-center gap-4">
                                    <mat-form-field class="flex-1">
                                        <mat-label>Comparar con versión</mat-label>
                                        <mat-select [value]="compareVersionId()" (selectionChange)="compareVersionId.set($event.value)">
                                            <mat-option value="">Sin comparación</mat-option>
                                            @for (version of availableVersions(); track version.id) {
                                                @if (version.id !== currentVersion()?.id) {
                                                    <mat-option [value]="version.id">
                                                        Versión {{ version.number }} - {{ getStatusText(version.status) }}
                                                    </mat-option>
                                                }
                                            }
                                        </mat-select>
                                    </mat-form-field>

                                    @if (compareVersionId()) {
                                        <button mat-button color="accent" (click)="loadDiff()">
                                            <mat-icon>compare_arrows</mat-icon>
                                            Mostrar Diferencias
                                        </button>
                                    }
                                </div>
                            </mat-card-content>
                        </mat-card>
                    }

                    <!-- Banner de aviso legal -->
                    @if (currentVersion()?.modifiesInternalRegulations) {
                        <mat-card class="mb-6 border-l-4 border-red-500">
                            <mat-card-content class="pt-4">
                                <div class="flex items-start">
                                    <mat-icon class="text-red-500 mr-3">warning</mat-icon>
                                    <div>
                                        <h3 class="text-lg font-semibold text-red-800 mb-2">Aviso Legal Requerido</h3>
                                        <p class="text-sm text-red-700 mb-2">
                                            Este procedimiento modifica el Reglamento Interno y requiere un aviso de 30 días
                                            según los artículos 153 y 156 del Código del Trabajo chileno.
                                        </p>
                                        <ul class="text-sm text-red-700 list-disc ml-4">
                                            <li>Debe publicarse en al menos dos ubicaciones visibles</li>
                                            <li>Se debe entregar una copia a los sindicatos y Comité Paritario</li>
                                            <li>Período de aviso de 30 días antes de la implementación</li>
                                        </ul>
                                    </div>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    }

                    <!-- Pestañas para diferentes vistas -->
                    <mat-card>
                        <mat-card-content class="p-0">
                            <mat-tab-group>
                                <!-- Pestaña de Contenido -->
                                <mat-tab label="Contenido">
                                    <div class="p-6">
                                        @if (currentVersion()) {
                                            <div class="space-y-6">
                                                <!-- Información básica -->
                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 class="text-sm font-medium text-gray-600 mb-1">Versión</h4>
                                                        <p class="text-lg">{{ currentVersion()?.number }}</p>
                                                    </div>
                                                    <div>
                                                        <h4 class="text-sm font-medium text-gray-600 mb-1">Creado</h4>
                                                        <p class="text-lg">{{ currentVersion()?.createdAt | date:'medium' }}</p>
                                                    </div>
                                                    @if (currentVersion()?.changelog) {
                                                        <div class="md:col-span-2">
                                                            <h4 class="text-sm font-medium text-gray-600 mb-1">Registro de cambios</h4>
                                                            <p class="text-sm bg-gray-50 p-3 rounded">{{ currentVersion()?.changelog }}</p>
                                                        </div>
                                                    }
                                                </div>

                                                <!-- Referencias legales -->
                                                @if (currentVersion()?.legalReferences?.length) {
                                                    <div>
                                                        <h4 class="text-sm font-medium text-gray-600 mb-3">Referencias Legales</h4>
                                                        <div class="space-y-2">
                                                            @for (ref of currentVersion()!.legalReferences; track $index) {
                                                                <div class="flex items-start p-3 bg-blue-50 rounded-lg">
                                                                    <mat-icon class="text-blue-600 mr-2 mt-0.5">gavel</mat-icon>
                                                                    <div class="flex-1">
                                                                        <div class="flex items-center gap-2">
                                                                            <span class="font-medium text-blue-900">{{ ref.norma }}</span>
                                                                            @if (ref.articulo) {
                                                                                <span class="text-sm text-blue-700">{{ ref.articulo }}</span>
                                                                            }
                                                                        </div>
                                                                        @if (ref.nota) {
                                                                            <p class="text-sm text-blue-800 mt-1">{{ ref.nota }}</p>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            }
                                                        </div>
                                                    </div>
                                                }

                                                <!-- Secciones del procedimiento -->
                                                @if (currentVersion()?.content?.sections?.length) {
                                                    <div>
                                                        <h4 class="text-sm font-medium text-gray-600 mb-3">Secciones del Procedimiento</h4>
                                                        <div class="space-y-4">
                                                            @for (section of currentVersion()!.content.sections; track $index) {
                                                                <div class="border border-gray-200 rounded-lg p-4">
                                                                    @if (section.title) {
                                                                        <h5 class="text-lg font-semibold mb-3">{{ section.title }}</h5>
                                                                    }
                                                                    <div class="prose prose-sm max-w-none">
                                                                        <pre class="whitespace-pre-wrap font-sans">{{ section.body }}</pre>
                                                                    </div>
                                                                </div>
                                                            }
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        }
                                    </div>
                                </mat-tab>

                                <!-- Pestaña de Diferencias -->
                                @if (compareVersionId() && versionDiff()) {
                                    <mat-tab label="Cambios">
                                        <div class="p-6">
                                            <app-version-diff
                                                [currentVersion]="currentVersion()!"
                                                [compareVersion]="getCompareVersion()"
                                                [diff]="versionDiff()">
                                            </app-version-diff>
                                        </div>
                                    </mat-tab>
                                }

                                <!-- Pestaña de Revisión -->
                                @if (canReview()) {
                                    <mat-tab label="Revisión">
                                        <div class="p-6">
                                            <div class="max-w-2xl">
                                                <h3 class="text-lg font-semibold mb-4">Revisar esta Versión</h3>

                                                <form class="space-y-4">
                                                    <mat-form-field class="w-full">
                                                        <mat-label>Decisión de Revisión</mat-label>
                                                        <mat-select [formControl]="reviewDecision" required>
                                                            <mat-option value="approved">Aprobar</mat-option>
                                                            <mat-option value="changes_requested">Solicitar Cambios</mat-option>
                                                        </mat-select>
                                                    </mat-form-field>

                                                    <mat-form-field class="w-full">
                                                        <mat-label>Comentarios</mat-label>
                                                        <textarea matInput [formControl]="reviewComment"
                                                                  placeholder="Ingrese sus comentarios de revisión..."
                                                                  rows="4"></textarea>
                                                        @if (reviewDecision.value === 'changes_requested') {
                                                            <mat-hint>Los comentarios son obligatorios al solicitar cambios</mat-hint>
                                                        }
                                                    </mat-form-field>

                                                    <div class="flex gap-2 pt-2">
                                                        <button mat-raised-button color="primary"
                                                                (click)="submitReview()"
                                                                [disabled]="!canSubmitReview() || isSubmittingReview()">
                                                            @if (isSubmittingReview()) {
                                                                <mat-progress-spinner diameter="16" class="mr-2"></mat-progress-spinner>
                                                            }
                                                            Enviar Revisión
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </mat-tab>
                                }
                            </mat-tab-group>
                        </mat-card-content>
                    </mat-card>

                    <!-- Acciones -->
                    <div class="flex justify-between items-center mt-6">
                        <div class="flex gap-2">
                            <button mat-button (click)="goBack()">Volver a la Lista</button>
                            @if (canEdit()) {
                                <button mat-button color="primary" (click)="editVersion()">
                                    <mat-icon>edit</mat-icon>
                                    Editar Versión
                                </button>
                            }
                        </div>

                        <div class="flex gap-2">
                            @if (canPublish()) {
                                <button mat-raised-button color="primary" (click)="publishVersion()">
                                    <mat-icon>publish</mat-icon>
                                    Publicar
                                </button>
                            }
                        </div>
                    </div>
                </div>

                <!-- Panel de información lateral -->
                <div class="md:col-span-4 flex flex-col gap-6">
                    <!-- Información general -->
                    <mat-card class="rounded-md shadow">
                        <mat-card-content>
                            <h2 class="text-xl font-medium mb-4 flex items-center">
                                <mat-icon svgIcon="mat_solid:info"></mat-icon>
                                <span class="ml-2">Información</span>
                            </h2>
                            <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                <p>Esta página muestra los detalles de una versión específica de procedimiento.</p>
                                <p><strong>Versión:</strong> Cada procedimiento puede tener múltiples versiones.</p>
                                <p><strong>Comparación:</strong> Puede comparar diferentes versiones para ver los cambios.</p>
                            </div>
                        </mat-card-content>
                    </mat-card>

                    <!-- Estado del procedimiento -->
                    @if (selectedProcedure() && currentVersion()) {
                        <mat-card class="rounded-md shadow">
                            <mat-card-content>
                                <h2 class="text-xl font-medium mb-4 flex items-center">
                                    <mat-icon svgIcon="mat_solid:assignment"></mat-icon>
                                    <span class="ml-2">Detalles de la Versión</span>
                                </h2>
                                <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                    <p><strong>Procedimiento:</strong> {{ selectedProcedure()?.title }}</p>
                                    <p><strong>Versión:</strong> {{ currentVersion()?.number }}</p>
                                    <p><strong>Estado:</strong>
                                        <span [class]="getStatusClass(currentVersion()!.status)">
                                            {{ getStatusText(currentVersion()!.status) }}
                                        </span>
                                    </p>
                                    @if (currentVersion()?.author) {
                                        <p><strong>Autor:</strong> {{ currentVersion()?.author }}</p>
                                    }
                                    @if (currentVersion()?.modifiesInternalRegulations) {
                                        <div class="p-2 bg-amber-50 rounded-md border border-amber-200">
                                            <p class="text-sm text-amber-800">
                                                <mat-icon class="text-amber-600 text-sm mr-1">warning</mat-icon>
                                                Modifica Reglamento Interno
                                            </p>
                                        </div>
                                    }
                                </div>
                            </mat-card-content>
                        </mat-card>
                    }

                    <!-- Acciones disponibles -->
                    <mat-card class="rounded-md shadow">
                        <mat-card-content>
                            <h2 class="text-xl font-medium mb-4 flex items-center">
                                <mat-icon svgIcon="mat_solid:settings"></mat-icon>
                                <span class="ml-2">Acciones</span>
                            </h2>
                            <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                <p><strong>Comparar:</strong> Seleccione otra versión para comparar cambios.</p>
                                <p><strong>Revisar:</strong> Los revisores pueden aprobar o solicitar cambios.</p>
                                <p><strong>Editar:</strong> Modifique el contenido si tiene permisos.</p>
                                <p><strong>Publicar:</strong> Haga disponible la versión para los usuarios.</p>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>
        </div>
    `
})
export class ProcedureVersionDetailComponent implements OnInit {
    private store = inject(ProcedureStore);
    private proceduresService = inject(ProceduresService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notyf = inject(NotyfService);

    // Signals
    compareVersionId = signal<string>('');
    isSubmittingReview = signal(false);

    // Form controls for review
    reviewDecision = new FormControl<'approved' | 'changes_requested'>('approved', Validators.required);
    reviewComment = new FormControl('');

    // Store signals
    selectedProcedure = this.store.selectedProcedure;
    currentVersion = this.store.currentVersion;
    procedureVersions = this.store.procedureVersions;
    versionDiff = this.store.versionDiff;
    canEditCurrentVersion = this.store.canEditCurrentVersion;
    canSubmitForReview = this.store.canSubmitForReview;
    canPublish = this.store.canPublish;

    // Computed signals
    availableVersions = computed(() => this.procedureVersions().filter(v => v.id !== this.currentVersion()?.id));

    canReview = computed(() => {
        const version = this.currentVersion();
        return version?.status === ProcedureVersionStatus.InReview;
        // TODO: Add permission check for reviewer role
    });

    canEdit = computed(() => {
        return this.canEditCurrentVersion();
    });

    canSubmitReview = computed(() => {
        if (!this.reviewDecision.value) return false;
        if (this.reviewDecision.value === 'changes_requested' && !this.reviewComment.value?.trim()) {
            return false;
        }
        return true;
    });

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const procedureId = params['id'];
            const versionId = params['v'];

            if (procedureId && versionId) {
                this.store.selectProcedure(procedureId);
                this.store.selectVersion(versionId);
            }
        });
    }

    getCompareVersion() {
        const compareId = this.compareVersionId();
        return this.availableVersions().find(v => v.id === compareId);
    }

    loadDiff(): void {
        const versionId = this.currentVersion()?.id;
        const compareId = this.compareVersionId();

        if (versionId && compareId) {
            this.store.loadVersionDiff(versionId);
        }
    }

    async submitReview(): Promise<void> {
        if (!this.canSubmitReview()) return;

        const versionId = this.currentVersion()?.id;
        if (!versionId) return;

        this.isSubmittingReview.set(true);
        try {
            const dto: ReviewResponseDto = {
                status : this.reviewDecision.value!,
                comment: this.reviewComment.value || undefined
            };

            await this.proceduresService.reviewVersion(versionId, dto).toPromise();

            // Refresh the version data
            this.store.selectVersion(versionId);
        } finally {
            this.isSubmittingReview.set(false);
        }
    }

    getStatusClass(status: ProcedureVersionStatus): string {
        const classes: Record<ProcedureVersionStatus, string> = {
            [ProcedureVersionStatus.Draft]           : 'bg-gray-100 text-gray-800',
            [ProcedureVersionStatus.InReview]        : 'bg-blue-100 text-blue-800',
            [ProcedureVersionStatus.ChangesRequested]: 'bg-amber-100 text-amber-800',
            [ProcedureVersionStatus.Approved]        : 'bg-green-100 text-green-800',
            [ProcedureVersionStatus.Published]       : 'bg-purple-100 text-purple-800',
            [ProcedureVersionStatus.Archived]        : 'bg-gray-100 text-gray-600'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusText(status: ProcedureVersionStatus): string {
        const texts: Record<ProcedureVersionStatus, string> = {
            [ProcedureVersionStatus.Draft]           : 'Borrador',
            [ProcedureVersionStatus.InReview]        : 'En Revisión',
            [ProcedureVersionStatus.ChangesRequested]: 'Cambios Solicitados',
            [ProcedureVersionStatus.Approved]        : 'Aprobado',
            [ProcedureVersionStatus.Published]       : 'Publicado',
            [ProcedureVersionStatus.Archived]        : 'Archivado'
        };
        return texts[status] || 'Desconocido';
    }

    getPageTitle(): string {
        const procedure = this.selectedProcedure();
        const version = this.currentVersion();
        if (procedure && version) {
            return `${ procedure.title } - Versión ${ version.number }`;
        }
        return 'Detalle de Versión';
    }

    getPageSubtitle(): string {
        const version = this.currentVersion();
        if (version) {
            return `Detalles y contenido de la versión ${ version.number }`;
        }
        return 'Consulta información detallada de la versión del procedimiento';
    }

    goBack(): void {
        this.router.navigate([ '../../list' ], {relativeTo: this.route});
    }

    editVersion(): void {
        const procedureId = this.selectedProcedure()?.id;
        if (procedureId) {
            this.router.navigate([ '../../', procedureId, 'edit' ], {relativeTo: this.route});
        }
    }

    publishVersion(): void {
        const procedureId = this.selectedProcedure()?.id;
        if (procedureId) {
            this.router.navigate([ '../../', procedureId, 'publish' ], {relativeTo: this.route});
        }
    }
}
