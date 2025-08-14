import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule }                            from '@angular/material/button';
import { MatIconModule }                              from '@angular/material/icon';
import { StepType }                                   from '../../../../models/enums';

export interface ToolboxItemClickEvent {
    nodeType: string;
    nodeName: string;
}

@Component({
    selector       : 'app-flow-canvas-toolbox',
    standalone     : true,
    imports        : [
        MatButtonModule,
        MatIconModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="floating-toolbox absolute top-4 left-4 bg-card border rounded-lg shadow-lg p-4 z-10">
            <h4 class="font-medium text-gray-800 mb-3 text-sm">Componentes</h4>

            <!-- Node Type Buttons -->
            <div class="space-y-2">
                <button
                    class="toolbox-item w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2 text-left transition-colors"
                    (click)="onItemClick('STANDARD', 'Paso Estándar')">
                    <mat-icon class="text-blue-600 text-sm" svgIcon="mat_solid:radio_button_unchecked"></mat-icon>
                    <span class="text-sm">Paso Estándar</span>
                </button>

                <button
                    class="toolbox-item w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2 text-left transition-colors"
                    (click)="onItemClick('GATE', 'Puerta de Decisión')">
                    <mat-icon class="text-orange-600 text-sm" svgIcon="mat_solid:alt_route"></mat-icon>
                    <span class="text-sm">Puerta de Decisión</span>
                </button>

                <button
                    class="toolbox-item w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2 text-left transition-colors"
                    (click)="onItemClick('END', 'Paso Final')">
                    <mat-icon class="text-red-600 text-sm" svgIcon="mat_solid:stop_circle"></mat-icon>
                    <span class="text-sm">Paso Final</span>
                </button>
            </div>

            <div class="mt-6 pt-3 border-t">
                <!-- Fit to screen -->
                <button
                    class="toolbox-item w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2 text-left transition-colors"
                    (click)="onFitToScreenClick()">
                    <mat-icon svgIcon="mat_solid:fit_screen"></mat-icon>
                    <span class="text-sm">Ajustar a Pantalla</span>
                </button>
            </div>
        </div>
    `,
    styles         : [ `
        .toolbox-item {
            transition: all 0.2s ease;
        }

        .toolbox-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
            .floating-toolbox {
                width: 200px;
            }
        }
    ` ]
})
export class FlowCanvasToolboxComponent {
    // Output events
    public readonly itemClick = output<ToolboxItemClickEvent>();
    public readonly fitToScreenClick = output<void>();

    // Expose StepType enum to template
    public readonly StepType = StepType;

    onItemClick(nodeType: string, nodeName: string): void {
        this.itemClick.emit({nodeType, nodeName});
    }

    onFitToScreenClick(): void {
        this.fitToScreenClick.emit();
    }
}
