import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { CommonModule }                                      from '@angular/common';

@Component({
    selector       : 'app-canvas-connection',
    standalone     : true,
    imports        : [ CommonModule ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <svg class="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <path
                [attr.d]="path"
                stroke="#6b7280"
                stroke-width="2"
                fill="none"
                class="connection-path">
            </path>

            <!-- Arrow marker -->
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                        refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280"/>
                </marker>
            </defs>
        </svg>
    `,
    styles         : [ `
        :host {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }

        .connection-path {
            marker-end: url(#arrowhead);
            transition: stroke 0.2s ease;
        }

        .connection-path:hover {
            stroke: #3b82f6;
            stroke-width: 3;
        }
    ` ]
})
export class CanvasConnectionComponent implements OnInit {
    // Rete connection data - provided by Rete's AngularPlugin
    @Input() data!: any;
    @Input() start!: { x: number; y: number };
    @Input() end!: { x: number; y: number };
    @Input() path!: string;
    @Input() rendered!: () => void;

    ngOnInit(): void {
        // Component is managed by Rete.js
        // Call rendered callback if provided
        if (this.rendered) {
            this.rendered();
        }
    }
}
