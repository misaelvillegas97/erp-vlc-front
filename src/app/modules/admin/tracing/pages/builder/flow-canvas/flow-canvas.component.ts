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
import { DragDropModule } from '@angular/cdk/drag-drop';
import { catchError, switchMap, tap }                                                                                                       from 'rxjs/operators';
import { EMPTY, of }                                                                                                                        from 'rxjs';

// @foblex/flow imports
import { EFMarkerType, FCanvasComponent, FCreateConnectionEvent, FFlowModule } from '@foblex/flow';

import { TracingApiService }           from '../../../services/tracing-api.service';
import { FlowVersion }                 from '../../../models/entities';
import { StepType }                    from '../../../models/enums';
import { StepSummaryOverlayComponent } from '../../../components/step-summary-overlay/step-summary-overlay.component';
import { BrowserService }         from '@foblex/platform';
import { SuppressClickOnDragDirective }                                        from '@core/directives/suppress-click-on-drag.directive';

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

// Interface for storing connections in configJson
interface StoredConnection {
    id: string;
    targetNodeId: string;
    targetInputId: string;
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

// Change tracking interfaces and enums
enum ChangeType {
    NODE_CREATE = 'NODE_CREATE',
    NODE_DELETE = 'NODE_DELETE',
    NODE_MOVE = 'NODE_MOVE',
    NODE_UPDATE = 'NODE_UPDATE',
    CONNECTION_CREATE = 'CONNECTION_CREATE',
    CONNECTION_DELETE = 'CONNECTION_DELETE',
    CANVAS_ZOOM = 'CANVAS_ZOOM',
    CANVAS_PAN = 'CANVAS_PAN',
    SELECTION_CHANGE = 'SELECTION_CHANGE'
}

interface ChangeEvent {
    id: string;
    type: ChangeType;
    timestamp: number;
    description: string;
    data: any;
    previousState?: any;
    newState?: any;
}

interface EnhancedHistoryEntry {
    canvasState: CanvasState;
    changeEvent: ChangeEvent;
    changeDescription: string;
}

@Component({
    selector       : 'app-flow-canvas',
    standalone     : true,
    imports: [
        FFlowModule,
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
        SuppressClickOnDragDirective,
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
    private readonly browserService = inject(BrowserService);

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

    // Enhanced history for undo/redo with change tracking
    private history: EnhancedHistoryEntry[] = [];
    private historyIndex = -1;
    private readonly maxHistorySize = 50;

    // Change tracking
    private changeCounter = 0;

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

        // Set up keyboard event listeners
        this.setupKeyboardListeners();
    }

    private initializeFlowCanvas(): void {
        // @foblex/flow initialization
        console.log('Flow canvas initialized');
        // Add initial state to history with initialization tracking
        this.saveToHistory(ChangeType.SELECTION_CHANGE, 'Canvas inicializado', null, null, this.canvasState());
    }

    private setupKeyboardListeners(): void {
        // Listen for keyboard events on the document
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.handleKeyboardEvent(event);
        });
    }

    private selectedConnection: FlowConnection | null = null;
    private selectedNode: FlowNode | null = null;

