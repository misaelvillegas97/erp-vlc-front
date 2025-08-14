import { CanvasState } from './flow-canvas.types';

// Change tracking interfaces and enums
export enum ChangeType {
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

export interface ChangeEvent {
    id: string;
    type: ChangeType;
    timestamp: number;
    description: string;
    data: any;
    previousState?: any;
    newState?: any;
}

export interface EnhancedHistoryEntry {
    canvasState: CanvasState;
    changeEvent: ChangeEvent;
    changeDescription: string;
}
