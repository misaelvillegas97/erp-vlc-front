import { Injectable, inject }       from '@angular/core';
import { MatSnackBar }              from '@angular/material/snack-bar';
import { FlowNode, FlowConnection } from '../models/flow-canvas.types';

export interface KeyboardEventHandler {
    onDeleteRequested: (selectedNode: FlowNode | null, selectedConnection: FlowConnection | null) => void;
    onEscapePressed: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class FlowCanvasKeyboardService {
    private readonly snackBar = inject(MatSnackBar);

    private selectedConnection: FlowConnection | null = null;
    private selectedNode: FlowNode | null = null;
    private eventHandler: KeyboardEventHandler | null = null;

    private keyboardListener = (event: KeyboardEvent) => {
        this.handleKeyboardEvent(event);
    };

    /**
     * Initialize keyboard event listeners
     */
    initialize(handler: KeyboardEventHandler): void {
        this.eventHandler = handler;
        document.addEventListener('keydown', this.keyboardListener);
    }

    /**
     * Clean up keyboard event listeners
     */
    destroy(): void {
        document.removeEventListener('keydown', this.keyboardListener);
        this.eventHandler = null;
    }

    /**
     * Set the currently selected connection
     */
    setSelectedConnection(connection: FlowConnection | null): void {
        this.selectedConnection = connection;
        // Clear node selection when connection is selected
        if (connection) {
            this.selectedNode = null;
        }
    }

    /**
     * Set the currently selected node
     */
    setSelectedNode(node: FlowNode | null): void {
        this.selectedNode = node;
        // Clear connection selection when node is selected
        if (node) {
            this.selectedConnection = null;
        }
    }

    /**
     * Clear all selections
     */
    clearSelections(): void {
        this.selectedConnection = null;
        this.selectedNode = null;
        console.log('Keyboard service: Selections cleared');
    }

    /**
     * Get current selections
     */
    getSelections(): { selectedNode: FlowNode | null; selectedConnection: FlowConnection | null } {
        return {
            selectedNode      : this.selectedNode,
            selectedConnection: this.selectedConnection
        };
    }

    /**
     * Handle keyboard events
     */
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
                this.handleEscapeKey();
                break;
            case 'a':
            case 'A':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleSelectAll();
                }
                break;
            case 'z':
            case 'Z':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.handleRedo();
                    } else {
                        this.handleUndo();
                    }
                }
                break;
            case 'y':
            case 'Y':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleRedo();
                }
                break;
        }
    }

    /**
     * Handle delete key press
     */
    private handleDeleteKey(): void {
        if (!this.eventHandler) return;

        if (this.selectedConnection) {
            console.log('Keyboard service: Deleting selected connection:', this.selectedConnection);
            this.eventHandler.onDeleteRequested(null, this.selectedConnection);
            this.selectedConnection = null;
        } else if (this.selectedNode) {
            console.log('Keyboard service: Deleting selected node:', this.selectedNode);
            this.eventHandler.onDeleteRequested(this.selectedNode, null);
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

    /**
     * Handle escape key press
     */
    private handleEscapeKey(): void {
        if (!this.eventHandler) return;

        this.clearSelections();
        this.eventHandler.onEscapePressed();
    }

    /**
     * Handle select all shortcut (Ctrl+A)
     */
    private handleSelectAll(): void {
        console.log('Keyboard service: Select all requested');
        // This could be implemented to select all nodes
        // For now, just show a message
        this.snackBar.open('Seleccionar todo no está implementado aún', '', {duration: 2000});
    }

    /**
     * Handle undo shortcut (Ctrl+Z)
     */
    private handleUndo(): void {
        console.log('Keyboard service: Undo requested');
        // This will be handled by the main component through event emission
        // The keyboard service just captures the shortcut
    }

    /**
     * Handle redo shortcut (Ctrl+Shift+Z or Ctrl+Y)
     */
    private handleRedo(): void {
        console.log('Keyboard service: Redo requested');
        // This will be handled by the main component through event emission
        // The keyboard service just captures the shortcut
    }

    /**
     * Check if there are any selections
     */
    hasSelections(): boolean {
        return this.selectedConnection !== null || this.selectedNode !== null;
    }

    /**
     * Get selection summary for UI display
     */
    getSelectionSummary(): string {
        if (this.selectedConnection) {
            return `Conexión seleccionada (${ this.selectedConnection.fOutputId } → ${ this.selectedConnection.fInputId })`;
        } else if (this.selectedNode) {
            return `Nodo seleccionado: ${ this.selectedNode.name }`;
        } else {
            return 'Sin selección';
        }
    }
}
