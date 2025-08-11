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
import { MatTabsModule }                                              from '@angular/material/tabs';
import { MatExpansionModule }                                         from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar }                             from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                   from '@angular/material/progress-spinner';
import { MatProgressBarModule }                                       from '@angular/material/progress-bar';
import { MatTooltipModule }                                           from '@angular/material/tooltip';
import { MatDividerModule }                                           from '@angular/material/divider';
import { MatDialogModule, MatDialog }                                 from '@angular/material/dialog';
import { MatStepperModule }                                           from '@angular/material/stepper';
import { switchMap, catchError, tap, takeUntil }                      from 'rxjs/operators';
import { of, EMPTY, Subject, combineLatest, interval }                from 'rxjs';

import { TracingApiService }                                                from '../../../services/tracing-api.service';
import { SyncService }                                                      from '../../../services/sync.service';
import { FlowInstance, FlowTemplate, FlowVersion, FlowStep, StepExecution } from '../../../models/entities';
import { CreateFlowInstanceDto }                                            from '../../../models/dtos/create-flow-instance.dto';
import { StepExecutionStatus }                                              from '../../../models/enums';

interface InstanceProgress {
    totalSteps: number;
    completedSteps: number;
    currentStep?: FlowStep;
    percentage: number;
    estimatedTimeRemaining?: number;
}

interface StepProgress {
    step: FlowStep;
    execution?: StepExecution;
    status: StepExecutionStatus;
    startedAt?: Date;
    finishedAt?: Date;
    duration?: number;
    actor?: string;
}

