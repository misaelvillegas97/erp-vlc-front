import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { ActivatedRoute, Router, RouterModule }                                 from '@angular/router';

// Angular Material
import { MatCardModule }        from '@angular/material/card';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatChipsModule }       from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule }     from '@angular/material/divider';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { MatMenuModule }        from '@angular/material/menu';
import { MatBadgeModule }       from '@angular/material/badge';

import { ChecklistService }         from '../../services/checklist.service';
import { ChecklistExecutionReport } from '../../domain/interfaces/checklist-execution.interface';
import { ChecklistCategoryScore }   from '../../domain/interfaces/checklist-category.interface';
import { NotyfService }             from '@shared/services/notyf.service';

@Component({
    selector       : 'app-checklist-report',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressBarModule,
        MatDividerModule,
        MatTooltipModule,
        MatMenuModule,
        MatBadgeModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles         : [ `
    .progress-bar-success ::ng-deep .mat-progress-bar-fill::after {
      background-color: #10b981;
    }
    .progress-bar-warning ::ng-deep .mat-progress-bar-fill::after {
      background-color: #f59e0b;
    }
    .progress-bar-danger ::ng-deep .mat-progress-bar-fill::after {
      background-color: #ef4444;
    }
    .compliance-chip-success {
      background-color: #dcfce7 !important;
      color: #166534 !important;
    }
    .compliance-chip-danger {
      background-color: #fef2f2 !important;
      color: #dc2626 !important;
    }
  ` ],
    template       : `
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Custom Header with Back Button -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button 
              mat-icon-button 
              (click)="goBack()"
              matTooltip="Volver"
            >
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle() }}</h1>
              <p class="text-gray-600 mt-1">{{ pageSubtitle() }}</p>
            </div>
          </div>
          
          <!-- Export Actions -->
          <div class="flex gap-2">
            <button 
              mat-button 
              [matMenuTriggerFor]="exportMenu"
              [disabled]="loading()"
            >
              <mat-icon>download</mat-icon>
              Exportar
            </button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportToPDF()">
                <mat-icon>picture_as_pdf</mat-icon>
                <span>Exportar PDF</span>
              </button>
              <button mat-menu-item (click)="exportToCSV()">
                <mat-icon>table_chart</mat-icon>
                <span>Exportar CSV</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </div>

      @if (loading()) {
        <!-- Loading State -->
        <mat-card class="p-8 text-center">
          <mat-icon class="text-4xl text-gray-400 mb-4">hourglass_empty</mat-icon>
          <p class="text-gray-600">Cargando reporte de ejecución...</p>
        </mat-card>
      } @else if (reportData()) {
        <!-- Report Content -->
        <div class="space-y-6">
          <!-- Execution Summary -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>assessment</mat-icon>
                Resumen de Ejecución
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <!-- Metadata Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Ejecutado por</div>
                  <div class="font-medium">{{ reportData()?.userDetails.name }}</div>
                  @if (reportData()?.userDetails.role) {
                    <div class="text-xs text-gray-500">{{ reportData()?.userDetails.role }}</div>
                  }
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Vehículo</div>
                  <div class="font-medium">{{ reportData()?.vehicleDetails.plate }}</div>
                  @if (reportData()?.vehicleDetails.model) {
                    <div class="text-xs text-gray-500">
                      {{ reportData()?.vehicleDetails.model }} 
                      @if (reportData()?.vehicleDetails.year) {
                        ({{ reportData()?.vehicleDetails.year }})
                      }
                    </div>
                  }
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Fecha de Ejecución</div>
                  <div class="font-medium">{{ formatDate(reportData()?.execution.completedAt) }}</div>
                  <div class="text-xs text-gray-500">
                    {{ formatTime(reportData()?.execution.completedAt) }}
                  </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Tipo</div>
                  <div class="font-medium">
                    @if (reportData()?.templateDetails) {
                      {{ reportData()?.templateDetails.type }}
                    } @else if (reportData()?.groupDetails) {
                      Grupo
                    }
                  </div>
                  @if (reportData()?.templateDetails?.version) {
                    <div class="text-xs text-gray-500">v{{ reportData()?.templateDetails.version }}</div>
                  }
                </div>
              </div>

              <!-- Score Overview -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Overall Score -->
                <div class="text-center p-6 rounded-lg" [class]="getScoreCardClass(reportData()?.execution.overallScore || 0)">
                  <div class="text-3xl font-bold mb-2">
                    {{ (reportData()?.execution.overallScore * 100).toFixed(1) }}%
                  </div>
                  <div class="text-sm font-medium">Score Global</div>
                  <mat-progress-bar 
                    mode="determinate" 
                    [value]="(reportData()?.execution.overallScore || 0) * 100"
                    [class]="getProgressBarClass(reportData()?.execution.overallScore || 0)"
                    class="mt-2"
                  ></mat-progress-bar>
                </div>

                <!-- Status -->
                <div class="text-center p-6 rounded-lg" [class]="reportData()?.execution.passed ? 'bg-green-50' : 'bg-red-50'">
                  <mat-icon class="text-4xl mb-2" [class]="reportData()?.execution.passed ? 'text-green-500' : 'text-red-500'">
                    {{ reportData()?.execution.passed ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                  <div class="text-sm font-medium" [class]="reportData()?.execution.passed ? 'text-green-700' : 'text-red-700'">
                    {{ reportData()?.execution.passed ? 'Aprobado' : 'Bajo Desempeño' }}
                  </div>
                </div>

                <!-- Duration -->
                <div class="text-center p-6 bg-purple-50 rounded-lg">
                  <div class="text-3xl font-bold text-purple-600 mb-2">
                    {{ calculateDuration() }}
                  </div>
                  <div class="text-sm font-medium text-purple-700">Duración</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Category Scores -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>category</mat-icon>
                Puntuación por Categoría
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <div class="space-y-4">
                @for (categoryScore of reportData()?.categoryScores; track categoryScore.categoryId) {
                  <div class="border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                      <div>
                        <h4 class="font-medium">{{ categoryScore.title }}</h4>
                        <div class="text-sm text-gray-600">
                          {{ categoryScore.questionsCompleted }}/{{ categoryScore.totalQuestions }} preguntas completadas
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold" [class]="getScoreTextClass(categoryScore.score)">
                          {{ (categoryScore.score * 100).toFixed(1) }}%
                        </div>
                        <div class="text-xs text-gray-500">
                          Peso: {{ (categoryScore.weight * 100).toFixed(0) }}%
                        </div>
                      </div>
                    </div>
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="categoryScore.score * 100"
                      [class]="getProgressBarClass(categoryScore.score)"
                    ></mat-progress-bar>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Detailed Responses -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>quiz</mat-icon>
                Respuestas Detalladas
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <div class="space-y-6">
                @for (categoryResponse of reportData()?.execution.categoryResponses; track categoryResponse.categoryId) {
                  <div class="border rounded-lg p-4">
                    <h4 class="font-medium mb-4 flex items-center gap-2">
                      <mat-icon>folder</mat-icon>
                      {{ getCategoryTitle(categoryResponse.categoryId) }}
                    </h4>
                    
                    <div class="space-y-4">
                      @for (response of categoryResponse.responses; track response.questionId) {
                        <div class="bg-gray-50 rounded-lg p-4">
                          <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                              <h5 class="font-medium">{{ getQuestionTitle(response.questionId) }}</h5>
                              @if (getQuestionDescription(response.questionId)) {
                                <p class="text-sm text-gray-600 mt-1">
                                  {{ getQuestionDescription(response.questionId) }}
                                </p>
                              }
                            </div>
                            
                            <!-- Compliance Status -->
                            <mat-chip-set>
                              <mat-chip [class]="getComplianceChipClass(response.value)">
                                <mat-icon matChipAvatar>
                                  {{ response.value ? 'check_circle' : 'cancel' }}
                                </mat-icon>
                                {{ response.value ? 'Cumple' : 'No Cumple' }}
                              </mat-chip>
                            </mat-chip-set>
                          </div>
                          
                          <!-- Files/Evidence -->
                          @if (response.files && response.files.length > 0) {
                            <div class="mt-3">
                              <div class="text-sm font-medium text-gray-700 mb-2">Evidencia:</div>
                              <div class="flex flex-wrap gap-2">
                                @for (file of response.files; track $index) {
                                  <button 
                                    mat-stroked-button 
                                    size="small"
                                    (click)="viewEvidence(file)"
                                    class="text-xs"
                                  >
                                    <mat-icon class="mr-1">attachment</mat-icon>
                                    {{ getFileName(file) }}
                                  </button>
                                }
                              </div>
                            </div>
                          }
                          
                          <!-- Comments -->
                          @if (getResponseComment(response.questionId)) {
                            <div class="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-200">
                              <div class="text-sm font-medium text-blue-800 mb-1">Comentario:</div>
                              <div class="text-sm text-blue-700">
                                {{ getResponseComment(response.questionId) }}
                              </div>
                            </div>
                          }
                          
                          <div class="text-xs text-gray-500 mt-2">
                            Respondido: {{ formatDateTime(response.timestamp) }}
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Notes and Recommendations -->
          @if (reportData()?.execution.notes || reportData()?.recommendations?.length) {
            <mat-card>
              <mat-card-header>
                <mat-card-title class="flex items-center gap-2">
                  <mat-icon>note</mat-icon>
                  Observaciones y Recomendaciones
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                @if (reportData()?.execution.notes) {
                  <div class="mb-4">
                    <h4 class="font-medium mb-2">Notas de Ejecución:</h4>
                    <div class="p-3 bg-gray-50 rounded-lg">
                      {{ reportData()?.execution.notes }}
                    </div>
                  </div>
                }
                
                @if (reportData()?.recommendations?.length) {
                  <div>
                    <h4 class="font-medium mb-2">Recomendaciones:</h4>
                    <ul class="space-y-2">
                      @for (recommendation of reportData()?.recommendations; track $index) {
                        <li class="flex items-start gap-2">
                          <mat-icon class="text-orange-500 mt-0.5">lightbulb</mat-icon>
                          <span class="text-sm">{{ recommendation }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else {
        <!-- Error State -->
        <mat-card class="p-8 text-center">
          <mat-icon class="text-4xl text-red-400 mb-4">error</mat-icon>
          <p class="text-gray-600 mb-4">No se pudo cargar el reporte de ejecución</p>
          <button mat-raised-button color="primary" (click)="loadReport()">
            Reintentar
          </button>
        </mat-card>
      }
    </div>
  `
})
export class ChecklistReportComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly checklistService = inject(ChecklistService);
    private readonly notyf = inject(NotyfService);

    // State
    reportData = signal<ChecklistExecutionReport | null>(null);
    loading = signal<boolean>(true);
    executionId = signal<string>('');

    // Computed properties
    pageTitle = computed(() => {
        const report = this.reportData();
        if (report?.templateDetails) {
            return `Reporte: ${ report.templateDetails.name }`;
        } else if (report?.groupDetails) {
            return `Reporte: ${ report.groupDetails.name }`;
        }
        return 'Reporte de Ejecución';
    });

    pageSubtitle = computed(() => {
        const report = this.reportData();
        if (report) {
            return `Ejecutado el ${ this.formatDate(report.execution.completedAt) } por ${ report.userDetails.name }`;
        }
        return '';
    });

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const executionId = params['executionId'];
            if (executionId) {
                this.executionId.set(executionId);
                this.loadReport();
            }
        });
    }

    loadReport(): void {
        this.loading.set(true);
        const executionId = this.executionId();

        this.checklistService.getExecutionReport(executionId).subscribe({
            next : (report) => {
                this.reportData.set(report);
                this.loading.set(false);
            },
            error: (error) => {
                this.notyf.error('Error al cargar el reporte');
                this.loading.set(false);
            }
        });
    }

    exportToPDF(): void {
        const executionId = this.executionId();
        this.checklistService.exportExecutionReport(executionId, 'pdf').subscribe({
            next : (blob) => {
                this.downloadFile(blob, `checklist-report-${ executionId }.pdf`);
                this.notyf.success('Reporte PDF descargado exitosamente');
            },
            error: (error) => {
                this.notyf.error('Error al exportar PDF');
            }
        });
    }

    exportToCSV(): void {
        const executionId = this.executionId();
        this.checklistService.exportExecutionReport(executionId, 'csv').subscribe({
            next : (blob) => {
                this.downloadFile(blob, `checklist-report-${ executionId }.csv`);
                this.notyf.success('Reporte CSV descargado exitosamente');
            },
            error: (error) => {
                this.notyf.error('Error al exportar CSV');
            }
        });
    }

    private downloadFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // Utility methods
    formatDate(date: Date | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-ES', {
            year : 'numeric',
            month: 'long',
            day  : 'numeric'
        });
    }

    formatTime(date: Date | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('es-ES', {
            hour  : '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime(date: Date): string {
        return new Date(date).toLocaleString('es-ES', {
            year  : 'numeric',
            month : 'short',
            day   : 'numeric',
            hour  : '2-digit',
            minute: '2-digit'
        });
    }

    calculateDuration(): string {
        const report = this.reportData();
        if (!report?.execution.startedAt || !report?.execution.completedAt) {
            return 'N/A';
        }

        const start = new Date(report.execution.startedAt);
        const end = new Date(report.execution.completedAt);
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.round(diffMs / (1000 * 60));

        if (diffMins < 60) {
            return `${ diffMins } min`;
        } else {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return `${ hours }h ${ mins }m`;
        }
    }

    getScoreCardClass(score: number): string {
        if (score >= 0.8) return 'bg-green-50';
        if (score >= 0.6) return 'bg-yellow-50';
        return 'bg-red-50';
    }

    getScoreTextClass(score: number): string {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    }

    getProgressBarClass(score: number): string {
        if (score >= 0.8) return 'progress-bar-success';
        if (score >= 0.6) return 'progress-bar-warning';
        return 'progress-bar-danger';
    }

    getComplianceChipClass(complies: boolean): string {
        return complies ? 'compliance-chip-success' : 'compliance-chip-danger';
    }

    getCategoryTitle(categoryId: string): string {
        const report = this.reportData();
        const categoryScore = report?.categoryScores.find(cs => cs.categoryId === categoryId);
        return categoryScore?.title || 'Categoría';
    }

    getQuestionTitle(questionId: string): string {
        // This would need to be implemented based on your data structure
        // For now, return a placeholder
        return `Pregunta ${ questionId }`;
    }

    getQuestionDescription(questionId: string): string {
        // This would need to be implemented based on your data structure
        return '';
    }

    getResponseComment(questionId: string): string {
        // This would need to be implemented based on your data structure
        return '';
    }

    getFileName(file: any): string {
        if (typeof file === 'string') {
            return file.split('/').pop() || 'archivo';
        }
        return file?.name || 'archivo';
    }

    viewEvidence(file: any): void {
        // Implementation for viewing evidence files
        if (typeof file === 'string') {
            window.open(file, '_blank');
        }
    }

    goBack(): void {
        this.router.navigate([ '/admin/checklists' ]);
    }
}
