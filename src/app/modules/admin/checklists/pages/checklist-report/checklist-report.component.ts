import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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

import { ChecklistService }            from '../../services/checklist.service';
import { NewChecklistExecutionReport } from '../../domain/interfaces/checklist-execution.interface';
import { NotyfService }                from '@shared/services/notyf.service';
import { PageHeaderComponent }         from '@layout/components/page-header/page-header.component';

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
        MatBadgeModule,
        PageHeaderComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './checklist-report.component.html',
    styleUrl       : './checklist-report.component.scss',
})
export class ChecklistReportComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly checklistService = inject(ChecklistService);
    private readonly notyf = inject(NotyfService);

    // State
    reportData = signal<NewChecklistExecutionReport | null>(null);
    loading = signal<boolean>(true);
    executionId = signal<string>('');

    // Computed properties
    pageTitle = computed(() => {
        const report = this.reportData();
        if (report?.templateName) {
            return `Reporte: ${ report.templateName }`;
        }
        return 'Reporte de Ejecución';
    });

    pageSubtitle = computed(() => {
        const report = this.reportData();
        if (report) {
            return `Ejecutado el ${ this.formatDate(report.completedAt) } por ${ report.executorUserName }`;
        }
        return '';
    });

    totalQuestionsCount = computed(() => {
        const report = this.reportData();
        if (!report?.categories) return 0;
        return report.categories.reduce((total, category) => total + category.questions.length, 0);
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
    formatDate(date: string | Date | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-ES', {
            year : 'numeric',
            month: 'long',
            day  : 'numeric'
        });
    }

    formatTime(date: string | Date | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('es-ES', {
            hour  : '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime(date: string | Date): string {
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
        if (!report?.completedAt) {
            return 'N/A';
        }

        // Since we don't have startedAt in the new model, we'll calculate based on answers
        const allAnswers = report.categories.flatMap(cat => cat.questions.map(q => q.answer));
        const earliestAnswer = allAnswers.reduce((earliest, answer) => {
            const answerTime = new Date(answer.answeredAt);
            const earliestTime = new Date(earliest.answeredAt);
            return answerTime < earliestTime ? answer : earliest;
        });

        if (!earliestAnswer) {
            return 'N/A';
        }

        const start = new Date(earliestAnswer.answeredAt);
        const end = new Date(report.completedAt);
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
        const category = report?.categories.find(cat => cat.id === categoryId);
        return category?.title || 'Categoría';
    }

    getQuestionTitle(questionId: string): string {
        const report = this.reportData();
        for (const category of report?.categories || []) {
            const question = category.questions.find(q => q.id === questionId);
            if (question) {
                return question.title;
            }
        }
        return `Pregunta ${ questionId }`;
    }

    getQuestionDescription(questionId: string): string {
        const report = this.reportData();
        for (const category of report?.categories || []) {
            const question = category.questions.find(q => q.id === questionId);
            if (question) {
                return question.description || '';
            }
        }
        return '';
    }

    getResponseComment(questionId: string): string {
        const report = this.reportData();
        for (const category of report?.categories || []) {
            const question = category.questions.find(q => q.id === questionId);
            if (question) {
                return question.answer.comment || '';
            }
        }
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
