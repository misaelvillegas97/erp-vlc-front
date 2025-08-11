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
import { MatSnackBarModule, MatSnackBar }                             from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                   from '@angular/material/progress-spinner';
import { MatTooltipModule }                                           from '@angular/material/tooltip';
import { MatBadgeModule }                                             from '@angular/material/badge';
import { MatDividerModule }                                           from '@angular/material/divider';
import { MatBottomSheetModule }                                       from '@angular/material/bottom-sheet';
import { debounceTime, distinctUntilChanged, switchMap, catchError }  from 'rxjs/operators';
import { of, EMPTY }                                                  from 'rxjs';

import { TracingApiService }          from '../../../services/tracing-api.service';
import { SyncService }                from '../../../services/sync.service';
import { FlowInstance, FlowTemplate } from '../../../models/entities';

interface InstanceWithTemplate extends FlowInstance {
    template?: FlowTemplate;
    progress?: {
        completedSteps: number;
        totalSteps: number;
        percentage: number;
    };
}

@Component({
    selector       : 'app-instances-list',
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
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatBadgeModule,
        MatDividerModule,
        MatBottomSheetModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="instances-list-container p-4">
      <!-- Mobile-First Header -->
      <div class="flex flex-col space-y-4 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Instancias de Flujo</h1>
            <p class="text-sm text-gray-600 mt-1">Gestiona y ejecuta tus flujos de trabajo</p>
          </div>
          
          <!-- Sync Status Indicator -->
          <div class="flex items-center space-x-2">
            @if (!syncService.isOnline()) {
              <mat-icon class="text-orange-500" matTooltip="Modo offline">cloud_off</mat-icon>
            }
            @if (syncService.isSyncing()) {
              <mat-icon class="text-blue-500 animate-spin" matTooltip="Sincronizando">sync</mat-icon>
            }
            @if (syncService.pendingChanges() > 0) {
              <mat-icon class="text-yellow-500" [matBadge]="syncService.pendingChanges()" matTooltip="Cambios pendientes">sync_problem</mat-icon>
            }
          </div>
        </div>

        <!-- Quick Actions - Mobile Optimized -->
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button mat-raised-button color="primary" routerLink="new" class="w-full sm:w-auto">
            <mat-icon>add</mat-icon>
            <span class="ml-2">Nueva Instancia</span>
          </button>
          
          <button mat-button (click)="refreshInstances()" [disabled]="isLoading()" class="w-full sm:w-auto">
            <mat-icon>refresh</mat-icon>
            <span class="ml-2">Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Mobile-First Filters -->
      <mat-card class="mb-4">
        <mat-card-content class="p-4">
          <form [formGroup]="filtersForm" class="space-y-4">
            <!-- Search -->
            <mat-form-field class="w-full">
              <mat-label>Buscar instancias</mat-label>
              <input matInput formControlName="search" placeholder="ID, template, usuario...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <!-- Filters Row -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="ACTIVE">Activas</mat-option>
                  <mat-option value="FINISHED">Finalizadas</mat-option>
                  <mat-option value="CANCELLED">Canceladas</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Template</mat-label>
                <mat-select formControlName="templateId">
                  <mat-option value="">Todos los templates</mat-option>
                  @for (template of templates(); track template.id) {
                    <mat-option [value]="template.id">{{ template.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Ordenar por</mat-label>
                <mat-select formControlName="sortBy">
                  <mat-option value="startedAt">Fecha de inicio</mat-option>
                  <mat-option value="updatedAt">Última actualización</mat-option>
                  <mat-option value="status">Estado</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-8">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- Instances List - Mobile-First Cards -->
      @if (!isLoading() && instances().length > 0) {
        <div class="space-y-4">
          @for (instance of instances(); track instance.id) {
            <mat-card class="instance-card cursor-pointer hover:shadow-md transition-shadow" 
                     (click)="navigateToInstance(instance)">
              <mat-card-content class="p-4">
                <!-- Header Row -->
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 truncate">
                      {{ instance.template?.name || 'Template no encontrado' }}
                    </h3>
                    <p class="text-sm text-gray-600 truncate">ID: {{ instance.id }}</p>
                  </div>
                  
                  <div class="flex items-center space-x-2 ml-2">
                    <!-- Status Chip -->
                    <mat-chip [class]="getStatusClass(instance.status)" class="text-xs">
                      {{ getStatusLabel(instance.status) }}
                    </mat-chip>
                    
                    <!-- Menu -->
                    <button mat-icon-button [matMenuTriggerFor]="instanceMenu" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    
                    <mat-menu #instanceMenu="matMenu">
                      <button mat-menu-item [routerLink]="[instance.id]">
                        <mat-icon>visibility</mat-icon>
                        <span>Ver Detalles</span>
                      </button>
                      
                      @if (instance.status === 'ACTIVE') {
                        <button mat-menu-item [routerLink]="[instance.id, 'progress']">
                          <mat-icon>timeline</mat-icon>
                          <span>Ver Progreso</span>
                        </button>
                        
                        <button mat-menu-item (click)="pauseInstance(instance)">
                          <mat-icon>pause</mat-icon>
                          <span>Pausar</span>
                        </button>
                        
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="cancelInstance(instance)" class="text-red-600">
                          <mat-icon>cancel</mat-icon>
                          <span>Cancelar</span>
                        </button>
                      }
                      
                      @if (instance.status === 'FINISHED') {
                        <button mat-menu-item (click)="viewReport(instance)">
                          <mat-icon>assessment</mat-icon>
                          <span>Ver Reporte</span>
                        </button>
                      }
                    </mat-menu>
                  </div>
                </div>

                <!-- Progress Bar -->
                @if (instance.progress && instance.status === 'ACTIVE') {
                  <div class="mb-3">
                    <div class="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>{{ instance.progress.completedSteps }}/{{ instance.progress.totalSteps }} pasos</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                           [style.width.%]="instance.progress.percentage"></div>
                    </div>
                  </div>
                }

                <!-- Instance Info -->
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600">Iniciado por:</span>
                    <p class="font-medium truncate">{{ instance.startedBy }}</p>
                  </div>
                  
                  <div>
                    <span class="text-gray-600">Fecha inicio:</span>
                    <p class="font-medium">{{ instance.startedAt | date:'short' }}</p>
                  </div>
                  
                  @if (instance.finishedAt) {
                    <div>
                      <span class="text-gray-600">Finalizada:</span>
                      <p class="font-medium">{{ instance.finishedAt | date:'short' }}</p>
                    </div>
                  }
                  
                  <div>
                    <span class="text-gray-600">Versión:</span>
                    <p class="font-medium">v{{ instance.version }}</p>
                  </div>
                </div>

                <!-- Quick Actions for Active Instances -->
                @if (instance.status === 'ACTIVE') {
                  <div class="flex space-x-2 mt-4 pt-3 border-t">
                    <button mat-button color="primary" size="small" 
                            [routerLink]="['/tracing/execution/runner', instance.id, 'next-step']">
                      <mat-icon>play_arrow</mat-icon>
                      Continuar
                    </button>
                    
                    <button mat-button size="small" [routerLink]="[instance.id, 'progress']">
                      <mat-icon>timeline</mat-icon>
                      Progreso
                    </button>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Load More Button -->
        @if (hasMore()) {
          <div class="text-center mt-6">
            <button mat-button (click)="loadMore()" [disabled]="isLoadingMore()">
              @if (isLoadingMore()) {
                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
              }
              Cargar Más
            </button>
          </div>
        }
      }

      <!-- Empty State -->
      @if (!isLoading() && instances().length === 0) {
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">assignment</mat-icon>
          <h3 class="text-xl font-medium text-gray-900 mb-2">No hay instancias</h3>
          <p class="text-gray-600 mb-6">Comienza creando tu primera instancia de flujo</p>
          <button mat-raised-button color="primary" routerLink="new">
            <mat-icon>add</mat-icon>
            Crear Primera Instancia
          </button>
        </div>
      }
    </div>
  `,
    styles         : [ `
    .instances-list-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .instance-card {
      transition: all 0.2s ease;
    }

    .instance-card:hover {
      transform: translateY(-1px);
    }

    .instance-card:active {
      transform: translateY(0);
    }

    @media (max-width: 640px) {
      .instances-list-container {
        padding: 1rem;
      }
      
      .grid {
        grid-template-columns: 1fr;
      }
    }

    /* PWA-friendly touch targets */
    button {
      min-height: 44px;
      min-width: 44px;
    }

    .mat-mdc-card {
      margin-bottom: 0;
    }
  ` ]
})
export class InstancesListComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    public readonly syncService = inject(SyncService);
    private readonly fb = inject(FormBuilder);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly instances = signal<InstanceWithTemplate[]>([]);
    public readonly templates = signal<FlowTemplate[]>([]);
    public readonly isLoading = signal(false);
    public readonly isLoadingMore = signal(false);

    // Pagination
    private currentPage = 1;
    private readonly pageSize = 20;
    private totalInstances = 0;

    // Form
    public filtersForm: FormGroup;

    constructor() {
        this.filtersForm = this.fb.group({
            search    : [ '' ],
            status    : [ '' ],
            templateId: [ '' ],
            sortBy    : [ 'startedAt' ]
        });
    }

    ngOnInit(): void {
        this.loadTemplates();
        this.loadInstances();
        this.setupFilters();
    }

    private setupFilters(): void {
        this.filtersForm.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(() => {
            this.currentPage = 1;
            this.loadInstances();
        });
    }

    private loadTemplates(): void {
        this.api.getTemplates().pipe(
            catchError(error => {
                console.error('Error loading templates:', error);
                return of([]);
            })
        ).subscribe(templates => {
            this.templates.set(templates);
        });
    }

    private loadInstances(append = false): void {
        if (!append) {
            this.isLoading.set(true);
        } else {
            this.isLoadingMore.set(true);
        }

        const filters = this.filtersForm.value;
        const apiFilters: any = {
            page : this.currentPage,
            limit: this.pageSize
        };

        if (filters.search) apiFilters.search = filters.search;
        if (filters.status) apiFilters.status = filters.status;
        if (filters.templateId) apiFilters.templateId = filters.templateId;

        this.api.getInstances(apiFilters).pipe(
            switchMap(response => {
                this.totalInstances = response.total;

                // Enrich instances with template data and progress
                const enrichedInstances$ = response.data.map(instance => {
                    const template = this.templates().find(t => t.id === instance.templateId);

                    // Mock progress calculation
                    const progress = instance.status === 'ACTIVE' ? {
                        completedSteps: Math.floor(Math.random() * 5) + 1,
                        totalSteps    : Math.floor(Math.random() * 3) + 5,
                        percentage    : 0
                    } : undefined;

                    if (progress) {
                        progress.percentage = (progress.completedSteps / progress.totalSteps) * 100;
                    }

                    return {
                        ...instance,
                        template,
                        progress
                    } as InstanceWithTemplate;
                });

                return of(enrichedInstances$);
            }),
            catchError(error => {
                console.error('Error loading instances:', error);
                this.snackBar.open('Error al cargar las instancias', 'Cerrar', {duration: 5000});
                return of([]);
            })
        ).subscribe(instances => {
            if (append) {
                this.instances.set([ ...this.instances(), ...instances ]);
                this.isLoadingMore.set(false);
            } else {
                this.instances.set(instances);
                this.isLoading.set(false);
            }
        });
    }

    public refreshInstances(): void {
        this.currentPage = 1;
        this.loadInstances();
    }

    public loadMore(): void {
        this.currentPage++;
        this.loadInstances(true);
    }

    public hasMore(): boolean {
        return this.instances().length < this.totalInstances;
    }

    public navigateToInstance(instance: InstanceWithTemplate): void {
        // Navigation handled by routerLink in template
    }

    public pauseInstance(instance: InstanceWithTemplate): void {
        // TODO: Implement pause functionality
        this.snackBar.open('Funcionalidad de pausa próximamente', 'Cerrar', {duration: 3000});
    }

    public cancelInstance(instance: InstanceWithTemplate): void {
        if (confirm('¿Estás seguro de cancelar esta instancia?')) {
            this.api.cancelInstance(instance.id, 'current-user-id', 'Cancelada por el usuario').pipe(
                catchError(error => {
                    console.error('Error canceling instance:', error);
                    this.snackBar.open('Error al cancelar la instancia', 'Cerrar', {duration: 5000});
                    return EMPTY;
                })
            ).subscribe(() => {
                this.snackBar.open('Instancia cancelada exitosamente', 'Cerrar', {duration: 3000});
                this.refreshInstances();
            });
        }
    }

    public viewReport(instance: InstanceWithTemplate): void {
        // TODO: Navigate to report view
        this.snackBar.open('Vista de reportes próximamente', 'Cerrar', {duration: 3000});
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
}