@Component({
    selector       : 'app-instance-detail',
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
        MatTabsModule,
        MatExpansionModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatDividerModule,
        MatDialogModule,
        MatStepperModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="instance-detail-container p-4 sm:p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div class="flex items-center space-x-4">
          <button mat-icon-button routerLink="/tracing/execution/instances" matTooltip="Volver a instancias">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ isNewInstance() ? 'Nueva Instancia' : 'Detalle de Instancia' }}
            </h1>
            <p class="text-gray-600 mt-1">
              {{ getTemplateName() || 'Configurando instancia...' }}
            </p>
          </div>
        </div>
        
        <!-- Sync Status -->
        <div class="flex items-center space-x-2">
          @if (!syncService.isOnline()) {
            <mat-icon class="text-orange-500" matTooltip="Modo offline">cloud_off</mat-icon>
          }
          @if (syncService.isSyncing()) {
            <mat-icon class="text-blue-500 animate-spin" matTooltip="Sincronizando">sync</mat-icon>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- New Instance Form -->
      @if (isNewInstance() && !isLoading()) {
        <mat-card class="new-instance-card mb-6">
          <mat-card-header>
            <mat-card-title class="flex items-center space-x-2">
              <mat-icon class="text-green-600">play_arrow</mat-icon>
              <span>Iniciar Nueva Instancia</span>
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content class="p-6">
            <form [formGroup]="instanceForm" class="space-y-4">
              <mat-form-field class="w-full">
                <mat-label>Plantilla de Flujo</mat-label>
                <mat-select formControlName="templateId" (selectionChange)="onTemplateSelected($event.value)">
                  @for (template of availableTemplates(); track template.id) {
                    <mat-option [value]="template.id">{{ template.name }}</mat-option>
                  }
                </mat-select>
                <mat-hint>Selecciona la plantilla de flujo a ejecutar</mat-hint>
              </mat-form-field>

              @if (selectedTemplate()) {
                <mat-form-field class="w-full">
                  <mat-label>Versión</mat-label>
                  <mat-select formControlName="version">
                    @for (version of availableVersions(); track version.version) {
                      <mat-option [value]="version.version">
                        v{{ version.version }} - {{ version.status }}
                        @if (version.publishedAt) {
                          ({{ version.publishedAt | date:'short' }})
                        }
                      </mat-option>
                    }
                  </mat-select>
                  <mat-hint>Versión de la plantilla a utilizar</mat-hint>
                </mat-form-field>

                <mat-form-field class="w-full">
                  <mat-label>Notas (opcional)</mat-label>
                  <textarea matInput formControlName="notes" rows="3" 
                           placeholder="Información adicional sobre esta instancia..."></textarea>
                </mat-form-field>
              }
            </form>
          </mat-card-content>
          
          <mat-card-actions class="p-6 pt-0">
            <button mat-raised-button 
                    color="primary" 
                    (click)="startInstance()" 
                    [disabled]="instanceForm.invalid || isStarting()">
              @if (isStarting()) {
                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
              }
              <mat-icon>play_arrow</mat-icon>
              Iniciar Instancia
            </button>
          </mat-card-actions>
        </mat-card>
      }

      <!-- Instance Details -->
      @if (!isNewInstance() && !isLoading() && instance()) {
        <div class="space-y-6">
          <!-- Instance Info Card -->
          <mat-card class="instance-info-card">
            <mat-card-content class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Basic Info -->
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-600">ID:</span>
                      <span class="font-medium">{{ instance()!.id }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Estado:</span>
                      <mat-chip [class]="getStatusClass(instance()!.status)">
                        {{ getStatusLabel(instance()!.status) }}
                      </mat-chip>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Iniciado por:</span>
                      <span class="font-medium">{{ instance()!.startedBy }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Fecha inicio:</span>
                      <span class="font-medium">{{ instance()!.startedAt | date:'medium' }}</span>
                    </div>
                    @if (instance()!.finishedAt) {
                      <div class="flex justify-between">
                        <span class="text-gray-600">Fecha fin:</span>
                        <span class="font-medium">{{ instance()!.finishedAt | date:'medium' }}</span>
                      </div>
                    }
                    <div class="flex justify-between">
                      <span class="text-gray-600">Versión:</span>
                      <span class="font-medium">v{{ instance()!.version }}</span>
                    </div>
                  </div>
                </div>

                <!-- Progress Info -->
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Progreso</h3>
                  @if (instanceProgress()) {
                    <div class="space-y-4">
                      <div>
                        <div class="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Pasos completados</span>
                          <span>{{ instanceProgress()!.completedSteps }}/{{ instanceProgress()!.totalSteps }}</span>
                        </div>
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="instanceProgress()!.percentage"
                          class="h-3 rounded">
                        </mat-progress-bar>
                        <div class="text-center text-sm text-gray-600 mt-1">
                          {{ instanceProgress()!.percentage.toFixed(1) }}%
                        </div>
                      </div>
                      
                      @if (instanceProgress()!.currentStep) {
                        <div class="bg-blue-50 p-3 rounded">
                          <div class="text-sm font-medium text-blue-900">Paso Actual</div>
                          <div class="text-blue-700">{{ instanceProgress()!.currentStep.name }}</div>
                        </div>
                      }
                      
                      @if (instanceProgress()!.estimatedTimeRemaining) {
                        <div class="text-sm text-gray-600">
                          <mat-icon class="text-xs mr-1">schedule</mat-icon>
                          Tiempo estimado restante: {{ formatDuration(instanceProgress()!.estimatedTimeRemaining) }}
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </mat-card-content>
            
            <!-- Actions -->
            <mat-card-actions class="p-6 pt-0">
              <div class="flex flex-wrap gap-2">
                @if (instance()!.status === 'ACTIVE') {
                  <button mat-raised-button color="primary" (click)="continueExecution()">
                    <mat-icon>play_arrow</mat-icon>
                    Continuar Ejecución
                  </button>
                  
                  <button mat-button (click)="pauseInstance()">
                    <mat-icon>pause</mat-icon>
                    Pausar
                  </button>
                  
                  <button mat-button color="warn" (click)="cancelInstance()">
                    <mat-icon>cancel</mat-icon>
                    Cancelar
                  </button>
                }
                
                @if (instance()!.status === 'FINISHED') {
                  <button mat-button (click)="viewReport()">
                    <mat-icon>assessment</mat-icon>
                    Ver Reporte
                  </button>
                  
                  <button mat-button (click)="exportData()">
                    <mat-icon>download</mat-icon>
                    Exportar Datos
                  </button>
                }
                
                <button mat-button [routerLink]="['/tracing/execution/instances', instance()!.id, 'progress']">
                  <mat-icon>timeline</mat-icon>
                  Vista Detallada
                </button>
              </div>
            </mat-card-actions>
          </mat-card>

          <!-- Steps Progress -->
          <mat-card class="steps-progress-card">
            <mat-card-header>
              <mat-card-title class="flex items-center space-x-2">
                <mat-icon>list</mat-icon>
                <span>Progreso de Pasos</span>
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content class="p-6">
              <mat-stepper orientation="vertical" [linear]="false">
                @for (stepProgress of stepsProgress(); track stepProgress.step.id) {
                  <mat-step [completed]="stepProgress.status === 'DONE'" 
                           [hasError]="stepProgress.status === 'SKIPPED'"
                           [editable]="false">
                    <ng-template matStepLabel>
                      <div class="flex items-center justify-between w-full">
                        <span>{{ stepProgress.step.name }}</span>
                        <div class="flex items-center space-x-2">
                          <mat-chip [class]="getStepStatusClass(stepProgress.status)" class="text-xs">
                            {{ getStepStatusLabel(stepProgress.status) }}
                          </mat-chip>
                          @if (stepProgress.duration) {
                            <span class="text-xs text-gray-500">
                              {{ formatDuration(stepProgress.duration) }}
                            </span>
                          }
                        </div>
                      </div>
                    </ng-template>
                    
                    <div class="step-content mt-2">
                      @if (stepProgress.step.description) {
                        <p class="text-sm text-gray-600 mb-2">{{ stepProgress.step.description }}</p>
                      }
                      
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        @if (stepProgress.startedAt) {
                          <div>
                            <span class="text-gray-500">Iniciado:</span>
                            <div class="font-medium">{{ stepProgress.startedAt | date:'short' }}</div>
                          </div>
                        }
                        
                        @if (stepProgress.finishedAt) {
                          <div>
                            <span class="text-gray-500">Finalizado:</span>
                            <div class="font-medium">{{ stepProgress.finishedAt | date:'short' }}</div>
                          </div>
                        }
                        
                        @if (stepProgress.actor) {
                          <div>
                            <span class="text-gray-500">Ejecutado por:</span>
                            <div class="font-medium">{{ stepProgress.actor }}</div>
                          </div>
                        }
                      </div>
                      
                      @if (stepProgress.status === 'IN_PROGRESS') {
                        <div class="mt-3">
                          <button mat-raised-button 
                                  color="primary" 
                                  size="small"
                                  [routerLink]="['/tracing/execution/runner', instance()!.id, stepProgress.step.id]">
                            <mat-icon>play_arrow</mat-icon>
                            Continuar Paso
                          </button>
                        </div>
                      }
                    </div>
                  </mat-step>
                }
              </mat-stepper>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
    styles         : [ `
    .instance-detail-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .new-instance-card {
      border-left: 4px solid #10b981;
    }

    .instance-info-card {
      border-left: 4px solid #3b82f6;
    }

    .steps-progress-card {
      border-left: 4px solid #8b5cf6;
    }

    .step-content {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      margin-top: 8px;
    }

    .mat-stepper-vertical {
      margin-top: 8px;
    }

    .mat-step-header {
      pointer-events: none;
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  ` ]
})
export class InstanceDetailComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    public readonly syncService = inject(SyncService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly instance = signal<FlowInstance | null>(null);
    public readonly selectedTemplate = signal<FlowTemplate | null>(null);
    public readonly availableTemplates = signal<FlowTemplate[]>([]);
    public readonly availableVersions = signal<FlowVersion[]>([]);
    public readonly instanceProgress = signal<InstanceProgress | null>(null);
    public readonly stepsProgress = signal<StepProgress[]>([]);
    public readonly isLoading = signal(false);
    public readonly isStarting = signal(false);

    // Form
    public instanceForm: FormGroup;

    // Real-time updates
    private destroy$ = new Subject<void>();
    private instanceId: string = '';

    constructor() {
        this.instanceForm = this.fb.group({
            templateId: [ '', Validators.required ],
            version   : [ '', Validators.required ],
            notes     : [ '' ]
        });
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(
            switchMap(params => {
                this.instanceId = params.get('id') || '';

                if (this.instanceId === 'new') {
                    return this.loadTemplatesForNewInstance();
                } else if (this.instanceId) {
                    return this.loadInstanceDetails();
                }
                return of(null);
            })
        ).subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public isNewInstance(): boolean {
        return this.instanceId === 'new';
    }

    public getTemplateName(): string {
        if (this.instance()) {
            // Try to find template name from available templates
            const template = this.availableTemplates().find(t => t.id === this.instance()!.templateId);
            return template?.name || `Template ${ this.instance()!.templateId }`;
        }
        return this.selectedTemplate()?.name || '';
    }

    private loadTemplatesForNewInstance() {
        this.isLoading.set(true);

        return this.api.getTemplates({isActive: true}).pipe(
            tap(templates => {
                this.availableTemplates.set(templates);
                this.isLoading.set(false);
            }),
            catchError(error => {
                console.error('Error loading templates:', error);
                this.snackBar.open('Error al cargar las plantillas', 'Cerrar', {duration: 5000});
                this.isLoading.set(false);
                return EMPTY;
            })
        );
    }

    private loadInstanceDetails() {
        this.isLoading.set(true);

        return combineLatest([
            this.api.getInstance(this.instanceId),
            this.api.getInstanceProgress(this.instanceId),
            this.api.getStepExecutionsByInstance(this.instanceId)
        ]).pipe(
            tap(([ instance, progress, stepExecutions ]) => {
                this.instance.set(instance);
                this.calculateProgress(progress, stepExecutions);
                this.startRealTimeUpdates();
                this.isLoading.set(false);
            }),
            catchError(error => {
                console.error('Error loading instance details:', error);
                this.snackBar.open('Error al cargar los detalles de la instancia', 'Cerrar', {duration: 5000});
                this.isLoading.set(false);
                return EMPTY;
            })
        );
    }

    private startRealTimeUpdates(): void {
        // Update progress every 10 seconds for active instances
        if (this.instance()?.status === 'ACTIVE') {
            interval(10000).pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.api.getInstanceProgress(this.instanceId))
            ).subscribe(progress => {
                this.calculateProgress(progress, []);
            });
        }
    }

    private calculateProgress(progressData: any, stepExecutions: any[]): void {
        // Mock progress calculation
        const mockProgress: InstanceProgress = {
            totalSteps            : 5,
            completedSteps        : 3,
            percentage            : 60,
            estimatedTimeRemaining: 1800000 // 30 minutes in ms
        };

        const mockStepsProgress: StepProgress[] = [
            {
                step      : {id: '1', name: 'Preparación', order: 1} as FlowStep,
                status    : StepExecutionStatus.DONE,
                startedAt : new Date(Date.now() - 3600000),
                finishedAt: new Date(Date.now() - 3300000),
                duration  : 300000,
                actor     : 'Juan Pérez'
            },
            {
                step      : {id: '2', name: 'Verificación', order: 2} as FlowStep,
                status    : StepExecutionStatus.DONE,
                startedAt : new Date(Date.now() - 3300000),
                finishedAt: new Date(Date.now() - 2700000),
                duration  : 600000,
                actor     : 'María García'
            },
            {
                step     : {id: '3', name: 'Procesamiento', order: 3} as FlowStep,
                status   : StepExecutionStatus.IN_PROGRESS,
                startedAt: new Date(Date.now() - 1800000),
                actor    : 'Carlos López'
            },
            {
                step  : {id: '4', name: 'Control de Calidad', order: 4} as FlowStep,
                status: StepExecutionStatus.PENDING
            },
            {
                step  : {id: '5', name: 'Finalización', order: 5} as FlowStep,
                status: StepExecutionStatus.PENDING
            }
        ];

        this.instanceProgress.set(mockProgress);
        this.stepsProgress.set(mockStepsProgress);
    }

    public onTemplateSelected(templateId: string): void {
        const template = this.availableTemplates().find(t => t.id === templateId);
        if (template) {
            this.selectedTemplate.set(template);

            // Load versions for selected template
            this.api.getVersionsByTemplate(templateId).subscribe(versions => {
                const publishedVersions = versions.filter(v => v.status === 'PUBLISHED');
                this.availableVersions.set(publishedVersions);

                // Auto-select latest published version
                if (publishedVersions.length > 0) {
                    const latestVersion = publishedVersions[publishedVersions.length - 1];
                    this.instanceForm.patchValue({version: latestVersion.version});
                }
            });
        }
    }

    public startInstance(): void {
        if (this.instanceForm.valid) {
            this.isStarting.set(true);

            const dto: CreateFlowInstanceDto = {
                templateId: this.instanceForm.value.templateId,
                version   : this.instanceForm.value.version,
                metadata  : {
                    notes        : this.instanceForm.value.notes,
                    startedFromUI: true
                }
            };

            this.api.createInstance(dto).pipe(
                tap(instance => {
                    this.snackBar.open('Instancia iniciada exitosamente', 'Cerrar', {duration: 3000});
                    this.router.navigate([ '/tracing/execution/instances', instance.id ]);
                }),
                catchError(error => {
                    console.error('Error starting instance:', error);
                    this.snackBar.open('Error al iniciar la instancia', 'Cerrar', {duration: 5000});
                    this.isStarting.set(false);
                    return EMPTY;
                })
            ).subscribe();
        }
    }

    public continueExecution(): void {
        const currentStep = this.stepsProgress().find(s => s.status === StepExecutionStatus.IN_PROGRESS);
        if (currentStep) {
            this.router.navigate([ '/tracing/execution/runner', this.instanceId, currentStep.step.id ]);
        } else {
            this.snackBar.open('No hay pasos pendientes para continuar', 'Cerrar', {duration: 3000});
        }
    }

    public pauseInstance(): void {
        if (confirm('¿Estás seguro de pausar esta instancia?')) {
            const reason = prompt('Motivo de pausa (opcional):') || 'Pausada por el usuario';

            this.api.pauseInstance(this.instanceId, reason).subscribe({
                next : () => {
                    this.snackBar.open('Instancia pausada exitosamente', 'Cerrar', {duration: 3000});
                    this.loadInstanceDetails().subscribe();
                },
                error: (error) => {
                    console.error('Error pausing instance:', error);
                    this.snackBar.open('Error al pausar la instancia', 'Cerrar', {duration: 5000});
                }
            });
        }
    }

    public cancelInstance(): void {
        if (confirm('¿Estás seguro de cancelar esta instancia?')) {
            const reason = prompt('Motivo de cancelación:');
            if (reason) {
                // TODO: Get actual user ID from auth service
                const cancelledBy = 'current-user-id';
                this.api.cancelInstance(this.instanceId, cancelledBy, reason).subscribe({
                    next : () => {
                        this.snackBar.open('Instancia cancelada exitosamente', 'Cerrar', {duration: 3000});
                        this.loadInstanceDetails().subscribe();
                    },
                    error: (error) => {
                        console.error('Error canceling instance:', error);
                        this.snackBar.open('Error al cancelar la instancia', 'Cerrar', {duration: 5000});
                    }
                });
            }
        }
    }

    public viewReport(): void {
        if (this.instance()) {
            this.router.navigate([ '/tracing/reports/instance', this.instanceId ], {
                queryParams: {
                    templateId: this.instance()!.templateId,
                    version   : this.instance()!.version,
                    status    : this.instance()!.status
                }
            });
        }
    }

    public exportData(): void {
        if (!this.instance()) return;

        const exportOptions = [
            {label: 'Exportar como CSV', action: () => this.exportAsCSV()},
            {label: 'Exportar como PDF', action: () => this.exportAsPDF()},
            {label: 'Exportar datos completos (JSON)', action: () => this.exportAsJSON()}
        ];

        // Simple implementation - could be enhanced with a dialog for format selection
        const format = prompt('Seleccione formato de exportación:\n1. CSV\n2. PDF\n3. JSON\n\nIngrese el número (1-3):');

        switch (format) {
            case '1':
                this.exportAsCSV();
                break;
            case '2':
                this.exportAsPDF();
                break;
            case '3':
                this.exportAsJSON();
                break;
            default:
                if (format !== null) {
                    this.snackBar.open('Formato no válido', 'Cerrar', {duration: 3000});
                }
        }
    }

    private exportAsCSV(): void {
        const instance = this.instance()!;
        const stepsData = this.stepsProgress();

        let csvContent = 'Instancia ID,Plantilla,Version,Estado,Fecha Inicio,Fecha Fin\n';
        csvContent += `${ instance.id },${ this.getTemplateName() || 'N/A' },${ instance.version },${ instance.status },${ instance.startedAt },${ instance.finishedAt || 'N/A' }\n\n`;

        csvContent += 'Paso,Estado,Fecha Inicio,Fecha Fin,Duración (min),Ejecutado por\n';
        stepsData.forEach(step => {
            const duration = step.duration ? Math.round(step.duration / 60000) : 'N/A';
            csvContent += `${ step.step.name },${ step.status },${ step.startedAt || 'N/A' },${ step.finishedAt || 'N/A' },${ duration },${ step.actor || 'N/A' }\n`;
        });

        this.downloadFile(csvContent, `instancia-${ instance.id }.csv`, 'text/csv');
        this.snackBar.open('Datos exportados como CSV', 'Cerrar', {duration: 3000});
    }

    private exportAsPDF(): void {
        // For now, export as HTML that can be printed as PDF
        const instance = this.instance()!;
        const stepsData = this.stepsProgress();

        let htmlContent = `
      <html>
        <head>
          <title>Reporte de Instancia ${ instance.id }</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Instancia de Flujo</h1>
            <p><strong>ID:</strong> ${ instance.id }</p>
            <p><strong>Plantilla:</strong> ${ this.getTemplateName() || 'N/A' }</p>
            <p><strong>Versión:</strong> ${ instance.version }</p>
            <p><strong>Estado:</strong> ${ instance.status }</p>
            <p><strong>Fecha de inicio:</strong> ${ new Date(instance.startedAt).toLocaleString() }</p>
            ${ instance.finishedAt ? `<p><strong>Fecha de fin:</strong> ${ new Date(instance.finishedAt).toLocaleString() }</p>` : '' }
          </div>
          
          <div class="section">
            <h2>Progreso de Pasos</h2>
            <table>
              <thead>
                <tr>
                  <th>Paso</th>
                  <th>Estado</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Duración</th>
                  <th>Ejecutado por</th>
                </tr>
              </thead>
              <tbody>
                ${ stepsData.map(step => `
                  <tr>
                    <td>${ step.step.name }</td>
                    <td>${ this.getStepStatusLabel(step.status) }</td>
                    <td>${ step.startedAt ? new Date(step.startedAt).toLocaleString() : 'N/A' }</td>
                    <td>${ step.finishedAt ? new Date(step.finishedAt).toLocaleString() : 'N/A' }</td>
                    <td>${ step.duration ? Math.round(step.duration / 60000) + ' min' : 'N/A' }</td>
                    <td>${ step.actor || 'N/A' }</td>
                  </tr>
                `).join('') }
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

        this.downloadFile(htmlContent, `instancia-${ instance.id }.html`, 'text/html');
        this.snackBar.open('Reporte HTML generado (puede imprimirse como PDF)', 'Cerrar', {duration: 5000});
    }

    private exportAsJSON(): void {
        const instance = this.instance()!;
        const exportData = {
            instance  : {
                id          : instance.id,
                templateId  : instance.templateId,
                templateName: this.getTemplateName(),
                version     : instance.version,
                status      : instance.status,
                startedAt   : instance.startedAt,
                finishedAt  : instance.finishedAt,
                startedBy   : instance.startedBy
            },
            progress  : this.instanceProgress(),
            steps     : this.stepsProgress().map(step => ({
                id        : step.step.id,
                name      : step.step.name,
                order     : step.step.order,
                status    : step.status,
                startedAt : step.startedAt,
                finishedAt: step.finishedAt,
                duration  : step.duration,
                actor     : step.actor
            })),
            exportedAt: new Date().toISOString()
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonContent, `instancia-${ instance.id }.json`, 'application/json');
        this.snackBar.open('Datos completos exportados como JSON', 'Cerrar', {duration: 3000});
    }

    private downloadFile(content: string, filename: string, contentType: string): void {
        const blob = new Blob([ content ], {type: contentType});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // Helper methods
    public getStatusClass(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'FINISHED':
                return 'bg-blue-100 text-blue-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    public getStatusLabel(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'Activa';
            case 'FINISHED':
                return 'Finalizada';
            case 'CANCELLED':
                return 'Cancelada';
            default:
                return 'Desconocido';
        }
    }

    public getStepStatusClass(status: StepExecutionStatus): string {
        switch (status) {
            case StepExecutionStatus.DONE:
                return 'bg-green-100 text-green-800';
            case StepExecutionStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-800';
            case StepExecutionStatus.PENDING:
                return 'bg-gray-100 text-gray-800';
            case StepExecutionStatus.SKIPPED:
                return 'bg-yellow-100 text-yellow-800';
            case StepExecutionStatus.FAILED:
                return 'bg-red-100 text-red-800';
            case StepExecutionStatus.RESTARTED:
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    public getStepStatusLabel(status: StepExecutionStatus): string {
        switch (status) {
            case StepExecutionStatus.DONE:
                return 'Completado';
            case StepExecutionStatus.IN_PROGRESS:
                return 'En Progreso';
            case StepExecutionStatus.PENDING:
                return 'Pendiente';
            case StepExecutionStatus.SKIPPED:
                return 'Saltado';
            case StepExecutionStatus.FAILED:
                return 'Fallido';
            case StepExecutionStatus.RESTARTED:
                return 'Reiniciado';
            default:
                return 'Desconocido';
        }
    }

    public formatDuration(milliseconds: number): string {
        const minutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${ hours }h ${ minutes % 60 }m`;
        }
        return `${ minutes }m`;
    }
}