    private handleKeyboardEvent(event: KeyboardEvent): void {
        // Only handle keyboard events when canvas is focused or no other input is focused
        const activeElement = document.activeElement;
        const isInputFocused = activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLSelectElement ||
            activeElement?.getAttribute('contenteditable') === 'true';

        if (isInputFocused) {
            return; // Don't handle shortcuts when user is typing in inputs
        }

        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                event.preventDefault();
                this.handleDeleteKey();
                break;
            case 'Escape':
                event.preventDefault();
                this.clearSelections();
                break;
        }
    }

    private handleDeleteKey(): void {
        if (this.selectedConnection) {
            this.handleConnectionDeleted(this.selectedConnection);
            this.selectedConnection = null;
        } else if (this.selectedNode) {
            this.deleteNode(this.selectedNode);
            this.selectedNode = null;
        } else {
            // No selection
            this.snackBar.open(
                'Selecciona una conexión o nodo para eliminar haciendo click en él',
                '',
                {duration: 3000}
            );
        }
    }

    private clearSelections(): void {
        this.selectedConnection = null;
        this.selectedNode = null;
        console.log('Selections cleared');
    }

    ngOnDestroy(): void {
        document.removeEventListener('keydown', this.handleKeyboardEvent.bind(this));
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
        // setTimeout(() => this.fCanvasComponent().fitToScreen(PointExtensions.initialize(), false), 100);
        this.fitToScreen();
    }

    private fitToScreen(): void {
        // setTimeout(() => this.fCanvasComponent().fitToScreen(new Point(800, 800), false), 100);
        setTimeout(() => this.fCanvasComponent().resetScaleAndCenter());
    }

    private async loadFlowSteps(versionId: string): Promise<void> {
        try {
            // Load steps from API
            const steps = await this.api.findStepsByVersion(versionId).pipe(
                catchError(error => {
                    console.error('Error loading flow steps from API:', error);
                    // Return empty array on error
                    return of([]);
                })
            ).toPromise();

            // Convert API steps to FlowNode objects
            const nodes: FlowNode[] = (steps || []).map(step => ({
                id      : step.id,
                stepType: step.type,
                name    : step.name,
                position: step.position || {x: 100, y: 100}
            }));

            // Load connections from configJson of each step
            const connections: FlowConnection[] = [];

            (steps || []).forEach(step => {
                if (step.configJson && step.configJson.connections && Array.isArray(step.configJson.connections)) {
                    const stepConnections = step.configJson.connections as StoredConnection[];
                    stepConnections.forEach(storedConn => {
                        const flowConnection: FlowConnection = {
                            id       : storedConn.id,
                            fOutputId: `${ step.id }-output`,  // Source node output ID
                            fInputId : storedConn.targetInputId // Target node input ID
                        };
                        connections.push(flowConnection);
                    });
                }
            });

            console.log(`Loaded ${ connections.length } connections from configJson`);
            ;

            // Update signals with loaded data
            this.flowNodes.set(nodes);
            this.flowConnections.set(connections);

            console.log(`Loaded ${ nodes.length } flow steps from API`);
            this.isLoading.set(false);
        } catch (error) {
            console.error('Error loading flow steps:', error);
            this.snackBar.open('Error al cargar los pasos del flujo', 'Cerrar', {duration: 5000});
            this.isLoading.set(false);
        }
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

        // Track zoom change
        this.trackCanvasZoom(currentZoom, newZoom);
    }

    public zoomOut(): void {
        const currentZoom = this.canvasState().zoom;
        const newZoom = Math.max(currentZoom / 1.2, 0.1);
        this.updateCanvasState({
            ...this.canvasState(),
            zoom: newZoom
        });

        // Track zoom change
        this.trackCanvasZoom(currentZoom, newZoom);
    }

    public resetZoom(): void {
        const currentState = this.canvasState();
        const previousZoom = currentState.zoom;
        const previousPan = currentState.pan;
        const newPan = {x: 0, y: 0};
        
        this.updateCanvasState({
            ...currentState,
            zoom: 1,
            pan: newPan
        });

        // Track zoom reset (combines both zoom and pan changes)
        this.trackCanvasZoom(previousZoom, 1);
        if (previousPan.x !== 0 || previousPan.y !== 0) {
            this.trackCanvasPan(previousPan, newPan);
        }
    }

    public onCanvasMouseDown(event: MouseEvent): void {
        if (this.isNodeDragging) return;

        const target = event.target as HTMLElement | null;
        if (target && (target.closest && target.closest('.canvas-node'))) return;

        if (event.button === 0) {
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
        if (this.isDragging) {
            // Track canvas pan change when dragging ends
            const currentPosition = {x: _.clientX, y: _.clientY};
            const totalDeltaX = currentPosition.x - this.dragStartPosition.x;
            const totalDeltaY = currentPosition.y - this.dragStartPosition.y;

            // Only track if there was significant movement
            if (Math.abs(totalDeltaX) > 5 || Math.abs(totalDeltaY) > 5) {
                const currentState = this.canvasState();
                const previousPan = {
                    x: currentState.pan.x - totalDeltaX,
                    y: currentState.pan.y - totalDeltaY
                };
                this.trackCanvasPan(previousPan, currentState.pan);
            }
        }
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

            // Track node creation with detailed change logging
            this.trackNodeCreation(newNode);

            this.fitToScreen();

            console.log(`Added ${ nodeName } node at position (${ position.x }, ${ position.y })`);
            this.snackBar.open(`${ nodeName } agregado al canvas`, 'Cerrar', {duration: 2000});
        } catch (error) {
            console.error('Error adding node to canvas:', error);
            this.snackBar.open('Error al agregar nodo al canvas', 'Cerrar', {duration: 3000});
        }
    }

    // Smart positioning for new nodes
    /**
     * Compute a collision-free position for a new node, snapped to a grid.
     *
     * Algorithm:
     * 1) Build a spatial hash of occupied grid cells from current nodes (AABB + padding).
     * 2) Choose a base point to the right of `preferAfterNodeId` if provided, else a default.
     * 3) Scan cells deterministically row-by-row and return the first free slot.
     * 4) Fall back to a diagonal offset if the scan exceeds limits.
     *
     * Assumptions:
     * - Existing nodes expose `position: { x, y }` and optional `width`/`height` in px.
     * - New node uses DEFAULT_WIDTH/DEFAULT_HEIGHT when unknown.
     *
     * Complexity:
     * - O(C) where C is the number of checked cells. Hash lookups are O(1).
     *
     * @param preferAfterNodeId Optional node id used as a placement anchor (place to its right).
     * @returns Coordinates `{ x, y }` in pixels, already aligned to the grid.
     */
    private calculateNewNodePosition(preferAfterNodeId?: string): { x: number; y: number } {
        type NodeLike = {
            id: string;
            position: { x: number; y: number };
            width?: number;
            height?: number;
        };

        const nodes: NodeLike[] = this.flowNodes();

        // Grid and sizing constants
        const GRID = 24;               // grid size for snapping (px)
        const GAP = 16;               // extra spacing around nodes (px)
        const DEFAULT_WIDTH = 240;    // default node width (px)
        const DEFAULT_HEIGHT = 72;     // default node height (px)
        const START = {x: 180, y: 120};

        // Effective padded size for collision checks
        const sizeOf = (n?: NodeLike) => {
            const w = (n?.width ?? DEFAULT_WIDTH) + GAP;
            const h = (n?.height ?? DEFAULT_HEIGHT) + GAP;
            return {w, h};
        };

        // Spatial hash keyed by grid cell "gx,gy"
        const occupied = new Set<string>();
        const key = (gx: number, gy: number) => `${ gx },${ gy }`;

        // Mark occupied cells for each existing node
        for (const n of nodes) {
            const {w, h} = sizeOf(n);
            const x0 = Math.floor(n.position.x / GRID);
            const y0 = Math.floor(n.position.y / GRID);
            const x1 = Math.floor((n.position.x + w) / GRID);
            const y1 = Math.floor((n.position.y + h) / GRID);
            for (let gx = x0; gx <= x1; gx++) {
                for (let gy = y0; gy <= y1; gy++) {
                    occupied.add(key(gx, gy));
                }
            }
        }

        // Base point: to the right of the reference node if provided
        let base = START;
        if (preferAfterNodeId) {
            const ref = nodes.find(n => n.id === preferAfterNodeId);
            if (ref) {
                const {w: rw} = sizeOf(ref);
                base = {x: ref.position.x + rw, y: ref.position.y};
            }
        }

        // New node footprint in grid cells
        const {w: newW, h: newH} = sizeOf();
        const cellsW = Math.ceil(newW / GRID);
        const cellsH = Math.ceil(newH / GRID);

        const startGX = Math.max(0, Math.floor(base.x / GRID));
        const startGY = Math.max(0, Math.floor(base.y / GRID));

        // Check if a CW×CH block is free
        const fits = (gx: number, gy: number) => {
            for (let x = gx; x < gx + cellsW; x++) {
                for (let y = gy; y < gy + cellsH; y++) {
                    if (occupied.has(key(x, y))) return false;
                }
            }
            return true;
        };

        // Deterministic scan: left→right, then next rows downward
        const MAX_COLS = 400;
        const MAX_ROWS = 200;

        for (let gy = startGY; gy < startGY + MAX_ROWS; gy += cellsH) {
            for (let gx = startGX; gx < startGX + MAX_COLS; gx += cellsW) {
                if (fits(gx, gy)) return {x: gx * GRID, y: gy * GRID};
            }
            // Also try from START on each subsequent row
            for (let gx = Math.floor(START.x / GRID); gx < startGX; gx += cellsW) {
                if (fits(gx, gy)) return {x: gx * GRID, y: gy * GRID};
            }
        }

        // Fallback: diagonal offset based on node count
        const off = nodes.length * 8;
        const x = Math.round((START.x + off) / GRID) * GRID;
        const y = Math.round((START.y + off) / GRID) * GRID;
        return {x, y};
    }


    // Node Helpers
    public getNodeIcon(type: StepType): string {
        switch (type) {
            case StepType.STANDARD:
                return 'mat_solid:radio_button_unchecked';
            case StepType.GATE:
                return 'mat_solid:alt_route';
            case StepType.END:
                return 'mat_solid:stop_circle';
            default:
                return 'mat_solid:help';
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
    private saveToHistory(changeType?: ChangeType, description?: string, data?: any, previousState?: any, newState?: any): void {
        const currentState = {...this.canvasState()};

        // Create change event if provided
        const changeEvent: ChangeEvent = {
            id           : `change-${ ++this.changeCounter }`,
            type         : changeType || ChangeType.SELECTION_CHANGE,
            timestamp    : Date.now(),
            description  : description || 'Canvas state changed',
            data         : data || null,
            previousState: previousState || null,
            newState     : newState || null
        };

        const historyEntry: EnhancedHistoryEntry = {
            canvasState      : currentState,
            changeEvent      : changeEvent,
            changeDescription: this.getChangeDescription(changeEvent)
        };

        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(historyEntry);

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }

        this.historyIndex = this.history.length - 1;
    }

    private getChangeDescription(changeEvent: ChangeEvent): string {
        switch (changeEvent.type) {
            case ChangeType.NODE_CREATE:
                return `Nodo creado: ${ changeEvent.data?.name || 'Nuevo nodo' }`;
            case ChangeType.NODE_DELETE:
                return `Nodo eliminado: ${ changeEvent.data?.name || 'Nodo' }`;
            case ChangeType.NODE_MOVE:
                return `Nodo movido: ${ changeEvent.data?.name || 'Nodo' }`;
            case ChangeType.NODE_UPDATE:
                return `Nodo actualizado: ${ changeEvent.data?.name || 'Nodo' }`;
            case ChangeType.CONNECTION_CREATE:
                return `Conexión creada entre nodos`;
            case ChangeType.CONNECTION_DELETE:
                return `Conexión eliminada`;
            case ChangeType.CANVAS_ZOOM:
                return `Zoom cambiado a ${ Math.round((changeEvent.newState || 1) * 100) }%`;
            case ChangeType.CANVAS_PAN:
                return `Canvas desplazado`;
            case ChangeType.SELECTION_CHANGE:
                return `Selección cambiada`;
            default:
                return changeEvent.description;
        }
    }

    private trackNodeCreation(node: FlowNode): void {
        this.saveToHistory(
            ChangeType.NODE_CREATE,
            `Nodo "${ node.name }" creado`,
            {nodeId: node.id, name: node.name, stepType: node.stepType, position: node.position},
            null,
            node
        );

        // Send creation to API
        this.createNodeInAPI(node);
    }

    private createNodeInAPI(node: FlowNode): void {
        const versionId = this.version()?.id;
        if (!versionId) {
            console.error('Cannot create node in API: no version ID available');
            this.snackBar.open('Error: No se pudo obtener el ID de la versión', 'Cerrar', {duration: 5000});
            return;
        }

        const createStepDto = {
            flowVersionId: versionId,
            key          : node.id, // Use node ID as key
            name         : node.name,
            type         : node.stepType,
            position     : node.position,
            order        : this.flowNodes().length, // Set order based on current node count
            isActive     : true
        };

        // Show loading state
        this.isSaving.set(true);

        this.api.createFlowStep(createStepDto).pipe(
            tap(response => {
                console.log('Node created in API:', response);
                this.snackBar.open(`Paso "${ node.name }" creado exitosamente`, '', {duration: 2000});

                // Update the node with the server-assigned ID if different
                if (response.id !== node.id) {
                    this.updateNodeId(node.id, response.id);
                }
            }),
            catchError(error => {
                console.error('Error creating node in API:', error);
                this.snackBar.open('Error al crear el paso en el servidor', 'Cerrar', {duration: 5000});
                return EMPTY;
            }),
            tap(() => this.isSaving.set(false)) // Always hide loading state
        ).subscribe();
    }

    private updateNodeId(oldId: string, newId: string): void {
        const currentNodes = this.flowNodes();
        const updatedNodes = currentNodes.map(node =>
            node.id === oldId ? {...node, id: newId} : node
        );
        this.flowNodes.set(updatedNodes);
    }

    private trackNodeDeletion(node: FlowNode): void {
        this.saveToHistory(
            ChangeType.NODE_DELETE,
            `Nodo "${ node.name }" eliminado`,
            {nodeId: node.id, name: node.name, stepType: node.stepType},
            node,
            null
        );

        // Send deletion to API
        this.deleteNodeInAPI(node.id);
    }

    private deleteNodeInAPI(nodeId: string): void {
        // Show loading state
        this.isSaving.set(true);

        this.api.deleteFlowStep(nodeId).pipe(
            tap(() => {
                console.log('Node deleted in API:', nodeId);
                this.snackBar.open('Paso eliminado exitosamente', '', {duration: 2000});
            }),
            catchError(error => {
                console.error('Error deleting node in API:', error);
                this.snackBar.open('Error al eliminar el paso en el servidor', 'Cerrar', {duration: 5000});
                return EMPTY;
            }),
            tap(() => this.isSaving.set(false)) // Always hide loading state
        ).subscribe();
    }

    private trackNodeMove(node: FlowNode, previousPosition: { x: number; y: number }, newPosition: { x: number; y: number }): void {
        this.saveToHistory(
            ChangeType.NODE_MOVE,
            `Nodo "${ node.name }" movido`,
            {nodeId: node.id, name: node.name, previousPosition, newPosition},
            previousPosition,
            newPosition
        );

        // Send position update to API
        this.updateNodeInAPI(node.id, {position: newPosition});
    }

    private updateNodeInAPI(nodeId: string, updateData: any): void {
        // Show loading state
        this.isSaving.set(true);

        this.api.updateFlowStep(nodeId, updateData).pipe(
            tap(response => {
                console.log('Node updated in API:', response);
                this.snackBar.open(`Paso actualizado exitosamente`, '', {duration: 2000});
            }),
            catchError(error => {
                console.error('Error updating node in API:', error);
                this.snackBar.open('Error al actualizar el paso en el servidor', 'Cerrar', {duration: 5000});
                return EMPTY;
            }),
            tap(() => this.isSaving.set(false)) // Always hide loading state
        ).subscribe();
    }

    handleConnectionCreated(connectionData: any): void {
        console.log('Handling connection creation:', connectionData);

        // Extract connection information from the event data
        let outputId = connectionData.outputId || connectionData.fOutputId || connectionData.from;
        let inputId = connectionData.inputId || connectionData.fInputId || connectionData.to;

        // If we don't have the IDs directly, try to extract from other properties
        if (!outputId || !inputId) {
            // Sometimes the data might be in different structure
            if (connectionData.source && connectionData.target) {
                outputId = connectionData.source;
                inputId = connectionData.target;
            }
        }

        if (outputId && inputId) {
            // Create new connection
            const newConnection: FlowConnection = {
                id       : connectionData.id || `connection-${ Date.now() }`,
                fOutputId: outputId,
                fInputId : inputId
            };

            // Add to flowConnections signal
            const currentConnections = this.flowConnections();
            this.flowConnections.set([ ...currentConnections, newConnection ]);

            // Track the change
            this.trackConnectionCreation(newConnection);

            console.log('Connection created successfully:', newConnection);
            this.snackBar.open('Conexión creada exitosamente', '', {duration: 2000});
        } else {
            console.warn('Could not extract output and input IDs from connection data:', connectionData);
        }
    }

    private handleConnectionDeleted(connectionData: any): void {
        console.log('Handling connection deletion:', connectionData);

        const connectionId = connectionData.id || connectionData.connectionId;

        if (connectionId) {
            // Find and remove connection
            const currentConnections = this.flowConnections();
            const connectionToDelete = currentConnections.find(c => c.id === connectionId);

            if (connectionToDelete) {
                const updatedConnections = currentConnections.filter(c => c.id !== connectionId);
                this.flowConnections.set(updatedConnections);

                // Track the change
                this.trackConnectionDeletion(connectionToDelete);

                console.log('Connection deleted successfully:', connectionToDelete);
                this.snackBar.open('Conexión eliminada exitosamente', '', {duration: 2000});
            }
        } else {
            console.warn('Could not find connection ID for deletion:', connectionData);
        }
    }

    private trackConnectionCreation(connection: FlowConnection): void {
        this.saveToHistory(
            ChangeType.CONNECTION_CREATE,
            `Conexión creada`,
            {connectionId: connection.id, outputId: connection.fOutputId, inputId: connection.fInputId},
            null,
            connection
        );

        // Save connection to API via configJson
        this.saveConnectionToAPI(connection);
    }

    private trackConnectionDeletion(connection: FlowConnection): void {
        this.saveToHistory(
            ChangeType.CONNECTION_DELETE,
            `Conexión eliminada`,
            {connectionId: connection.id, outputId: connection.fOutputId, inputId: connection.fInputId},
            connection,
            null
        );

        // Remove connection from API via configJson
        this.removeConnectionFromAPI(connection);
    }

    private saveConnectionToAPI(connection: FlowConnection): void {
        // Extract source node ID from fOutputId (remove '-output' suffix)
        const sourceNodeId = connection.fOutputId.replace('-output', '');

        // Find the source node
        const sourceNode = this.flowNodes().find(node => node.id === sourceNodeId);
        if (!sourceNode) {
            console.error('Source node not found for connection:', connection);
            return;
        }

        // Extract target node ID from fInputId (remove '-input' suffix)
        const targetNodeId = connection.fInputId.replace('-input', '');

        // Create connection data for configJson
        const connectionData: StoredConnection = {
            id           : connection.id,
            targetNodeId : targetNodeId,
            targetInputId: connection.fInputId
        };

        // First, get the current step data from API to preserve existing configJson
        this.api.findStepById(sourceNodeId).pipe(
            tap(step => {
                // Preserve existing configJson and add connections array
                const currentConfigJson = step.configJson ? {...step.configJson} : {};
                if (!currentConfigJson.connections) {
                    currentConfigJson.connections = [];
                }

                // Add new connection to connections array (avoid duplicates)
                const existingConnectionIndex = currentConfigJson.connections.findIndex(
                    (conn: StoredConnection) => conn.id === connectionData.id
                );

                if (existingConnectionIndex === -1) {
                    currentConfigJson.connections.push(connectionData);

                    // Update the source node via API
                    this.updateNodeInAPI(sourceNodeId, {configJson: currentConfigJson});
                    console.log(`Saved connection to API: ${ sourceNodeId } -> ${ targetNodeId }`);
                } else {
                    console.log(`Connection already exists in API: ${ connectionData.id }`);
                }
            }),
            catchError(error => {
                console.error('Error loading step data for connection save:', error);
                return EMPTY;
            })
        ).subscribe();
    }

    private removeConnectionFromAPI(connection: FlowConnection): void {
        // Extract source node ID from fOutputId (remove '-output' suffix)
        const sourceNodeId = connection.fOutputId.replace('-output', '');

        // Find the source node
        const sourceNode = this.flowNodes().find(node => node.id === sourceNodeId);
        if (!sourceNode) {
            console.error('Source node not found for connection removal:', connection);
            return;
        }

        // First, get the current step data from API to preserve existing configJson
        this.api.findStepById(sourceNodeId).pipe(
            tap(step => {
                // Preserve existing configJson
                const currentConfigJson = step.configJson ? {...step.configJson} : {};
                if (!currentConfigJson.connections) {
                    currentConfigJson.connections = [];
                }

                // Remove connection from connections array
                const originalLength = currentConfigJson.connections.length;
                currentConfigJson.connections = currentConfigJson.connections.filter(
                    (conn: StoredConnection) => conn.id !== connection.id
                );

                // Only update if connection was actually removed
                if (currentConfigJson.connections.length < originalLength) {
                    // Update the source node via API
                    this.updateNodeInAPI(sourceNodeId, {configJson: currentConfigJson});
                    console.log(`Removed connection from API: ${ connection.id }`);
                } else {
                    console.log(`Connection not found in API: ${ connection.id }`);
                }
            }),
            catchError(error => {
                console.error('Error loading step data for connection removal:', error);
                return EMPTY;
            })
        ).subscribe();
    }

    private trackCanvasZoom(previousZoom: number, newZoom: number): void {
        this.saveToHistory(
            ChangeType.CANVAS_ZOOM,
            `Zoom cambiado de ${ Math.round(previousZoom * 100) }% a ${ Math.round(newZoom * 100) }%`,
            {previousZoom, newZoom},
            previousZoom,
            newZoom
        );
    }

    private trackCanvasPan(previousPan: { x: number; y: number }, newPan: { x: number; y: number }): void {
        this.saveToHistory(
            ChangeType.CANVAS_PAN,
            `Canvas desplazado`,
            {previousPan, newPan},
            previousPan,
            newPan
        );
    }

    public undo(): void {
        if (this.canUndo()) {
            this.historyIndex--;
            const historyEntry = this.history[this.historyIndex];
            this.canvasState.set({...historyEntry.canvasState});
            console.log('Undo applied:', historyEntry.changeDescription);
            this.snackBar.open(`Deshacer: ${ historyEntry.changeDescription }`, '', {duration: 2000});
        }
    }

    public redo(): void {
        if (this.canRedo()) {
            this.historyIndex++;
            const historyEntry = this.history[this.historyIndex];
            this.canvasState.set({...historyEntry.canvasState});
            console.log('Redo applied:', historyEntry.changeDescription);
            this.snackBar.open(`Rehacer: ${ historyEntry.changeDescription }`, '', {duration: 2000});
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

    // Connection Click Handlers
    public onConnectionClick(connection: FlowConnection, event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();

        console.log('Connection clicked:', connection);

        // Select the connection
        this.selectedConnection = connection;
        this.selectedNode = null; // Clear node selection

        // Show connection info with delete option
        this.snackBar.open(
            `Conexión seleccionada (${ connection.fOutputId } → ${ connection.fInputId }) - Presiona Delete o doble-click para eliminar`,
            'Eliminar',
            {
                duration: 4000
            }
        ).onAction().subscribe(() => {
            this.handleConnectionDeleted(connection);
        });
    }

    public onConnectionDoubleClick(connection: FlowConnection, event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();

        console.log('Connection double-clicked:', connection);

        // Double-click to delete connection
        this.handleConnectionDeleted(connection);
    }

    public deleteNode(node: FlowNode): void {
        const currentNodes = this.flowNodes();
        const updatedNodes = currentNodes.filter(n => n.id !== node.id);

        if (updatedNodes.length < currentNodes.length) {
            // Remove node from flowNodes signal
            this.flowNodes.set(updatedNodes);

            // Also remove any connections that were connected to this node
            const currentConnections = this.flowConnections();
            const updatedConnections = currentConnections.filter(c =>
                !c.fOutputId.startsWith(node.id) && !c.fInputId.startsWith(node.id)
            );

            if (updatedConnections.length < currentConnections.length) {
                this.flowConnections.set(updatedConnections);
            }

            // Track the deletion
            this.trackNodeDeletion(node);
            this.snackBar.open('Nodo eliminado', '', {duration: 2000});
        } else {
            console.warn('Node not found for deletion:', node);
        }
    }

    // Node Click Handler
    public onNodeClick(node: FlowNode, event: MouseEvent): void {
        // Prevent event bubbling to avoid canvas pan interactions
        event.stopPropagation();
        event.preventDefault();

        // Select the node
        this.selectedNode = node;
        this.selectedConnection = null; // Clear connection selection
        
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
        });
    }

    // State Management
    private updateCanvasState(newState: CanvasState): void {
        this.canvasState.set(newState);
    }

    protected readonly EFMarkerType = EFMarkerType;
}
