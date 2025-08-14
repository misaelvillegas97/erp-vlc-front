import { Injectable, signal, computed } from '@angular/core';
import { CanvasState }                  from '../models/flow-canvas.types';

@Injectable({
    providedIn: 'root'
})
export class FlowCanvasStateService {

    // Canvas state signal
    public readonly canvasState = signal<CanvasState>({
        nodes        : [],
        connections  : [],
        selectedNodes: [],
        zoom         : 1,
        pan          : {x: 0, y: 0}
    });

    // Computed properties for UI binding
    public readonly zoomPercentage = computed(() => Math.round(this.canvasState().zoom * 100));
    public readonly minimapTransform = computed(() => {
        const state = this.canvasState();
        return `scale(0.1) translate(${ state.pan.x }px, ${ state.pan.y }px)`;
    });

    // Canvas interaction state
    private isDragging = false;
    private isNodeDragging = false;
    private lastMousePosition = {x: 0, y: 0};
    private dragStartPosition = {x: 0, y: 0};

    /**
     * Update the canvas state
     */
    updateCanvasState(newState: CanvasState): void {
        this.canvasState.set(newState);
    }

    /**
     * Update only specific properties of the canvas state
     */
    updateCanvasStatePartial(updates: Partial<CanvasState>): void {
        const currentState = this.canvasState();
        this.canvasState.set({...currentState, ...updates});
    }

    /**
     * Zoom in the canvas
     */
    zoomIn(): { previousZoom: number; newZoom: number } {
        const currentZoom = this.canvasState().zoom;
        const newZoom = Math.min(currentZoom * 1.2, 3);

        this.updateCanvasStatePartial({zoom: newZoom});

        return {previousZoom: currentZoom, newZoom};
    }

    /**
     * Zoom out the canvas
     */
    zoomOut(): { previousZoom: number; newZoom: number } {
        const currentZoom = this.canvasState().zoom;
        const newZoom = Math.max(currentZoom / 1.2, 0.1);

        this.updateCanvasStatePartial({zoom: newZoom});

        return {previousZoom: currentZoom, newZoom};
    }

    /**
     * Reset zoom and pan to defaults
     */
    resetZoom(): {
        previousZoom: number;
        newZoom: number;
        previousPan: { x: number; y: number };
        newPan: { x: number; y: number }
    } {
        const currentState = this.canvasState();
        const previousZoom = currentState.zoom;
        const previousPan = currentState.pan;
        const newPan = {x: 0, y: 0};

        this.updateCanvasStatePartial({
            zoom: 1,
            pan : newPan
        });

        return {previousZoom, newZoom: 1, previousPan, newPan};
    }

    /**
     * Start canvas panning
     */
    startCanvasPanning(event: MouseEvent): void {
        if (this.isNodeDragging) return;

        const target = event.target as HTMLElement | null;
        if (target && (target.closest && target.closest('.canvas-node'))) return;

        if (event.button === 0) {
            this.isDragging = true;
            this.dragStartPosition = {x: event.clientX, y: event.clientY};
            this.lastMousePosition = {x: event.clientX, y: event.clientY};
        }
    }

    /**
     * Update canvas panning
     */
    updateCanvasPanning(event: MouseEvent): void {
        if (this.isNodeDragging || !this.isDragging) return;

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

    /**
     * End canvas panning and return pan change info if significant movement occurred
     */
    endCanvasPanning(event: MouseEvent): {
        previousPan: { x: number; y: number };
        newPan: { x: number; y: number };
        hasMoved: boolean
    } | null {
        if (!this.isDragging) {
            return null;
        }

        const currentPosition = {x: event.clientX, y: event.clientY};
        const totalDeltaX = currentPosition.x - this.dragStartPosition.x;
        const totalDeltaY = currentPosition.y - this.dragStartPosition.y;

        const hasMoved = Math.abs(totalDeltaX) > 5 || Math.abs(totalDeltaY) > 5;

        let result = null;
        if (hasMoved) {
            const currentState = this.canvasState();
            const previousPan = {
                x: currentState.pan.x - totalDeltaX,
                y: currentState.pan.y - totalDeltaY
            };
            result = {previousPan, newPan: currentState.pan, hasMoved};
        }

        this.isDragging = false;
        return result;
    }

    /**
     * Set node dragging state
     */
    setNodeDragging(isDragging: boolean): void {
        this.isNodeDragging = isDragging;
    }

    /**
     * Get current dragging states
     */
    getDragStates(): { isDragging: boolean; isNodeDragging: boolean } {
        return {
            isDragging    : this.isDragging,
            isNodeDragging: this.isNodeDragging
        };
    }

    /**
     * Clear all selections
     */
    clearSelections(): void {
        this.updateCanvasStatePartial({selectedNodes: []});
    }

    /**
     * Select nodes
     */
    selectNodes(nodeIds: string[]): void {
        this.updateCanvasStatePartial({selectedNodes: nodeIds});
    }

    /**
     * Add node to selection
     */
    addNodeToSelection(nodeId: string): void {
        const currentSelected = this.canvasState().selectedNodes;
        if (!currentSelected.includes(nodeId)) {
            this.updateCanvasStatePartial({
                selectedNodes: [ ...currentSelected, nodeId ]
            });
        }
    }

    /**
     * Remove node from selection
     */
    removeNodeFromSelection(nodeId: string): void {
        const currentSelected = this.canvasState().selectedNodes;
        this.updateCanvasStatePartial({
            selectedNodes: currentSelected.filter(id => id !== nodeId)
        });
    }

    /**
     * Check if a node is selected
     */
    isNodeSelected(nodeId: string): boolean {
        return this.canvasState().selectedNodes.includes(nodeId);
    }

    /**
     * Get current canvas bounds for minimap calculations
     */
    getCanvasBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
        const nodes = this.canvasState().nodes;

        if (nodes.length === 0) {
            return {minX: 0, minY: 0, maxX: 800, maxY: 600};
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + node.size.width);
            maxY = Math.max(maxY, node.position.y + node.size.height);
        });

        return {minX, minY, maxX, maxY};
    }

    /**
     * Reset to initial state
     */
    reset(): void {
        this.canvasState.set({
            nodes        : [],
            connections  : [],
            selectedNodes: [],
            zoom         : 1,
            pan          : {x: 0, y: 0}
        });

        this.isDragging = false;
        this.isNodeDragging = false;
        this.lastMousePosition = {x: 0, y: 0};
        this.dragStartPosition = {x: 0, y: 0};
    }
}
