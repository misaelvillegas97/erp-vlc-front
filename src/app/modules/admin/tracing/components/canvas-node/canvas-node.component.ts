import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule }                                                    from '@angular/common';
import { DragDropModule, CdkDragEnd, CdkDragStart }                        from '@angular/cdk/drag-drop';
import { MatIconModule }                                                   from '@angular/material/icon';
import { StepType }                                                        from '../../models/enums';

@Component({
    selector       : 'app-canvas-node',
    standalone     : true,
    imports        : [ CommonModule, DragDropModule, MatIconModule ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div
            class="canvas-node absolute cursor-pointer"
            [class.selected]="selected"
            [style.left.px]="position?.x || 0"
            [style.top.px]="position?.y || 0"
            [style.width.px]="size?.width || 0"
            [style.height.px]="size?.height || 0"
            cdkDrag
            (cdkDragStarted)="onDragStarted($event)"
            (cdkDragEnded)="onDragEnded($event)"
            (mousedown)="$event.stopPropagation()"
            (touchstart)="$event.stopPropagation()"
            (click)="nodeClick.emit()"
            (dblclick)="nodeDblClick.emit()"
            role="button"
            tabindex="0"
            [attr.aria-label]="'Nodo ' + (name || '')">
            <div class="node-content h-full flex flex-col justify-center items-center p-2 bg-white border-2 rounded-lg shadow-sm"
                 [class.border-blue-500]="selected"
                 [class.border-gray-300]="!selected">
                <mat-icon [class]="getNodeIconClass(type)">{{ getNodeIcon(type) }}</mat-icon>
                <span class="text-sm font-medium text-center mt-1">{{ name }}</span>
                <div class="connection-points absolute">
                    @if (connectableIn) {
                        <div class="connection-point input absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    }
                    @if (connectableOut) {
                        <div class="connection-point output absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    }
                </div>
            </div>
        </div>
    `,
    styles         : [
        `
            .canvas-node {
                transition: transform 0.1s ease;
            }

            .canvas-node:hover {
                transform: translateY(-1px);
            }

            .node-content {
                user-select: none;
            }

            .canvas-node:hover .connection-point {
                opacity: 1;
            }
        `
    ]
})
export class CanvasNodeComponent {
    @Input() id!: string;
    @Input() type!: StepType;
    @Input() name!: string;
    @Input() position!: { x: number; y: number };
    @Input() size!: { width: number; height: number };
    @Input() selected = false;
    @Input() connectableIn = true;
    @Input() connectableOut = true;

    @Output() nodeClick = new EventEmitter<void>();
    @Output() nodeDblClick = new EventEmitter<void>();
    // Emit when drag starts to allow parent to disable canvas panning
    @Output() dragStarted = new EventEmitter<CdkDragStart<any>>();
    // Emit the original CDK drag end event so parent can reuse existing handler
    @Output() dragEnded = new EventEmitter<CdkDragEnd<any>>();

    getNodeIcon(type: StepType): string {
        switch (type) {
            case StepType.STANDARD:
                return 'crop_square';
            case StepType.GATE:
                return 'call_split';
            case StepType.END:
                return 'stop_circle';
            default:
                return 'crop_square';
        }
    }

    getNodeIconClass(type: StepType): string {
        switch (type) {
            case StepType.GATE:
                return 'text-amber-600';
            case StepType.END:
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    }

    onDragStarted(event: CdkDragStart<any>) {
        this.dragStarted.emit(event);
    }

    onDragEnded(event: CdkDragEnd<any>) {
        this.dragEnded.emit(event);
    }
}
