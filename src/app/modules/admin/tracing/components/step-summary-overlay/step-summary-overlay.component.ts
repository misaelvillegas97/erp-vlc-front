import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule }                                       from '@angular/common';
import { Router }                                             from '@angular/router';
import { MatButtonModule }                                    from '@angular/material/button';
import { MatIconModule }                                      from '@angular/material/icon';
import { MatCardModule }                                      from '@angular/material/card';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA }     from '@angular/material/dialog';
import { MatDividerModule }                                   from '@angular/material/divider';
import { MatChipsModule }                                     from '@angular/material/chips';

import { StepType } from '../../models/enums';

interface StepSummaryData {
    nodeId: string;
    stepId?: string;
    name: string;
    stepType: StepType;
    description?: string;
    hasFields?: boolean;
    fieldsCount?: number;
    versionId: string;
    isNew?: boolean;
}

@Component({
    selector       : 'app-step-summary-overlay',
    standalone     : true,
    imports        : [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        MatDividerModule,
        MatChipsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="step-summary-overlay p-6 max-w-md">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <mat-icon [class]="getStepTypeIconClass(data.stepType)" class="text-2xl">
                        {{ getStepTypeIcon(data.stepType) }}
                    </mat-icon>
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900">{{ data.name }}</h2>
                        <span class="text-sm text-gray-600">{{ getStepTypeLabel(data.stepType) }}</span>
                    </div>
                </div>

                <button mat-icon-button (click)="closeOverlay()" class="text-gray-400 hover:text-gray-600">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <!-- Status Chips -->
            <div class="flex flex-wrap gap-2 mb-4">
                @if (data.isNew) {
                    <mat-chip class="bg-blue-100 text-blue-800">Nuevo</mat-chip>
                }
                @if (!data.isNew && data.hasFields) {
                    <mat-chip class="bg-green-100 text-green-800">Configurado</mat-chip>
                }
                @if (!data.isNew && !data.hasFields) {
                    <mat-chip class="bg-orange-100 text-orange-800">Pendiente</mat-chip>
                }
            </div>

            <mat-divider class="mb-4"></mat-divider>

            <!-- Step Information -->
            <div class="space-y-3 mb-6">
                @if (data.description) {
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                        <p class="text-sm text-gray-600">{{ data.description }}</p>
                    </div>
                } @else {
                    <div class="text-center py-4 text-gray-500">
                        <mat-icon class="text-4xl mb-2 opacity-50">description</mat-icon>
                        <p class="text-sm">No hay descripción disponible</p>
                    </div>
                }

                @if (!data.isNew) {
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="font-medium text-gray-700">Campos:</span>
                                <span class="ml-1 text-gray-600">{{ data.fieldsCount || 0 }}</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700">Estado:</span>
                                <span class="ml-1" [class]="data.hasFields ? 'text-green-600' : 'text-orange-600'">
                  {{ data.hasFields ? 'Listo' : 'Pendiente' }}
                </span>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
                <button mat-button (click)="closeOverlay()" class="text-gray-600">
                    Cerrar
                </button>

                <button
                    mat-raised-button
                    color="primary"
                    (click)="editStep()"
                    class="flex items-center space-x-2">
                    <span>{{ data.isNew ? 'Configurar' : 'Editar' }}</span>
                    <mat-icon>arrow_forward</mat-icon>
                </button>
            </div>
        </div>
    `,
    styles         : [ `
        .step-summary-overlay {
            min-width: 320px;
            max-width: 500px;
        }

        @media (max-width: 640px) {
            .step-summary-overlay {
                min-width: 280px;
                padding: 1rem;
            }
        }

        mat-chip {
            font-size: 0.75rem;
            height: 24px;
        }

        .bg-blue-100 {
            background-color: #dbeafe;
        }

        .text-blue-800 {
            color: #1e40af;
        }

        .bg-green-100 {
            background-color: #dcfce7;
        }

        .text-green-800 {
            color: #166534;
        }

        .bg-orange-100 {
            background-color: #fed7aa;
        }

        .text-orange-800 {
            color: #9a3412;
        }

        .text-green-600 {
            color: #16a34a;
        }

        .text-orange-600 {
            color: #ea580c;
        }
    ` ]
})
export class StepSummaryOverlayComponent {
    private readonly router = inject(Router);
    private readonly dialogRef = inject(MatDialogRef<StepSummaryOverlayComponent>);
    public readonly data: StepSummaryData = inject(MAT_DIALOG_DATA);

    getStepTypeIcon(type: StepType): string {
        switch (type) {
            case StepType.STANDARD:
                return 'radio_button_unchecked';
            case StepType.GATE:
                return 'alt_route';
            case StepType.END:
                return 'stop_circle';
            default:
                return 'help';
        }
    }

    getStepTypeIconClass(type: StepType): string {
        switch (type) {
            case StepType.STANDARD:
                return 'text-blue-600';
            case StepType.GATE:
                return 'text-orange-600';
            case StepType.END:
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    }

    getStepTypeLabel(type: StepType): string {
        switch (type) {
            case StepType.STANDARD:
                return 'Paso Estándar';
            case StepType.GATE:
                return 'Puerta de Decisión';
            case StepType.END:
                return 'Paso Final';
            default:
                return 'Paso Desconocido';
        }
    }

    closeOverlay(): void {
        this.dialogRef.close();
    }

    editStep(): void {
        const stepId = this.data.stepId || 'new';
        const versionId = this.data.versionId;

        // Navigate to step editor
        this.router.navigate([ '/tracing/builder/version', versionId, 'step', stepId ], {
            queryParams: {
                nodeId  : this.data.nodeId,
                stepType: this.data.stepType
            }
        });

        // Close the overlay
        this.closeOverlay();
    }
}
