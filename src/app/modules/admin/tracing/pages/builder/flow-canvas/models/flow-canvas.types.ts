import { StepType } from '../../../../models/enums';

// @foblex/flow node definition
export interface FlowNode {
    id: string;
    stepType: StepType;
    name: string;
    position: { x: number; y: number };
}

export interface FlowConnection {
    id: string;
    fOutputId: string;
    fInputId: string;
}

// Interface for storing connections in configJson
export interface StoredConnection {
    id: string;
    targetNodeId: string;
    targetInputId: string;
}

export interface CanvasNode {
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

export interface CanvasConnection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    points: { x: number; y: number }[];
}

export interface CanvasState {
    nodes: CanvasNode[];
    connections: CanvasConnection[];
    selectedNodes: string[];
    zoom: number;
    pan: { x: number; y: number };
}
