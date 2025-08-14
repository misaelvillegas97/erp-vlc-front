import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule }                                                                                   from '@angular/router';
import { ReactiveFormsModule }                                                                                                    from '@angular/forms';
import { MatButtonModule }                                                                                                        from '@angular/material/button';
import { MatCardModule }                                                                                                          from '@angular/material/card';
import { MatIconModule }                                                                                                          from '@angular/material/icon';
import { MatToolbarModule }                                                                                                       from '@angular/material/toolbar';
import { MatSidenavModule }                                                                                                       from '@angular/material/sidenav';
import { MatMenuModule }                                                                                                          from '@angular/material/menu';
import { MatDialog, MatDialogModule }                                                                                             from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule }                                                                                         from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                                                                               from '@angular/material/progress-spinner';
import { MatTooltipModule }                                                                                                       from '@angular/material/tooltip';
import { MatDividerModule }                                                                                                       from '@angular/material/divider';
import { DragDropModule }                                                                                                         from '@angular/cdk/drag-drop';
import { catchError, switchMap, tap }                                                                                             from 'rxjs/operators';
import { EMPTY, of }                                                                                                              from 'rxjs';

// @foblex/flow imports
import { EFMarkerType, FCanvasComponent, FFlowModule } from '@foblex/flow';

// Local imports
import { TracingApiService }            from '../../../services/tracing-api.service';
import { FlowVersion }                  from '../../../models/entities';
import { StepType }                     from '../../../models/enums';
import { StepSummaryOverlayComponent }  from '../../../components/step-summary-overlay/step-summary-overlay.component';
import { BrowserService }               from '@foblex/platform';
import { SuppressClickOnDragDirective } from '@core/directives/suppress-click-on-drag.directive';

// Extracted types and services
import { FlowConnection, FlowNode }                        from './models/flow-canvas.types';
import { FlowCanvasHistoryService }                        from './services/flow-canvas-history.service';
import { FlowCanvasApiService }                            from './services/flow-canvas-api.service';
import { FlowCanvasStateService }                          from './services/flow-canvas-state.service';
import { NodePositioningService }                          from './services/node-positioning.service';
import { FlowCanvasKeyboardService, KeyboardEventHandler } from './services/flow-canvas-keyboard.service';
import { FlowCanvasToolboxComponent }                      from './components/flow-canvas-toolbox.component';
import { FlowCanvasMiniMapComponent }                      from './components/flow-canvas-minimap.component';


