import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, Injector, OnDestroy, OnInit, signal, viewChild, ViewChild } from '@angular/core';
import { CommonModule }                                                                                                                     from '@angular/common';
import { ActivatedRoute, RouterModule, Router }                                                                                             from '@angular/router';
import { ReactiveFormsModule }                                                                                                              from '@angular/forms';
import { MatButtonModule }                                                                                                                  from '@angular/material/button';
import { MatCardModule }                                                                                                                    from '@angular/material/card';
import { MatIconModule }                                                                                                                    from '@angular/material/icon';
import { MatToolbarModule }                                                                                                                 from '@angular/material/toolbar';
import { MatSidenavModule }                                                                                                                 from '@angular/material/sidenav';
import { MatMenuModule }                                                                                                                    from '@angular/material/menu';
import { MatDialogModule, MatDialog }                                                                                                       from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule }                                                                                                   from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                                                                                         from '@angular/material/progress-spinner';
import { MatTooltipModule }                                                                                                                 from '@angular/material/tooltip';
import { MatDividerModule }                                                                                                                 from '@angular/material/divider';
import { CdkDragDrop, DragDropModule }                                                                                                      from '@angular/cdk/drag-drop';
import { catchError, switchMap, tap }                                                                                                       from 'rxjs/operators';
import { EMPTY, of }                                                                                                                        from 'rxjs';

// @foblex/flow imports
import { EFMarkerType, FCanvasComponent, FConnectionFactory, FFlowModule } from '@foblex/flow';

import { TracingApiService }           from '../../../services/tracing-api.service';
import { FlowVersion }                 from '../../../models/entities';
import { StepType }                    from '../../../models/enums';
import { FMediator }                   from '@foblex/mediator';
import { StepSummaryOverlayComponent } from '../../../components/step-summary-overlay/step-summary-overlay.component';
import { Point }                       from '@foblex/2d';

// ===== @foblex/flow node definition =====
interface FlowNode {
    id: string;
    stepType: StepType;
    name: string;
    position: { x: number; y: number };
}

interface FlowConnection {
    id: string;
    fOutputId: string;
    fInputId: string;
}

interface CanvasNode {
    id: string;
    stepId?: string;
    type: StepType;
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isSelected: boolean;
    isConnecting: boolean;
    connections: string[]; // IDs of connected nodes
}

interface CanvasConnection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    points: { x: number; y: number }[];
}

interface CanvasState {
    nodes: CanvasNode[];
    connections: CanvasConnection[];
    selectedNodes: string[];
    zoom: number;
    pan: { x: number; y: number };
}

