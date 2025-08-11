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
import { MatTableModule }                                             from '@angular/material/table';
import { MatSortModule }                                              from '@angular/material/sort';
import { MatSnackBarModule, MatSnackBar }                             from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                   from '@angular/material/progress-spinner';
import { MatTooltipModule }                                           from '@angular/material/tooltip';
import { MatChipsModule }                                             from '@angular/material/chips';
import { MatTabsModule }                                              from '@angular/material/tabs';
import { catchError, debounceTime, distinctUntilChanged }             from 'rxjs/operators';
import { of }                                                         from 'rxjs';

import { TracingApiService } from '../../../services/tracing-api.service';
import { FlowTemplate }      from '../../../models/entities';

interface WasteData {
    stepName: string;
    templateName: string;
    totalQuantity: number;
    totalCost: number;
    instanceCount: number;
    averageWastePerInstance: number;
    mainReasons: string[];
    trend: 'up' | 'down' | 'stable';
}

interface WasteSummary {
    totalWasteRecords: number;
    totalCostImpact: number;
    averageWastePerInstance: number;
    topWasteReason: string;
    wasteReductionOpportunity: number;
}

@Component({
    selector       : 'app-waste-reports',
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
        MatTableModule,
        MatSortModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatChipsModule,
        MatTabsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="waste-reports-container p-4 sm:p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Reportes de Desperdicios</h1>
          <p class="text-gray-600 mt-1">Análisis de mermas y oportunidades de mejora en eficiencia</p>
        </div>
        
        <div class="flex items-center space-x-2">
          <button mat-raised-button color="primary" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          
          <button mat-button (click)="exportData()">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
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
          <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      @if (!isLoading()) {
        <!-- Summary Cards -->
        @if (wasteSummary()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Total Waste Records -->
            <mat-card class="summary-card">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Total Registros</p>
                    <p class="text-3xl font-bold text-red-600">{{ wasteSummary()!.totalWasteRecords | number }}</p>
                  </div>
                  <div class="p-3 bg-red-100 rounded-full">
                    <mat-icon class="text-red-600">warning</mat-icon>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Total Cost Impact -->
            <mat-card class="summary-card">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Impacto Total</p>
                    <p class="text-3xl font-bold text-orange-600">{{ formatCurrency(wasteSummary()!.totalCostImpact) }}</p>
                  </div>
                  <div class="p-3 bg-orange-100 rounded-full">
                    <mat-icon class="text-orange-600">attach_money</mat-icon>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Average Waste -->
            <mat-card class="summary-card">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Promedio por Instancia</p>
                    <p class="text-3xl font-bold text-yellow-600">{{ wasteSummary()!.averageWastePerInstance | number:'1.1-1' }}</p>
                  </div>
                  <div class="p-3 bg-yellow-100 rounded-full">
                    <mat-icon class="text-yellow-600">trending_up</mat-icon>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Reduction Opportunity -->
            <mat-card class="summary-card">
              <mat-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600">Oportunidad de Mejora</p>
                    <p class="text-3xl font-bold text-green-600">{{ formatCurrency(wasteSummary()!.wasteReductionOpportunity) }}</p>
                  </div>
                  <div class="p-3 bg-green-100 rounded-full">
                    <mat-icon class="text-green-600">savings</mat-icon>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        }

        <!-- Detailed Waste Analysis -->
        <mat-card class="waste-analysis-card">
          <mat-card-header>
            <mat-card-title class="flex items-center space-x-2">
              <mat-icon>analytics</mat-icon>
              <span>Análisis Detallado por Paso</span>
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content class="p-0">
            @if (wasteData().length > 0) {
              <table mat-table [dataSource]="wasteData()" class="w-full">
                <ng-container matColumnDef="stepName">
                  <th mat-header-cell *matHeaderCellDef>Paso</th>
                  <td mat-cell *matCellDef="let element">{{ element.stepName }}</td>
                </ng-container>

                <ng-container matColumnDef="templateName">
                  <th mat-header-cell *matHeaderCellDef>Plantilla</th>
                  <td mat-cell *matCellDef="let element">{{ element.templateName }}</td>
                </ng-container>

                <ng-container matColumnDef="totalQuantity">
                  <th mat-header-cell *matHeaderCellDef>Cantidad Total</th>
                  <td mat-cell *matCellDef="let element">{{ element.totalQuantity | number:'1.1-1' }}</td>
                </ng-container>

                <ng-container matColumnDef="totalCost">
                  <th mat-header-cell *matHeaderCellDef>Costo Total</th>
                  <td mat-cell *matCellDef="let element">{{ formatCurrency(element.totalCost) }}</td>
                </ng-container>

                <ng-container matColumnDef="instanceCount">
                  <th mat-header-cell *matHeaderCellDef>Instancias</th>
                  <td mat-cell *matCellDef="let element">{{ element.instanceCount }}</td>
                </ng-container>

                <ng-container matColumnDef="averageWastePerInstance">
                  <th mat-header-cell *matHeaderCellDef>Promedio/Instancia</th>
                  <td mat-cell *matCellDef="let element">{{ element.averageWastePerInstance | number:'1.1-1' }}</td>
                </ng-container>

                <ng-container matColumnDef="mainReasons">
                  <th mat-header-cell *matHeaderCellDef>Principales Motivos</th>
                  <td mat-cell *matCellDef="let element">
                    <div class="flex flex-wrap gap-1">
                      @for (reason of element.mainReasons.slice(0, 2); track reason) {
                        <mat-chip class="text-xs bg-gray-100 text-gray-800">{{ reason }}</mat-chip>
                      }
                      @if (element.mainReasons.length > 2) {
                        <mat-chip class="text-xs bg-blue-100 text-blue-800">+{{ element.mainReasons.length - 2 }}</mat-chip>
                      }
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="trend">
                  <th mat-header-cell *matHeaderCellDef>Tendencia</th>
                  <td mat-cell *matCellDef="let element">
                    <mat-icon [class]="getTrendClass(element.trend)">{{ getTrendIcon(element.trend) }}</mat-icon>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            } @else {
              <div class="flex flex-col items-center justify-center py-12">
                <mat-icon class="text-gray-400 text-6xl mb-4">info</mat-icon>
                <p class="text-gray-600">No se encontraron datos de desperdicios para el período seleccionado</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
    styles         : [ `
    .waste-reports-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .filters-card {
      border-left: 4px solid #f59e0b;
    }

    .summary-card {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .waste-analysis-card {
      border-left: 4px solid #ef4444;
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  ` ]
})
export class WasteReportsComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    private readonly fb = inject(FormBuilder);
    private readonly snackBar = inject(MatSnackBar);

    // State
    public readonly wasteData = signal<WasteData[]>([]);
    public readonly wasteSummary = signal<WasteSummary | null>(null);
    public readonly availableTemplates = signal<FlowTemplate[]>([]);
    public readonly isLoading = signal(false);

    // Form
    public filtersForm: FormGroup;
    public displayedColumns = [ 'stepName', 'templateName', 'totalQuantity', 'totalCost', 'instanceCount', 'averageWastePerInstance', 'mainReasons', 'trend' ];

    constructor() {
        this.filtersForm = this.fb.group({
            startDate : [ new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ], // 30 days ago
            endDate   : [ new Date() ],
            templateId: [ '' ]
        });
    }

    ngOnInit(): void {
        this.loadTemplates();
        this.loadWasteData();
        this.setupFiltersSubscription();
    }

    private setupFiltersSubscription(): void {
        this.filtersForm.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.loadWasteData();
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

    public loadWasteData(): void {
        this.isLoading.set(true);

        this.api.getWasteAnalysisReport().pipe(
            catchError(error => {
                console.error('Error loading waste data:', error);
                this.snackBar.open('Error al cargar datos de desperdicios', 'Cerrar', {duration: 5000});
                return of({wasteData: this.getMockWasteData(), summary: this.getMockSummary()});
            })
        ).subscribe(data => {
            this.wasteData.set(data.wasteData || this.getMockWasteData());
            this.wasteSummary.set(data.summary || this.getMockSummary());
            this.isLoading.set(false);
        });
    }

    public refreshData(): void {
        this.loadWasteData();
        this.snackBar.open('Datos actualizados', 'Cerrar', {duration: 2000});
    }

    public exportData(): void {
        const exportData = {
            summary     : this.wasteSummary(),
            detailedData: this.wasteData(),
            filters     : this.filtersForm.value,
            exportedAt  : new Date().toISOString()
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([ jsonContent ], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `waste-report-${ new Date().toISOString().split('T')[0] }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Reporte de desperdicios exportado', 'Cerrar', {duration: 3000});
    }

    // Helper methods
    public formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CL', {
            style                : 'currency',
            currency             : 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    public getTrendIcon(trend: string): string {
        switch (trend) {
            case 'up':
                return 'trending_up';
            case 'down':
                return 'trending_down';
            case 'stable':
                return 'trending_flat';
            default:
                return 'help';
        }
    }

    public getTrendClass(trend: string): string {
        switch (trend) {
            case 'up':
                return 'text-red-600';
            case 'down':
                return 'text-green-600';
            case 'stable':
                return 'text-gray-600';
            default:
                return 'text-gray-400';
        }
    }

    // Mock data methods
    private getMockWasteData(): WasteData[] {
        return [
            {
                stepName               : 'Control de Calidad',
                templateName           : 'Proceso de Producción A',
                totalQuantity          : 245.8,
                totalCost              : 89420,
                instanceCount          : 156,
                averageWastePerInstance: 1.58,
                mainReasons            : [ 'Defecto de fabricación', 'Error humano', 'Falla de equipo' ],
                trend                  : 'up'
            },
            {
                stepName               : 'Empaque Final',
                templateName           : 'Proceso de Empaque',
                totalQuantity          : 189.3,
                totalCost              : 45230,
                instanceCount          : 203,
                averageWastePerInstance: 0.93,
                mainReasons            : [ 'Material defectuoso', 'Configuración incorrecta' ],
                trend                  : 'down'
            },
            {
                stepName               : 'Verificación de Inventario',
                templateName           : 'Control de Inventario',
                totalQuantity          : 67.2,
                totalCost              : 12890,
                instanceCount          : 89,
                averageWastePerInstance: 0.76,
                mainReasons            : [ 'Discrepancia de conteo', 'Producto vencido' ],
                trend                  : 'stable'
            }
        ];
    }

    private getMockSummary(): WasteSummary {
        return {
            totalWasteRecords        : 448,
            totalCostImpact          : 147540,
            averageWastePerInstance  : 1.09,
            topWasteReason           : 'Defecto de fabricación',
            wasteReductionOpportunity: 52340
        };
    }
}
