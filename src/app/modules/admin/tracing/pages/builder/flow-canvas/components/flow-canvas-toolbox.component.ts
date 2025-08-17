import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
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
        MatIconModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <!-- Mobile: toggle button fixed bottom center -->
        <div class="md:hidden fixed inset-x-0 bottom-4 z-20 flex justify-center">
            <button
                type="button"
                class="px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg ring-1 ring-black/5 flex items-center gap-2 active:scale-[0.98] transition"
                aria-controls="flow-toolbox-sheet"
                [attr.aria-expanded]="isOpen()"
                (click)="toggleOpen()">
                <mat-icon svgIcon="mat_solid:menu"></mat-icon>
                <span class="text-sm font-medium">Componentes</span>
            </button>
        </div>

        <!-- Mobile: bottom sheet -->
        <div
            id="flow-toolbox-sheet"
            class="md:hidden fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-x bg-card shadow-2xl"
            [class.hidden]="!isOpen()">
            <div class="p-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-gray-800 text-sm">Componentes</h4>
                    <button type="button" class="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition" (click)="close()" aria-label="Cerrar">
                        <mat-icon svgIcon="mat_solid:close"></mat-icon>
                    </button>
                </div>

                <!-- Node Type Buttons -->
                <div class="space-y-2">
                    <button
                        type="button"
                        class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                        (click)="onItemClick('STANDARD', 'Paso Estándar')">
                        <mat-icon class="text-blue-600 text-sm" svgIcon="mat_solid:radio_button_unchecked"></mat-icon>
                        <span class="text-sm">Paso Estándar</span>
                    </button>

                    <button
                        type="button"
                        class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                        (click)="onItemClick('GATE', 'Puerta de Decisión')">
                        <mat-icon class="text-orange-600 text-sm" svgIcon="mat_solid:alt_route"></mat-icon>
                        <span class="text-sm">Puerta de Decisión</span>
                    </button>

                    <button
                        type="button"
                        class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                        (click)="onItemClick('END', 'Paso Final')">
                        <mat-icon class="text-red-600 text-sm" svgIcon="mat_solid:stop_circle"></mat-icon>
                        <span class="text-sm">Paso Final</span>
                    </button>
                </div>

                <div class="mt-4 pt-3 border-t">
                    <!-- Fit to screen -->
                    <button
                        type="button"
                        class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                        (click)="onFitToScreenClick()">
                        <mat-icon svgIcon="mat_solid:fit_screen"></mat-icon>
                        <span class="text-sm">Ajustar a Pantalla</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Desktop: floating panel -->
        <div class="hidden md:block absolute top-4 left-4 bg-card border rounded-lg shadow-lg p-4 z-10 w-64">
            <h4 class="font-medium text-gray-800 mb-3 text-sm">Componentes</h4>

            <!-- Node Type Buttons -->
            <div class="space-y-2">
                <button
                    type="button"
                    class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    (click)="onItemClick('STANDARD', 'Paso Estándar')">
                    <mat-icon class="text-blue-600 text-sm" svgIcon="mat_solid:radio_button_unchecked"></mat-icon>
                    <span class="text-sm">Paso Estándar</span>
                </button>

                <button
                    type="button"
                    class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    (click)="onItemClick('GATE', 'Puerta de Decisión')">
                    <mat-icon class="text-orange-600 text-sm" svgIcon="mat_solid:alt_route"></mat-icon>
                    <span class="text-sm">Puerta de Decisión</span>
                </button>

                <button
                    type="button"
                    class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    (click)="onItemClick('END', 'Paso Final')">
                    <mat-icon class="text-red-600 text-sm" svgIcon="mat_solid:stop_circle"></mat-icon>
                    <span class="text-sm">Paso Final</span>
                </button>
            </div>

            <div class="mt-6 pt-3 border-t">
                <!-- Fit to screen -->
                <button
                    type="button"
                    class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    (click)="onFitToScreenClick()">
                    <mat-icon svgIcon="mat_solid:fit_screen"></mat-icon>
                    <span class="text-sm">Ajustar a Pantalla</span>
                </button>
            </div>
        </div>
    `
})
export class FlowCanvasToolboxComponent {
    // Output events
    public readonly itemClick = output<ToolboxItemClickEvent>();
    public readonly fitToScreenClick = output<void>();

    // Expose StepType enum to template
    public readonly StepType = StepType;

    // Mobile state
    public readonly isOpen = signal<boolean>(false);

    toggleOpen(): void {
        this.isOpen.update(v => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }

    onItemClick(nodeType: string, nodeName: string): void {
        this.itemClick.emit({nodeType, nodeName});
        this.close();
    }

    onFitToScreenClick(): void {
        this.fitToScreenClick.emit();
        this.close();
    }
}