@Component({
    selector       : 'app-flow-canvas',
    standalone     : true,
    imports        : [
        FFlowModule,
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatToolbarModule,
        MatSidenavModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatDividerModule,
        DragDropModule,
    ],
    // providers: [FMediator, FConnectionFactory],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './flow-canvas.component.html',
    styles         : [ `
        .flow-canvas-container {
            height: 100vh;
        }

        .canvas-toolbar {
            height: 64px;
            min-height: 64px;
        }

        .toolbox-sidenav {
            @apply bg-default;
            width: 256px;
        }

        .toolbox-item {
            transition: all 0.2s ease;
        }

        .toolbox-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .canvas-container {
            cursor: grab;
        }

        .canvas-container:active {
            cursor: grabbing;
        }

        .canvas-node {
            transition: transform 0.1s ease;
        }

        .canvas-node:hover {
            transform: scale(1.02);
        }

        .canvas-node.selected .node-content {
            box-shadow: 0 0 0 2px #3b82f6;
        }

        .connection-point {
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .canvas-node:hover .connection-point {
            opacity: 1;
        }

        .minimap {
            position: relative;
        }

        .minimap-node {
            border-radius: 2px;
        }

        .canvas-grid {
            opacity: 0.5;
        }

        @media (max-width: 768px) {
            .toolbox-sidenav {
                width: 200px;
            }
        }
    ` ]
})
export class FlowCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvasContainer', {static: false}) canvasContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('flowCanvas', {static: false}) flowCanvas!: ElementRef<HTMLElement>;

    private readonly api = inject(TracingApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly injector = inject(Injector);

    // @foblex/flow properties
    public readonly flowNodes = signal<FlowNode[]>([]);
    public readonly flowConnections = signal<FlowConnection[]>([]);

    // State
    public readonly version = signal<FlowVersion | null>(null);
    public readonly isLoading = signal(false);
    public readonly isSaving = signal(false);
    public readonly canvasState = signal<CanvasState>({
        nodes        : [],
        connections  : [],
        selectedNodes: [],
        zoom         : 1,
        pan          : {x: 0, y: 0}
    });

    fCanvasComponent = viewChild(FCanvasComponent);

    // History for undo/redo
    private history: CanvasState[] = [];
    private historyIndex = -1;
    private readonly maxHistorySize = 50;

    // Canvas interaction
    private isDragging = false; // panning state
    private isNodeDragging = false; // disable panning while true
    private lastMousePosition = {x: 0, y: 0};
    private dragStartPosition = {x: 0, y: 0};

    // Expose enum to template
    public readonly StepType = StepType;

    ngOnInit(): void {
        this.route.paramMap.pipe(
            switchMap(params => {
                const versionId = params.get('versionId');
                if (versionId) {
                    return this.loadVersion(versionId);
                }
                return of(null);
            })
        ).subscribe();
    }

    ngAfterViewInit(): void {
        // Initialize @foblex/flow canvas
        this.initializeFlowCanvas();
    }

    private initializeFlowCanvas(): void {
        // @foblex/flow initialization
        console.log('Flow canvas initialized');
        // Add initial state to history
        this.saveToHistory();
    }

    ngOnDestroy(): void {
        // Cleanup for @foblex/flow if needed
    }

    private loadVersion(versionId: string) {
        this.isLoading.set(true);

        return this.api.getVersion(versionId).pipe(
            tap(async (version) => {
                this.version.set(version);
                await this.loadFlowSteps(versionId);
            }),
            catchError(error => {
                console.error('Error loading version:', error);
                this.snackBar.open('Error al cargar la versión', 'Cerrar', {duration: 5000});
                this.isLoading.set(false);
                return EMPTY;
            })
        );
    }

    onInitialized() {
        this.fCanvasComponent().fitToScreen(new Point(100, 100), false);
    }

    private async loadFlowSteps(versionId: string): Promise<void> {
        try {
            // Create @foblex/flow nodes
            const nodes: FlowNode[] = [
                {id: 'node-1', stepType: StepType.STANDARD, name: 'Inicio', position: {x: 100, y: 100}},
                {id: 'node-2', stepType: StepType.GATE, name: 'Verificación', position: {x: 300, y: 100}},
                {id: 'node-3', stepType: StepType.END, name: 'Finalizar', position: {x: 500, y: 100}}
            ];

            // Create connections between nodes
            const connections: FlowConnection[] = [
                {id: 'conn-1', fOutputId: 'node-1-output', fInputId: 'node-2-input'},
                {id: 'conn-2', fOutputId: 'node-2-output', fInputId: 'node-3-input'}
            ];

            // Update signals
            this.flowNodes.set(nodes);
            this.flowConnections.set(connections);

            this.isLoading.set(false);
        } catch (error) {
            console.error('Error loading flow steps:', error);
            this.isLoading.set(false);
        }
    }

    private async initializeCanvas(): Promise<void> {
        // Wait for DOM to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 0));

        // Validate that the canvas element is available
        if (!this.flowCanvas?.nativeElement) {
            throw new Error('Flow canvas element is not available');
        }

        const canvasElement = this.flowCanvas.nativeElement as HTMLElement;

        // @foblex/flow initialization - no additional setup needed
        console.log('Flow canvas element is ready');

        // Add initial state to history
        this.saveToHistory();
    }

    // Canvas Transform
    public getCanvasTransform(): string {
        const state = this.canvasState();
        return `translate(${ state.pan.x }px, ${ state.pan.y }px) scale(${ state.zoom })`;
    }

    public getZoomPercentage(): number {
        return Math.round(this.canvasState().zoom * 100);
    }

    public getMinimapTransform(): string {
        const state = this.canvasState();
        return `scale(0.1) translate(${ state.pan.x }px, ${ state.pan.y }px)`;
    }

    // Zoom Controls
    public zoomIn(): void {
        const currentZoom = this.canvasState().zoom;
        const newZoom = Math.min(currentZoom * 1.2, 3);
        this.updateCanvasState({
            ...this.canvasState(),
            zoom: newZoom
        });
    }

    public zoomOut(): void {
        const currentZoom = this.canvasState().zoom;
        const newZoom = Math.max(currentZoom / 1.2, 0.1);
        this.updateCanvasState({
            ...this.canvasState(),
            zoom: newZoom
        });
    }

    public resetZoom(): void {
        this.updateCanvasState({
            ...this.canvasState(),
            zoom: 1,
            pan : {x: 0, y: 0}
        });
    }

    // Canvas Events
    public onCanvasWheel(event: WheelEvent): void {
        event.preventDefault();

        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const currentZoom = this.canvasState().zoom;
        const newZoom = Math.max(0.1, Math.min(3, currentZoom * delta));

        this.updateCanvasState({
            ...this.canvasState(),
            zoom: newZoom
        });
    }

    public onCanvasMouseDown(event: MouseEvent): void {
        if (this.isNodeDragging) return;

        const target = event.target as HTMLElement | null;
        if (target && (target.closest && target.closest('.canvas-node'))) return;

        if (event.button === 0) { // Left click
            console.log('Canvas mouse down at:', event.clientX, event.clientY);
            this.isDragging = true;
            this.dragStartPosition = {x: event.clientX, y: event.clientY};
            this.lastMousePosition = {x: event.clientX, y: event.clientY};
        }
    }

    public onCanvasMouseMove(event: MouseEvent): void {
        if (this.isNodeDragging) return;
        if (this.isDragging) {
            const deltaX = event.clientX - this.lastMousePosition.x;
            const deltaY = event.clientY - this.lastMousePosition.y;

            const currentState = this.canvasState();
            this.updateCanvasState({
                ...currentState,
                pan: {
                    x: currentState.pan.x + deltaX,
                    y: currentState.pan.y + deltaY
                }
            });

            this.lastMousePosition = {x: event.clientX, y: event.clientY};
        }
    }

    public onCanvasMouseUp(_: MouseEvent): void {
        if (this.isNodeDragging) return;
        this.isDragging = false;
    }

    // Click-based Node Addition
    public onToolboxItemClick(nodeType: string, nodeName: string): void {
        try {
            // Create new @foblex/flow node
            const nodeId = `node-${ Date.now() }`;
            const stepType = nodeType as keyof typeof StepType;

            // Calculate smart position for new node
            const position = this.calculateNewNodePosition();

            const newNode: FlowNode = {
                id      : nodeId,
                stepType: StepType[stepType],
                name    : nodeName,
                position: position
            };

            // Add node to flowNodes signal
            const currentNodes = this.flowNodes();
            this.flowNodes.set([ ...currentNodes, newNode ]);

            // Save to history
            this.saveToHistory();

            console.log(`Added ${ nodeName } node at position (${ position.x }, ${ position.y })`);
            this.snackBar.open(`${ nodeName } agregado al canvas`, 'Cerrar', {duration: 2000});
        } catch (error) {
            console.error('Error adding node to canvas:', error);
            this.snackBar.open('Error al agregar nodo al canvas', 'Cerrar', {duration: 3000});
        }
    }

    // Smart positioning for new nodes
    private calculateNewNodePosition(): { x: number, y: number } {
        const currentNodes = this.flowNodes();
        const nodeSpacing = 180; // Space between nodes
        const startX = 300; // Start position away from toolbox
        const startY = 150;

        // If no nodes exist, place at start position
        if (currentNodes.length === 0) {
            return {x: startX, y: startY};
        }

        // Find a position that doesn't overlap with existing nodes
        let x = startX;
        let y = startY;
        let positionFound = false;
        const maxAttempts = 20;
        let attempts = 0;

        while (!positionFound && attempts < maxAttempts) {
            let overlaps = false;

            // Check if this position overlaps with any existing node
            for (const node of currentNodes) {
                const distance = Math.sqrt(
                    Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
                );

                if (distance < nodeSpacing) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                positionFound = true;
            } else {
                // Try next position in a grid pattern
                if (attempts % 3 === 0) {
                    x = startX;
                    y += nodeSpacing;
                } else {
                    x += nodeSpacing;
                }
                attempts++;
            }
        }

        // If we couldn't find a good position, place it at a random offset
        if (!positionFound) {
            x = startX + (Math.random() * 400);
            y = startY + (Math.random() * 300);
        }

        return {x, y};
    }

    // Node Helpers
    public getNodeIcon(type: StepType): string {
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

    public getNodeIconClass(type: StepType): string {
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

    // History Management
    private saveToHistory(): void {
        const currentState = {...this.canvasState()};

        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(currentState);

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }

        this.historyIndex = this.history.length - 1;
    }

    public undo(): void {
        if (this.canUndo()) {
            this.historyIndex--;
            this.canvasState.set({...this.history[this.historyIndex]});
        }
    }

    public redo(): void {
        if (this.canRedo()) {
            this.historyIndex++;
            this.canvasState.set({...this.history[this.historyIndex]});
        }
    }

    public canUndo(): boolean {
        return this.historyIndex > 0;
    }

    public canRedo(): boolean {
        return this.historyIndex < this.history.length - 1;
    }

    // Save Operations
    public saveFlow(): void {
        this.isSaving.set(true);

        // TODO: Implement save logic
        setTimeout(() => {
            this.isSaving.set(false);
            this.snackBar.open('Flujo guardado exitosamente', 'Cerrar', {duration: 3000});
        }, 1000);
    }

    public validateAndSave(): void {
        // TODO: Implement validation logic
        if (this.validateFlow()) {
            this.saveFlow();
        }
    }

    private validateFlow(): boolean {
        const state = this.canvasState();

        if (state.nodes.length === 0) {
            this.snackBar.open('El flujo debe tener al menos un paso', 'Cerrar', {duration: 5000});
            return false;
        }

        // TODO: Add more validation rules
        return true;
    }

    // Node Click Handler
    public onNodeClick(node: FlowNode, event: MouseEvent): void {
        // Prevent event bubbling to avoid canvas pan interactions
        event.stopPropagation();
        event.preventDefault();

        // Get current version ID for navigation
        const versionId = this.version()?.id;
        if (!versionId) {
            this.snackBar.open('Error: No se pudo obtener el ID de la versión', 'Cerrar', {duration: 3000});
            return;
        }

        // Prepare step summary data
        const stepSummaryData = {
            nodeId     : node.id,
            stepId     : undefined, // TODO: Get from backend when steps are loaded
            name       : node.name,
            stepType   : node.stepType,
            description: undefined, // TODO: Get from backend when steps are loaded
            hasFields  : false, // TODO: Get from backend when steps are loaded
            fieldsCount: 0, // TODO: Get from backend when steps are loaded
            versionId  : versionId,
            isNew      : true // TODO: Determine based on backend data
        };

        // Open the step summary overlay
        const dialogRef = this.dialog.open(StepSummaryOverlayComponent, {
            data        : stepSummaryData,
            width       : '90vw',
            maxWidth    : '500px',
            panelClass  : 'step-summary-dialog',
            autoFocus   : false,
            restoreFocus: false
        });

        // Handle dialog result if needed
        dialogRef.afterClosed().subscribe(result => {
            // Optional: Handle any actions after overlay is closed
            console.log('Step summary overlay closed');
        });
    }

    // State Management
    private updateCanvasState(newState: CanvasState): void {
        this.canvasState.set(newState);
    }

    protected readonly EFMarkerType = EFMarkerType;
}
