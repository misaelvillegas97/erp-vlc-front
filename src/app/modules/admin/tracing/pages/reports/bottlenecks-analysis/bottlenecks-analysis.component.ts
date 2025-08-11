import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                                               from '@angular/common';
import { RouterModule }                                               from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup }                from '@angular/forms';
import { MatButtonModule }                                            from '@angular/material/button';
import { MatCardModule }                                              from '@angular/material/card';
import { MatFormFieldModule }                                         from '@angular/material/form-field';
import { MatSelectModule }                                            from '@angular/material/select';
import { MatIconModule }                                              from '@angular/material/icon';
import { MatTableModule }                                             from '@angular/material/table';
import { MatSortModule }                                              from '@angular/material/sort';
import { MatSnackBarModule, MatSnackBar }                             from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                   from '@angular/material/progress-spinner';
import { MatTooltipModule }                                           from '@angular/material/tooltip';
import { MatChipsModule }                                             from '@angular/material/chips';
import { catchError }                                                 from 'rxjs/operators';
import { of }                                                         from 'rxjs';

import { TracingApiService } from '../../../services/tracing-api.service';

interface BottleneckData {
    stepName: string;
    templateName: string;
    averageDuration: number;
    instanceCount: number;
    impactScore: number;
    efficiency: number;
}

@Component({
    selector       : 'app-bottlenecks-analysis',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatTableModule,
        MatSortModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatChipsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="bottlenecks-container p-4 sm:p-6">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Análisis de Cuellos de Botella</h1>
                    <p class="text-gray-600 mt-1">Identificación de pasos más lentos y oportunidades de mejora</p>
                </div>

                <button mat-raised-button color="primary" (click)="refreshData()">
                    <mat-icon>refresh</mat-icon>
                    Actualizar
                </button>
            </div>

            <!-- Filters -->
            <mat-card class="mb-6">
                <mat-card-content class="p-6">
                    <form [formGroup]="filtersForm" class="flex gap-4">
                        <mat-form-field>
                            <mat-label>Top N</mat-label>
                            <mat-select formControlName="topN">
                                <mat-option value="5">Top 5</mat-option>
                                <mat-option value="10">Top 10</mat-option>
                                <mat-option value="20">Top 20</mat-option>
                            </mat-select>
                        </mat-form-field>
                    </form>
                </mat-card-content>
            </mat-card>

            @if (isLoading()) {
                <div class="flex justify-center py-12">
                    <mat-spinner></mat-spinner>
                </div>
            }

            @if (!isLoading() && bottlenecks().length > 0) {
                <mat-card>
                    <mat-card-content class="p-0">
                        <table mat-table [dataSource]="bottlenecks()" class="w-full">
                            <ng-container matColumnDef="stepName">
                                <th mat-header-cell *matHeaderCellDef>Paso</th>
                                <td mat-cell *matCellDef="let element">{{ element.stepName }}</td>
                            </ng-container>

                            <ng-container matColumnDef="templateName">
                                <th mat-header-cell *matHeaderCellDef>Plantilla</th>
                                <td mat-cell *matCellDef="let element">{{ element.templateName }}</td>
                            </ng-container>

                            <ng-container matColumnDef="averageDuration">
                                <th mat-header-cell *matHeaderCellDef>Duración Promedio</th>
                                <td mat-cell *matCellDef="let element">{{ formatDuration(element.averageDuration) }}</td>
                            </ng-container>

                            <ng-container matColumnDef="instanceCount">
                                <th mat-header-cell *matHeaderCellDef>Instancias</th>
                                <td mat-cell *matCellDef="let element">{{ element.instanceCount }}</td>
                            </ng-container>

                            <ng-container matColumnDef="impactScore">
                                <th mat-header-cell *matHeaderCellDef>Impacto</th>
                                <td mat-cell *matCellDef="let element">
                                    <mat-chip [class]="getImpactClass(element.impactScore)">
                                        {{ element.impactScore.toFixed(1) }}
                                    </mat-chip>
                                </td>
                            </ng-container>

                            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                        </table>
                    </mat-card-content>
                </mat-card>
            }
        </div>
    `,
    styles         : [ `
    .bottlenecks-container {
      max-width: 1200px;
      margin: 0 auto;
    }
  ` ]
})
export class BottlenecksAnalysisComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    private readonly fb = inject(FormBuilder);
    private readonly snackBar = inject(MatSnackBar);

    public readonly bottlenecks = signal<BottleneckData[]>([]);
    public readonly isLoading = signal(false);
    public filtersForm: FormGroup;
    public displayedColumns = [ 'stepName', 'templateName', 'averageDuration', 'instanceCount', 'impactScore' ];

    constructor() {
        this.filtersForm = this.fb.group({
            topN: [ 10 ]
        });
    }

    ngOnInit(): void {
        this.loadBottlenecks();
    }

    public loadBottlenecks(): void {
        this.isLoading.set(true);
        const topN = this.filtersForm.value.topN;

        this.api.getBottlenecksReport(topN).pipe(
            catchError(error => {
                console.error('Error loading bottlenecks:', error);
                this.snackBar.open('Error al cargar análisis de cuellos de botella', 'Cerrar', {duration: 5000});
                return of(this.getMockData());
            })
        ).subscribe(data => {
            this.bottlenecks.set(data || this.getMockData());
            this.isLoading.set(false);
        });
    }

    public refreshData(): void {
        this.loadBottlenecks();
    }

    public formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${ minutes.toFixed(1) }m`;
        }
        const hours = minutes / 60;
        return `${ hours.toFixed(1) }h`;
    }

    public getImpactClass(score: number): string {
        if (score >= 8) return 'bg-red-100 text-red-800';
        if (score >= 6) return 'bg-orange-100 text-orange-800';
        if (score >= 4) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    }

    private getMockData(): BottleneckData[] {
        return [
            {
                stepName       : 'Verificación de Calidad',
                templateName   : 'Proceso de Producción A',
                averageDuration: 145.5,
                instanceCount  : 89,
                impactScore    : 8.7,
                efficiency     : 65.2
            },
            {
                stepName       : 'Aprobación Supervisor',
                templateName   : 'Control de Inventario',
                averageDuration: 98.3,
                instanceCount  : 156,
                impactScore    : 7.9,
                efficiency     : 71.8
            }
        ];
    }
}
