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
import { MatDatepickerModule }                                        from '@angular/material/datepicker';
import { MatNativeDateModule }                                        from '@angular/material/core';
import { MatChipsModule }                                             from '@angular/material/chips';
import { MatTabsModule }                                              from '@angular/material/tabs';
import { MatSnackBarModule, MatSnackBar }                             from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                   from '@angular/material/progress-spinner';
import { MatTooltipModule }                                           from '@angular/material/tooltip';
import { MatDividerModule }                                           from '@angular/material/divider';
import { MatMenuModule }                                              from '@angular/material/menu';
import { switchMap, catchError, debounceTime, distinctUntilChanged }  from 'rxjs/operators';
import { of, EMPTY }                                                  from 'rxjs';

import { TracingApiService } from '../../../services/tracing-api.service';
import { FlowTemplate }      from '../../../models/entities';

interface KpiMetrics {
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
    cancelledInstances: number;
    averageCompletionTime: number; // in hours
    successRate: number; // percentage
    totalWasteRecords: number;
    totalCostImpact: number;
    efficiencyRate: number; // percentage
    complianceRate: number; // percentage
}

interface TimeSeriesData {
    date: string;
    instancesProcessed: number;
    averageTime: number;
    wasteAmount: number;
    efficiency: number;
}

interface FilterOptions {
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
    templateId: string | null;
    version: number | null;
    groupBy: 'day' | 'week' | 'month';
}

