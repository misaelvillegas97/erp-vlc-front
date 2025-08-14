import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CanvasState }                               from '../models/flow-canvas.types';

@Component({
    selector       : 'app-flow-canvas-minimap',
    standalone     : true,
    imports        : [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="mt-6 pt-3 border-t">
            <h4 class="font-medium text-gray-600 mb-2 text-xs">Vista General</h4>
            <div class="minimap border rounded p-2 bg-gray-50 h-24 relative overflow-hidden">
                <div class="minimap-content" [style.transform]="getMinimapTransform()">
                    @for (node of canvasState().nodes; track node.id) {
                        <div
                            class="minimap-node absolute bg-blue-500 rounded"
                            [style.left.px]="node.position.x / 12"
                            [style.top.px]="node.position.y / 12"
                            [style.width.px]="node.size.width / 12"
                            [style.height.px]="node.size.height / 12">
                        </div>
                    }
                </div>
            </div>
        </div>
    `,
    styles         : [ `
        .minimap {
            position: relative;
        }

        .minimap-node {
            border-radius: 2px;
        }
    ` ]
})
export class FlowCanvasMiniMapComponent {
    // Input properties
    public readonly canvasState = input.required<CanvasState>();

    /**
     * Calculate minimap transform for positioning
     */
    getMinimapTransform(): string {
        const state = this.canvasState();
        return `scale(0.1) translate(${ state.pan.x }px, ${ state.pan.y }px)`;
    }
}