@Component({
    selector  : 'app-flow-canvas',
    standalone: true,
    imports   : [
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
        FlowCanvasToolboxComponent,
        FlowCanvasMiniMapComponent,
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
export class FlowCanvasComponent implements OnInit, AfterViewInit, OnDestroy, KeyboardEventHandler {
    @ViewChild('canvasContainer', {static: false}) canvasContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('flowCanvas', {static: false}) flowCanvas!: ElementRef<HTMLElement>;

    // Injected services - now using extracted services
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly browserService = inject(BrowserService);

    // API services
    private readonly tracingApi = inject(TracingApiService);
    readonly apiService = inject(FlowCanvasApiService);

    // Extracted services
    readonly stateService = inject(FlowCanvasStateService);
    private readonly historyService = inject(FlowCanvasHistoryService);
    private readonly positioningService = inject(NodePositioningService);
    private readonly keyboardService = inject(FlowCanvasKeyboardService);

    // @foblex/flow properties
    public readonly flowNodes = signal<FlowNode[]>([]);
    public readonly flowConnections = signal<FlowConnection[]>([]);

    // State - now using services
    public readonly version = signal<FlowVersion | null>(null);

    fCanvasComponent = viewChild(FCanvasComponent);

    // Expose enum to template
    public readonly StepType = StepType;

    // Template helper methods - delegate to services
    public getZoomPercentage(): number {
        return this.stateService.zoomPercentage();
    }

    // History management methods - delegate to historyService
    public undo(): void {
        const newState = this.historyService.undo();
        if (newState) {
            this.stateService.updateCanvasState(newState);
            this.snackBar.open(`Deshacer: ${ this.historyService.getUndoDescription() }`, '', {duration: 2000});
        }
    }

    public redo(): void {
        const newState = this.historyService.redo();
        if (newState) {
            this.stateService.updateCanvasState(newState);
            this.snackBar.open(`Rehacer: ${ this.historyService.getRedoDescription() }`, '', {duration: 2000});
        }
    }

    public canUndo(): boolean {
        return this.historyService.canUndo();
    }

    public canRedo(): boolean {
        return this.historyService.canRedo();
    }

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

        // Initialize keyboard service
        this.keyboardService.initialize(this);
    }

    private initializeFlowCanvas(): void {
        // @foblex/flow initialization
        console.log('Flow canvas initialized');
        // Add initial state to history with initialization tracking
        this.historyService.saveToHistory(
            this.stateService.canvasState(),
            undefined,
            'Canvas inicializado',
            null,
            null,
            this.stateService.canvasState()
        );
    }

    // Implement KeyboardEventHandler interface
    onDeleteRequested(selectedNode: FlowNode | null, selectedConnection: FlowConnection | null): void {
        if (selectedConnection) {
            this.handleConnectionDeleted(selectedConnection);
        } else if (selectedNode) {
            this.deleteNode(selectedNode);
        }
    }

    onEscapePressed(): void {
        console.log('Escape pressed - selections cleared');
    }

    ngOnDestroy(): void {
        // Clean up services
        this.keyboardService.destroy();
    }

    private loadVersion(versionId: string) {
        this.apiService.isLoading.set(true);

        return this.tracingApi.getVersion(versionId).pipe(
            tap(async (version) => {
                this.version.set(version);
                await this.loadFlowSteps(versionId);
            }),
            catchError(error => {
                console.error('Error loading version:', error);
                this.snackBar.open('Error al cargar la versión', 'Cerrar', {duration: 5000});
                this.apiService.isLoading.set(false);
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
        setTimeout(() => this.fCanvasComponent().resetScaleAndCenter(), 500);
    }

    private async loadFlowSteps(versionId: string): Promise<void> {
        try {
            // Use the apiService to load steps and connections
            const result = await this.apiService.loadFlowSteps(versionId);

            // Update signals with loaded data
            this.flowNodes.set(result.nodes);
            this.flowConnections.set(result.connections);

            console.log(`Loaded ${ result.nodes.length } flow steps and ${ result.connections.length } connections from API`);
            this.apiService.isLoading.set(false);
        } catch (error) {
            console.error('Error loading flow steps:', error);
            this.snackBar.open('Error al cargar los pasos del flujo', 'Cerrar', {duration: 5000});
            this.apiService.isLoading.set(false);
        }
    }

    // Zoom Controls - delegate to state service
    public zoomIn(): void {
        const result = this.stateService.zoomIn();
        // Track zoom change
        this.historyService.trackCanvasZoom(this.stateService.canvasState(), result.previousZoom, result.newZoom);
    }

    public zoomOut(): void {
        const result = this.stateService.zoomOut();
        // Track zoom change
        this.historyService.trackCanvasZoom(this.stateService.canvasState(), result.previousZoom, result.newZoom);
    }

    public resetZoom(): void {
        const result = this.stateService.resetZoom();
        // Track zoom reset (combines both zoom and pan changes)
        this.historyService.trackCanvasZoom(this.stateService.canvasState(), result.previousZoom, result.newZoom);
        if (result.previousPan.x !== 0 || result.previousPan.y !== 0) {
            this.historyService.trackCanvasPan(this.stateService.canvasState(), result.previousPan, result.newPan);
        }
    }

    // Canvas interaction - delegate to state service
    public onCanvasMouseDown(event: MouseEvent): void {
        this.stateService.startCanvasPanning(event);
    }

    public onCanvasMouseMove(event: MouseEvent): void {
        this.stateService.updateCanvasPanning(event);
    }

    public onCanvasMouseUp(event: MouseEvent): void {
        const result = this.stateService.endCanvasPanning(event);
        if (result && result.hasMoved) {
            // Track canvas pan change
            this.historyService.trackCanvasPan(this.stateService.canvasState(), result.previousPan, result.newPan);
        }
    }

    // Click-based Node Addition
    public onToolboxItemClick(nodeType: string, nodeName: string): void {
        try {
            // Create new @foblex/flow node
            const nodeId = `node-${ Date.now() }`;
            const stepType = nodeType as keyof typeof StepType;

            // Calculate smart position for new node
            const position = this.positioningService.calculateNewNodePosition(this.flowNodes());

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

    private trackNodeCreation(node: FlowNode): void {
        // Track the change in history
        this.historyService.trackNodeCreation(this.stateService.canvasState(), node);

        // Send creation to API
        this.apiService.createNodeInAPI(node, this.version(), this.flowNodes().length).subscribe(
            response => {
                console.log('Node created successfully:', response);
                // Update the node with the server-assigned ID if different
                if (response.id !== node.id) {
                    const currentNodes = this.flowNodes();
                    const updatedNodes = currentNodes.map(n =>
                        n.id === node.id ? {...n, id: response.id} : n
                    );
                    this.flowNodes.set(updatedNodes);
                }
            }
        );
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
        this.historyService.trackConnectionCreation(this.stateService.canvasState(), connection);

        // Save connection to API via configJson
        this.apiService.saveConnectionToAPI(connection, this.flowNodes()).subscribe();
    }

    private trackConnectionDeletion(connection: FlowConnection): void {
        this.historyService.trackConnectionDeletion(this.stateService.canvasState(), connection);

        // Remove connection from API via configJson
        this.apiService.removeConnectionFromAPI(connection, this.flowNodes()).subscribe();
    }

    // Track node deletion - delegate to services
    private trackNodeDeletion(node: FlowNode): void {
        // Track the change in history
        this.historyService.trackNodeDeletion(this.stateService.canvasState(), node);

        // Send deletion to API
        this.apiService.deleteNodeInAPI(node.id).subscribe();
    }

    // Save Operations
    public saveFlow(): void {
        // TODO: Implement save logic using apiService
        this.snackBar.open('Flujo guardado exitosamente', 'Cerrar', {duration: 3000});
    }

    public validateAndSave(): void {
        // TODO: Implement validation logic
        if (this.validateFlow()) {
            this.saveFlow();
        }
    }

    private validateFlow(): boolean {
        const state = this.stateService.canvasState();

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

        // Select the connection using keyboard service
        this.keyboardService.setSelectedConnection(connection);

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

        // Select the node using keyboard service
        this.keyboardService.setSelectedNode(node);

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

    // State Management - delegate to state service
    private updateCanvasState(newState: any): void {
        this.stateService.updateCanvasState(newState);
    }

    protected readonly EFMarkerType = EFMarkerType;
}