@Component({
    selector       : 'app-kpi-dashboard',
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
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatTabsModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatDividerModule,
        MatMenuModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="kpi-dashboard-container p-4 sm:p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard de KPIs</h1>
          <p class="text-gray-600 mt-1">Métricas y análisis de rendimiento del sistema de trazabilidad</p>
        </div>
        
        <div class="flex items-center space-x-2">
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          
          <button mat-button [matMenuTriggerFor]="exportMenu">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
          
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportData('csv')">
              <mat-icon>table_chart</mat-icon>
              Exportar CSV
            </button>
            <button mat-menu-item (click)="exportData('pdf')">
              <mat-icon>picture_as_pdf</mat-icon>
              Exportar PDF
            </button>
            <button mat-menu-item (click)="exportData('json')">
              <mat-icon>code</mat-icon>
              Exportar JSON
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card mb-6">
        <mat-card-header>
          <mat-card-title class="flex items-center space-x-2">
            <mat-icon>filter_list</mat-icon>
            <span>Filtros</span>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content class="p-6">
          <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <mat-form-field class="w-full">
              <mat-label>Fecha inicio</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>Fecha fin</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>Plantilla</mat-label>
              <mat-select formControlName="templateId">
                <mat-option value="">Todas las plantillas</mat-option>
                @for (template of availableTemplates(); track template.id) {
                  <mat-option [value]="template.id">{{ template.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>Agrupar por</mat-label>
              <mat-select formControlName="groupBy">
                <mat-option value="day">Día</mat-option>
                <mat-option value="week">Semana</mat-option>
                <mat-option value="month">Mes</mat-option>
              </mat-select>
            </mat-form-field>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- KPI Cards -->
      @if (!isLoading() && kpiMetrics()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Total Instances -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Instancias</p>
                  <p class="text-3xl font-bold text-blue-600">{{ kpiMetrics()!.totalInstances | number }}</p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <mat-icon class="text-blue-600">assessment</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Active Instances -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Instancias Activas</p>
                  <p class="text-3xl font-bold text-green-600">{{ kpiMetrics()!.activeInstances | number }}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <mat-icon class="text-green-600">play_circle</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Success Rate -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                  <p class="text-3xl font-bold text-purple-600">{{ kpiMetrics()!.successRate | number:'1.1-1' }}%</p>
                </div>
                <div class="p-3 bg-purple-100 rounded-full">
                  <mat-icon class="text-purple-600">check_circle</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Average Completion Time -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                  <p class="text-3xl font-bold text-orange-600">{{ formatDuration(kpiMetrics()!.averageCompletionTime) }}</p>
                </div>
                <div class="p-3 bg-orange-100 rounded-full">
                  <mat-icon class="text-orange-600">schedule</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Secondary KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Efficiency Rate -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Eficiencia</p>
                  <p class="text-2xl font-bold text-teal-600">{{ kpiMetrics()!.efficiencyRate | number:'1.1-1' }}%</p>
                </div>
                <div class="p-3 bg-teal-100 rounded-full">
                  <mat-icon class="text-teal-600">trending_up</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Compliance Rate -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Cumplimiento</p>
                  <p class="text-2xl font-bold text-indigo-600">{{ kpiMetrics()!.complianceRate | number:'1.1-1' }}%</p>
                </div>
                <div class="p-3 bg-indigo-100 rounded-full">
                  <mat-icon class="text-indigo-600">verified</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Total Waste -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Registros de Merma</p>
                  <p class="text-2xl font-bold text-red-600">{{ kpiMetrics()!.totalWasteRecords | number }}</p>
                </div>
                <div class="p-3 bg-red-100 rounded-full">
                  <mat-icon class="text-red-600">warning</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Cost Impact -->
          <mat-card class="kpi-card">
            <mat-card-content class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Impacto en Costos</p>
                  <p class="text-2xl font-bold text-yellow-600">{{ formatCurrency(kpiMetrics()!.totalCostImpact) }}</p>
                </div>
                <div class="p-3 bg-yellow-100 rounded-full">
                  <mat-icon class="text-yellow-600">attach_money</mat-icon>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Time Series Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title class="flex items-center space-x-2">
                <mat-icon>timeline</mat-icon>
                <span>Tendencias Temporales</span>
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content class="p-6">
              <div class="chart-container" style="height: 300px;">
                <canvas #timeSeriesChart></canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Performance Distribution -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title class="flex items-center space-x-2">
                <mat-icon>donut_large</mat-icon>
                <span>Distribución de Estados</span>
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content class="p-6">
              <div class="chart-container" style="height: 300px;">
                <canvas #statusChart></canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Activity -->
        <mat-card class="recent-activity-card">
          <mat-card-header>
            <mat-card-title class="flex items-center space-x-2">
              <mat-icon>history</mat-icon>
              <span>Actividad Reciente</span>
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content class="p-6">
            <div class="space-y-4">
              @for (activity of recentActivity(); track activity.id) {
                <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div class="flex-shrink-0">
                    <mat-icon [class]="getActivityIconClass(activity.type)">{{ getActivityIcon(activity.type) }}</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ activity.description }}</p>
                    <p class="text-sm text-gray-500">{{ activity.timestamp | date:'medium' }}</p>
                  </div>
                  <div class="flex-shrink-0">
                    <mat-chip [class]="getActivityStatusClass(activity.status)" class="text-xs">
                      {{ activity.status }}
                    </mat-chip>
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
    styles         : [ `
    .kpi-dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .filters-card {
      border-left: 4px solid #3b82f6;
    }

    .kpi-card {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .chart-card {
      border-left: 4px solid #10b981;
    }

    .recent-activity-card {
      border-left: 4px solid #8b5cf6;
    }

    .chart-container {
      position: relative;
      width: 100%;
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  ` ]
})
export class KpiDashboardComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    private readonly fb = inject(FormBuilder);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly kpiMetrics = signal<KpiMetrics | null>(null);
    public readonly timeSeriesData = signal<TimeSeriesData[]>([]);
    public readonly availableTemplates = signal<FlowTemplate[]>([]);
    public readonly recentActivity = signal<any[]>([]);
    public readonly isLoading = signal(false);

    // Form
    public filtersForm: FormGroup;

    constructor() {
        this.filtersForm = this.fb.group({
            startDate : [ new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ], // 30 days ago
            endDate   : [ new Date() ],
            templateId: [ '' ],
            groupBy   : [ 'day' ]
        });
    }

    ngOnInit(): void {
        this.loadTemplates();
        this.loadKpiData();
        this.setupFiltersSubscription();
    }

    private setupFiltersSubscription(): void {
        this.filtersForm.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.loadKpiData();
        });
    }

    private loadTemplates(): void {
        this.api.getTemplates({isActive: true}).pipe(
            catchError(error => {
                console.error('Error loading templates:', error);
                return of([]);
            })
        ).subscribe(templates => {
            this.availableTemplates.set(templates);
        });
    }

    public loadKpiData(): void {
        this.isLoading.set(true);

        const filters = this.getFiltersFromForm();

        this.api.getKpiReport(filters).pipe(
            catchError(error => {
                console.error('Error loading KPI data:', error);
                this.snackBar.open('Error al cargar los datos de KPI', 'Cerrar', {duration: 5000});
                return of({metrics: this.getMockKpiData(), timeSeries: this.getMockTimeSeriesData(), recentActivity: this.getMockRecentActivity()});
            })
        ).subscribe(data => {
            this.kpiMetrics.set(data.metrics || this.getMockKpiData());
            this.timeSeriesData.set(data.timeSeries || this.getMockTimeSeriesData());
            this.recentActivity.set(data.recentActivity || this.getMockRecentActivity());
            this.isLoading.set(false);
        });
    }

    private getFiltersFromForm(): any {
        const formValue = this.filtersForm.value;
        return {
            range     : {
                start: formValue.startDate,
                end  : formValue.endDate
            },
            templateId: formValue.templateId || undefined,
            groupBy   : formValue.groupBy
        };
    }

    public refreshData(): void {
        this.loadKpiData();
        this.snackBar.open('Datos actualizados', 'Cerrar', {duration: 2000});
    }

    public exportData(format: 'csv' | 'pdf' | 'json'): void {
        const filters = this.getFiltersFromForm();

        switch (format) {
            case 'csv':
                this.exportAsCSV(filters);
                break;
            case 'pdf':
                this.exportAsPDF();
                break;
            case 'json':
                this.exportAsJSON();
                break;
        }
    }

    private exportAsCSV(filters: any): void {
        this.api.exportKpiToCsv(filters).pipe(
            catchError(error => {
                console.error('Error exporting CSV:', error);
                this.snackBar.open('Error al exportar CSV', 'Cerrar', {duration: 5000});
                return EMPTY;
            })
        ).subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kpi-report-${ new Date().toISOString().split('T')[0] }.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.snackBar.open('Reporte CSV descargado', 'Cerrar', {duration: 3000});
        });
    }

    private exportAsPDF(): void {
        const metrics = this.kpiMetrics();
        if (!metrics) return;

        const htmlContent = this.generatePDFContent(metrics);
        const blob = new Blob([ htmlContent ], {type: 'text/html'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kpi-dashboard-${ new Date().toISOString().split('T')[0] }.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Reporte PDF (HTML) generado', 'Cerrar', {duration: 3000});
    }

    private generatePDFContent(metrics: KpiMetrics): string {
        return `
      <html>
        <head>
          <title>Reporte KPI - Dashboard de Trazabilidad</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
            .kpi-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .kpi-label { font-size: 14px; color: #666; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dashboard de KPIs - Trazabilidad</h1>
            <p>Generado el: ${ new Date().toLocaleString() }</p>
          </div>
          
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Instancias</div>
              <div class="kpi-value">${ metrics.totalInstances }</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Instancias Activas</div>
              <div class="kpi-value">${ metrics.activeInstances }</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Tasa de Éxito</div>
              <div class="kpi-value">${ metrics.successRate.toFixed(1) }%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Tiempo Promedio</div>
              <div class="kpi-value">${ this.formatDuration(metrics.averageCompletionTime) }</div>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    private exportAsJSON(): void {
        const exportData = {
            metrics       : this.kpiMetrics(),
            timeSeries    : this.timeSeriesData(),
            recentActivity: this.recentActivity(),
            filters       : this.filtersForm.value,
            exportedAt    : new Date().toISOString()
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([ jsonContent ], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kpi-data-${ new Date().toISOString().split('T')[0] }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Datos JSON exportados', 'Cerrar', {duration: 3000});
    }

    // Helper methods
    public formatDuration(hours: number): string {
        if (hours < 1) {
            return `${ Math.round(hours * 60) }m`;
        } else if (hours < 24) {
            return `${ hours.toFixed(1) }h`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${ days }d ${ remainingHours.toFixed(1) }h`;
        }
    }

    public formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CL', {
            style                : 'currency',
            currency             : 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    public getActivityIcon(type: string): string {
        switch (type) {
            case 'instance_created':
                return 'add_circle';
            case 'instance_completed':
                return 'check_circle';
            case 'instance_cancelled':
                return 'cancel';
            case 'step_completed':
                return 'task_alt';
            default:
                return 'info';
        }
    }

    public getActivityIconClass(type: string): string {
        switch (type) {
            case 'instance_created':
                return 'text-green-600';
            case 'instance_completed':
                return 'text-blue-600';
            case 'instance_cancelled':
                return 'text-red-600';
            case 'step_completed':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    }

    public getActivityStatusClass(status: string): string {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'ACTIVE':
                return 'bg-blue-100 text-blue-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    // Mock data methods (for development/testing)
    private getMockKpiData(): KpiMetrics {
        return {
            totalInstances       : 1247,
            activeInstances      : 23,
            completedInstances   : 1156,
            cancelledInstances   : 68,
            averageCompletionTime: 4.2, // hours
            successRate          : 92.7,
            totalWasteRecords    : 89,
            totalCostImpact      : 15420,
            efficiencyRate       : 87.3,
            complianceRate       : 94.1
        };
    }

    private getMockTimeSeriesData(): TimeSeriesData[] {
        const data: TimeSeriesData[] = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            data.push({
                date              : date.toISOString().split('T')[0],
                instancesProcessed: Math.floor(Math.random() * 50) + 20,
                averageTime       : Math.random() * 8 + 2,
                wasteAmount       : Math.floor(Math.random() * 10),
                efficiency        : Math.random() * 20 + 80
            });
        }

        return data;
    }

    private getMockRecentActivity(): any[] {
        return [
            {
                id         : '1',
                type       : 'instance_completed',
                description: 'Instancia "Proceso de Calidad Lote A-2025" completada exitosamente',
                timestamp  : new Date(Date.now() - 1000 * 60 * 15),
                status     : 'COMPLETED'
            },
            {
                id         : '2',
                type       : 'instance_created',
                description: 'Nueva instancia "Control de Inventario B-2025" iniciada',
                timestamp  : new Date(Date.now() - 1000 * 60 * 45),
                status     : 'ACTIVE'
            },
            {
                id         : '3',
                type       : 'step_completed',
                description: 'Paso "Verificación de Calidad" completado en instancia #1234',
                timestamp  : new Date(Date.now() - 1000 * 60 * 90),
                status     : 'COMPLETED'
            },
            {
                id         : '4',
                type       : 'instance_cancelled',
                description: 'Instancia "Proceso Defectuoso C-2025" cancelada por el usuario',
                timestamp  : new Date(Date.now() - 1000 * 60 * 120),
                status     : 'CANCELLED'
            }
        ];
    }
}
