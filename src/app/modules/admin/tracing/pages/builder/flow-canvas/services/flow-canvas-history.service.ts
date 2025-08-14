import { Injectable, signal }                            from '@angular/core';
import { CanvasState, FlowNode, FlowConnection }         from '../models/flow-canvas.types';
import { ChangeEvent, ChangeType, EnhancedHistoryEntry } from '../models/change-tracking.types';

@Injectable({
    providedIn: 'root'
})
export class FlowCanvasHistoryService {
    // Enhanced history for undo/redo with change tracking
    private history: EnhancedHistoryEntry[] = [];
    private historyIndex = -1;
    private readonly maxHistorySize = 50;

    // Change tracking
    private changeCounter = 0;

    // Public signals for component to observe
    public readonly canUndo = signal(false);
    public readonly canRedo = signal(false);

    /**
     * Save a new entry to history with change tracking
     */
    saveToHistory(
        canvasState: CanvasState,
        changeType?: ChangeType,
        description?: string,
        data?: any,
        previousState?: any,
        newState?: any
    ): void {
        const currentState = {...canvasState};

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
        this.updateCanUndoRedo();

        // Log change for debugging
        console.log('Change tracked:', changeEvent.type, changeEvent.description, changeEvent);
    }

    /**
     * Undo the last change
     */
    undo(): CanvasState | null {
        if (this.canUndo()) {
            this.historyIndex--;
            const historyEntry = this.history[this.historyIndex];
            this.updateCanUndoRedo();
            console.log('Undo applied:', historyEntry.changeDescription);
            return {...historyEntry.canvasState};
        }
        return null;
    }

    /**
     * Redo the next change
     */
    redo(): CanvasState | null {
        if (this.canRedo()) {
            this.historyIndex++;
            const historyEntry = this.history[this.historyIndex];
            this.updateCanUndoRedo();
            console.log('Redo applied:', historyEntry.changeDescription);
            return {...historyEntry.canvasState};
        }
        return null;
    }

    /**
     * Get the description for the last undo operation
     */
    getUndoDescription(): string {
        if (this.canUndo() && this.historyIndex >= 0) {
            return this.history[this.historyIndex].changeDescription;
        }
        return '';
    }

    /**
     * Get the description for the next redo operation
     */
    getRedoDescription(): string {
        if (this.canRedo() && this.historyIndex + 1 < this.history.length) {
            return this.history[this.historyIndex + 1].changeDescription;
        }
        return '';
    }

    /**
     * Track node creation
     */
    trackNodeCreation(canvasState: CanvasState, node: FlowNode): void {
        this.saveToHistory(
            canvasState,
            ChangeType.NODE_CREATE,
            `Nodo "${ node.name }" creado`,
            {nodeId: node.id, name: node.name, stepType: node.stepType, position: node.position},
            null,
            node
        );
    }

    /**
     * Track node deletion
     */
    trackNodeDeletion(canvasState: CanvasState, node: FlowNode): void {
        this.saveToHistory(
            canvasState,
            ChangeType.NODE_DELETE,
            `Nodo "${ node.name }" eliminado`,
            {nodeId: node.id, name: node.name, stepType: node.stepType},
            node,
            null
        );
    }

    /**
     * Track node movement
     */
    trackNodeMove(
        canvasState: CanvasState,
        node: FlowNode,
        previousPosition: { x: number; y: number },
        newPosition: { x: number; y: number }
    ): void {
        this.saveToHistory(
            canvasState,
            ChangeType.NODE_MOVE,
            `Nodo "${ node.name }" movido`,
            {nodeId: node.id, name: node.name, previousPosition, newPosition},
            previousPosition,
            newPosition
        );
    }

    /**
     * Track connection creation
     */
    trackConnectionCreation(canvasState: CanvasState, connection: FlowConnection): void {
        this.saveToHistory(
            canvasState,
            ChangeType.CONNECTION_CREATE,
            `Conexión creada`,
            {connectionId: connection.id, outputId: connection.fOutputId, inputId: connection.fInputId},
            null,
            connection
        );
    }

    /**
     * Track connection deletion
     */
    trackConnectionDeletion(canvasState: CanvasState, connection: FlowConnection): void {
        this.saveToHistory(
            canvasState,
            ChangeType.CONNECTION_DELETE,
            `Conexión eliminada`,
            {connectionId: connection.id, outputId: connection.fOutputId, inputId: connection.fInputId},
            connection,
            null
        );
    }

    /**
     * Track canvas zoom change
     */
    trackCanvasZoom(canvasState: CanvasState, previousZoom: number, newZoom: number): void {
        this.saveToHistory(
            canvasState,
            ChangeType.CANVAS_ZOOM,
            `Zoom cambiado de ${ Math.round(previousZoom * 100) }% a ${ Math.round(newZoom * 100) }%`,
            {previousZoom, newZoom},
            previousZoom,
            newZoom
        );
    }

    /**
     * Track canvas pan change
     */
    trackCanvasPan(
        canvasState: CanvasState,
        previousPan: { x: number; y: number },
        newPan: { x: number; y: number }
    ): void {
        this.saveToHistory(
            canvasState,
            ChangeType.CANVAS_PAN,
            `Canvas desplazado`,
            {previousPan, newPan},
            previousPan,
            newPan
        );
    }

    private updateCanUndoRedo(): void {
        this.canUndo.set(this.historyIndex > 0);
        this.canRedo.set(this.historyIndex < this.history.length - 1);
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
}
