import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule }                                                                                     from '@angular/common';
import { RouterModule, ActivatedRoute }                                                                     from '@angular/router';
import { ReactiveFormsModule }                                                                              from '@angular/forms';
import { MatButtonModule }                                                                                  from '@angular/material/button';
import { MatCardModule }                                                                                    from '@angular/material/card';
import { MatIconModule }                                                                                    from '@angular/material/icon';
import { MatToolbarModule }                                                                                 from '@angular/material/toolbar';
import { MatSidenavModule }                                                                                 from '@angular/material/sidenav';
import { MatMenuModule }                                                                                    from '@angular/material/menu';
import { MatDialogModule }                                                                                  from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar }                                                                   from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                                                         from '@angular/material/progress-spinner';
import { MatTooltipModule }                                                                                 from '@angular/material/tooltip';
import { MatDividerModule }                                                                                 from '@angular/material/divider';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList }                                                from '@angular/cdk/drag-drop';
import { switchMap, catchError, tap }                                                                       from 'rxjs/operators';
import { of, EMPTY }                                                                                        from 'rxjs';

import { TracingApiService }     from '../../../services/tracing-api.service';
import { FlowVersion, FlowStep } from '../../../models/entities';
import { StepType }              from '../../../models/enums';
import { CanvasNodeComponent }   from '../../../components/canvas-node/canvas-node.component';

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
        CanvasNodeComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flow-canvas-container h-screen flex flex-col w-full">
            <!-- Toolbar -->
            <mat-toolbar class="canvas-toolbar border-b">
                <div class="flex items-center justify-between w-full">
                    <!-- Left Section -->
                    <div class="flex items-center space-x-4">
                        <button mat-icon-button routerLink="/tracing/templates" matTooltip="Volver">
                            <mat-icon>arrow_back</mat-icon>
                        </button>

                        <div class="flex flex-col">
                            <span class="font-medium">{{ version()?.id ? 'Editando' : 'Cargando' }} Flujo</span>
                            <span class="text-sm text-gray-600">v{{ version()?.version || '...' }}</span>
                        </div>
                    </div>

                    <!-- Center Section - Canvas Controls -->
                    <div class="flex items-center space-x-2">
                        <button mat-icon-button (click)="zoomIn()" matTooltip="Acercar">
                            <mat-icon>zoom_in</mat-icon>
                        </button>

                        <span class="text-sm px-2">{{ getZoomPercentage() }}%</span>

                        <button mat-icon-button (click)="zoomOut()" matTooltip="Alejar">
                            <mat-icon>zoom_out</mat-icon>
                        </button>

                        <button mat-icon-button (click)="resetZoom()" matTooltip="Restablecer zoom">
                            <mat-icon>center_focus_strong</mat-icon>
                        </button>

                        <mat-divider [vertical]="true" class="mx-2"></mat-divider>

                        <button mat-icon-button (click)="undo()" [disabled]="!canUndo()" matTooltip="Deshacer">
                            <mat-icon>undo</mat-icon>
                        </button>

                        <button mat-icon-button (click)="redo()" [disabled]="!canRedo()" matTooltip="Rehacer">
                            <mat-icon>redo</mat-icon>
                        </button>
                    </div>

                    <!-- Right Section -->
                    <div class="flex items-center space-x-2">
                        <button mat-button (click)="saveFlow()" [disabled]="isSaving()">
                            <mat-icon>save</mat-icon>
                            Guardar
                        </button>

                        <button mat-raised-button color="primary" (click)="validateAndSave()">
                            <mat-icon>check</mat-icon>
                            Validar y Guardar
                        </button>
                    </div>
                </div>
            </mat-toolbar>

            <!-- Main Content -->
            <div class="flex flex-1 overflow-hidden">
                <!-- Toolbox Sidebar -->
                <mat-sidenav-container class="flex-1">
                    <mat-sidenav mode="side" opened class="toolbox-sidenav w-64 border-r">
                        <div class="p-4">
                            <h3 class="font-medium mb-4">Componentes</h3>

                            <!-- Node Types -->
                            <div class="space-y-2">
                                <div class="font-sm text-gray-600 mb-2">Pasos</div>

                                <div
                                    class="toolbox-item p-3 border rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2"
                                    cdkDrag
                                    [cdkDragData]="{ type: 'STANDARD', name: 'Paso Estándar' }"
                                    (cdkDragEnded)="onToolboxDragEnd($event)">
                                    <mat-icon class="text-blue-600">radio_button_unchecked</mat-icon>
                                    <span>Paso Estándar</span>
                                </div>

                                <div
                                    class="toolbox-item p-3 border rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2"
                                    cdkDrag
                                    [cdkDragData]="{ type: 'GATE', name: 'Puerta de Decisión' }"
                                    (cdkDragEnded)="onToolboxDragEnd($event)">
                                    <mat-icon class="text-orange-600">alt_route</mat-icon>
                                    <span>Puerta de Decisión</span>
                                </div>

                                <div
                                    class="toolbox-item p-3 border rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2"
                                    cdkDrag
                                    [cdkDragData]="{ type: 'END', name: 'Paso Final' }"
                                    (cdkDragEnded)="onToolboxDragEnd($event)">
                                    <mat-icon class="text-red-600">stop_circle</mat-icon>
                                    <span>Paso Final</span>
                                </div>
                            </div>

                            <!-- Minimap -->
                            <div class="mt-8">
                                <h4 class="font-sm text-gray-600 mb-2">Vista General</h4>
                                <div class="minimap border rounded p-2 bg-gray-50 h-32 relative overflow-hidden">
                                    <div class="minimap-content" [style.transform]="getMinimapTransform()">
                                        @for (node of canvasState().nodes; track node.id) {
                                            <div
                                                class="minimap-node absolute bg-blue-500 rounded"
                                                [style.left.px]="node.position.x / 10"
                                                [style.top.px]="node.position.y / 10"
                                                [style.width.px]="node.size.width / 10"
                                                [style.height.px]="node.size.height / 10">
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </mat-sidenav>

                    <!-- Canvas Area -->
                    <mat-sidenav-content class="canvas-content">
                        <div
                            #canvasContainer
                            class="canvas-container relative w-full h-full overflow-hidden bg-gray-50"
                            (wheel)="onCanvasWheel($event)"
                            (mousedown)="onCanvasMouseDown($event)"
                            (mousemove)="onCanvasMouseMove($event)"
                            (mouseup)="onCanvasMouseUp($event)"
                            cdkDropList
                            (cdkDropListDropped)="onCanvasDrop($event)">

                            <!-- Canvas Grid -->
                            <div class="canvas-grid absolute inset-0" [style.transform]="getCanvasTransform()">
                                <svg class="w-full h-full">
                                    <defs>
                                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)"/>
                                </svg>
                            </div>

                            <!-- Canvas Content -->
                            <div class="canvas-content-layer absolute inset-0" [style.transform]="getCanvasTransform()">
                                <!-- Connections -->
                                <svg class="absolute inset-0 w-full h-full pointer-events-none">
                                    @for (connection of canvasState().connections; track connection.id) {
                                        <path
                                            [attr.d]="getConnectionPath(connection)"
                                            stroke="#6b7280"
                                            stroke-width="2"
                                            fill="none"
                                            marker-end="url(#arrowhead)">
                                        </path>
                                    }

                                    <!-- Arrow marker -->
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7"
                                                refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280"/>
                                        </marker>
                                    </defs>
                                </svg>

                                <!-- Nodes -->
                                @for (node of canvasState().nodes; track node.id) {
                                    <app-canvas-node
                                        [id]="node.id"
                                        [type]="node.type"
                                        [name]="node.name"
                                        [position]="node.position"
                                        [size]="node.size"
                                        [selected]="node.isSelected"
                                        [connectableIn]="true"
                                        [connectableOut]="node.type !== StepType.END"
                                        (dragStarted)="onNodeDragStart($event)"
                                        (dragEnded)="onNodeDragEnd($event, node)"
                                        (nodeClick)="selectNode(node)"
                                        (nodeDblClick)="editNode(node)"
                                    />
                                }
                            </div>
                        </div>
                    </mat-sidenav-content>
                </mat-sidenav-container>
            </div>

            <!-- Loading Overlay -->
            @if (isLoading()) {
                <div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                    <mat-spinner diameter="40"></mat-spinner>
                </div>
            }
        </div>
    `,
    styles         : [ `
        .flow-canvas-container {
            height: 100vh;
        }

        .canvas-toolbar {
            height: 64px;
            min-height: 64px;
        }

        .toolbox-sidenav {
            width: 256px;
            background: white;
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
export class FlowCanvasComponent implements OnInit, AfterViewInit {
    @ViewChild('canvasContainer', {static: true}) canvasContainer!: ElementRef<HTMLDivElement>;

    private readonly api = inject(TracingApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly snackBar = inject(MatSnackBar);

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
        // Initialize canvas
        this.initializeCanvas();
    }

    private loadVersion(versionId: string) {
        this.isLoading.set(true);

        return this.api.getVersion(versionId).pipe(
            tap(version => {
                this.version.set(version);
                this.loadFlowSteps(versionId);
            }),
            catchError(error => {
                console.error('Error loading version:', error);
                this.snackBar.open('Error al cargar la versión', 'Cerrar', {duration: 5000});
                this.isLoading.set(false);
                return EMPTY;
            })
        );
    }

    private loadFlowSteps(versionId: string): void {
        // TODO: Load flow steps from API
        // For now, create some sample nodes
        const sampleNodes: CanvasNode[] = [
            {
                id          : 'node-1',
                type        : StepType.STANDARD,
                name        : 'Inicio',
                position    : {x: 100, y: 100},
                size        : {width: 120, height: 80},
                isSelected  : false,
                isConnecting: false,
                connections : [ 'node-2' ]
            },
            {
                id          : 'node-2',
                type        : StepType.GATE,
                name        : 'Verificación',
                position    : {x: 300, y: 100},
                size        : {width: 120, height: 80},
                isSelected  : false,
                isConnecting: false,
                connections : [ 'node-3' ]
            },
            {
                id          : 'node-3',
                type        : StepType.END,
                name        : 'Finalizar',
                position    : {x: 500, y: 100},
                size        : {width: 120, height: 80},
                isSelected  : false,
                isConnecting: false,
                connections : []
            }
        ];

        const sampleConnections: CanvasConnection[] = [
            {
                id        : 'conn-1',
                fromNodeId: 'node-1',
                toNodeId  : 'node-2',
                points    : []
            },
            {
                id        : 'conn-2',
                fromNodeId: 'node-2',
                toNodeId  : 'node-3',
                points    : []
            }
        ];

        this.updateCanvasState({
            ...this.canvasState(),
            nodes      : sampleNodes,
            connections: sampleConnections
        });

        this.isLoading.set(false);
    }

    private initializeCanvas(): void {
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
        if (this.isNodeDragging) {
            return;
        }

        const target = event.target as HTMLElement | null;
        if (target && target.closest && target.closest('.canvas-node')) {
            return;
        }

        if (event.button === 0) { // Left click
            this.isDragging = true;
            this.dragStartPosition = {x: event.clientX, y: event.clientY};
            this.lastMousePosition = {x: event.clientX, y: event.clientY};
        }
    }

    public onCanvasMouseMove(event: MouseEvent): void {
        if (this.isNodeDragging) {
            return;
        }
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

    public onCanvasMouseUp(event: MouseEvent): void {
        if (this.isNodeDragging) {
            return;
        }
        this.isDragging = false;
    }

    // Drag & Drop
    public onToolboxDragEnd(event: any): void {
        const dropPoint = event.dropPoint;
        if (dropPoint && this.canvasContainer) {
            const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
            const canvasState = this.canvasState();

            // Calculate position relative to canvas
            const x = (dropPoint.x - rect.left - canvasState.pan.x) / canvasState.zoom;
            const y = (dropPoint.y - rect.top - canvasState.pan.y) / canvasState.zoom;

            this.createNode(event.source.data, {x, y});
        }
    }

    public onCanvasDrop(event: CdkDragDrop<any>): void {
        // Handle drop on canvas
    }

    public onNodeDragStart(event: any): void {
        this.isNodeDragging = true;
    }

    public onNodeDragEnd(event: any, node: CanvasNode): void {
        // Node drag finished; re-enable canvas panning
        this.isNodeDragging = false;
        const dropPoint = event.dropPoint;
        if (dropPoint && this.canvasContainer) {
            const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
            const canvasState = this.canvasState();

            const x = (dropPoint.x - rect.left - canvasState.pan.x) / canvasState.zoom;
            const y = (dropPoint.y - rect.top - canvasState.pan.y) / canvasState.zoom;

            this.updateNodePosition(node.id, {x, y});
        }
    }

    // Node Operations
    private createNode(nodeData: any, position: { x: number; y: number }): void {
        const newNode: CanvasNode = {
            id          : `node-${ Date.now() }`,
            type        : nodeData.type,
            name        : nodeData.name,
            position,
            size        : {width: 120, height: 80},
            isSelected  : false,
            isConnecting: false,
            connections : []
        };

        const currentState = this.canvasState();
        this.updateCanvasState({
            ...currentState,
            nodes: [ ...currentState.nodes, newNode ]
        });

        this.saveToHistory();
    }

    private updateNodePosition(nodeId: string, position: { x: number; y: number }): void {
        const currentState = this.canvasState();
        const updatedNodes = currentState.nodes.map(node =>
            node.id === nodeId ? {...node, position} : node
        );

        this.updateCanvasState({
            ...currentState,
            nodes: updatedNodes
        });

        this.saveToHistory();
    }

    public selectNode(node: CanvasNode): void {
        const currentState = this.canvasState();
        const updatedNodes = currentState.nodes.map(n => ({
            ...n,
            isSelected: n.id === node.id
        }));

        this.updateCanvasState({
            ...currentState,
            nodes        : updatedNodes,
            selectedNodes: [ node.id ]
        });
    }

    public editNode(node: CanvasNode): void {
        // TODO: Open node editor dialog
        this.snackBar.open('Editor de nodos próximamente', 'Cerrar', {duration: 3000});
    }

    // Connections
    public getConnectionPath(connection: CanvasConnection): string {
        const fromNode = this.canvasState().nodes.find(n => n.id === connection.fromNodeId);
        const toNode = this.canvasState().nodes.find(n => n.id === connection.toNodeId);

        if (!fromNode || !toNode) return '';

        const startX = fromNode.position.x + fromNode.size.width;
        const startY = fromNode.position.y + fromNode.size.height / 2;
        const endX = toNode.position.x;
        const endY = toNode.position.y + toNode.size.height / 2;

        const controlX1 = startX + (endX - startX) / 3;
        const controlX2 = startX + (2 * (endX - startX)) / 3;

        return `M ${ startX } ${ startY } C ${ controlX1 } ${ startY }, ${ controlX2 } ${ endY }, ${ endX } ${ endY }`;
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

    // State Management
    private updateCanvasState(newState: CanvasState): void {
        this.canvasState.set(newState);
    }
}
