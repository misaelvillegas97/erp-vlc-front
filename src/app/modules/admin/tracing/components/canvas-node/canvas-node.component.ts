import { ChangeDetectionStrategy, Component, Input, OnInit, Output } from '@angular/core';
import { CommonModule }                                              from '@angular/common';
import { MatIconModule }                                             from '@angular/material/icon';
import { StepType }                                                  from '../../models/enums';

// Rete.js imports
import { ClassicPreset } from 'rete';

// Custom Rete Node class for Flow Steps
class FlowStepNode extends ClassicPreset.Node {
    constructor(id: string, stepType: StepType, name: string) {
        super(name);

        // Create sockets for input/output
        const flowSocket = new ClassicPreset.Socket('flow');

        // Add input and output ports
        this.addInput('input', new ClassicPreset.Input(flowSocket, 'Input'));
        this.addOutput('output', new ClassicPreset.Output(flowSocket, 'Output'));

        // Store additional data
        this.stepType = stepType;
        this.nodeId = id;
    }

    // Additional properties for step data
    stepType!: StepType;
    nodeId!: string;
}

@Component({
    selector       : 'app-canvas-node',
    standalone     : true,
    imports    : [ CommonModule, MatIconModule ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './canvas-node.component.html',
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
export class CanvasNodeComponent implements OnInit {
    // Rete node data - these will be provided by Rete's AngularPlugin
    @Input() data!: FlowStepNode;
    @Input() rendered!: any;
    @Input() emit!: any;

    // Derived properties from Rete node data
    get stepType(): StepType {
        return this.data?.stepType || StepType.STANDARD;
    }

    get nodeName(): string {
        return this.data?.label || 'Node';
    }

    get nodeId(): string {
        return this.data?.nodeId || '';
    }

    ngOnInit(): void {
        // Component is now managed by Rete.js
        // No manual initialization needed
    }

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
}
