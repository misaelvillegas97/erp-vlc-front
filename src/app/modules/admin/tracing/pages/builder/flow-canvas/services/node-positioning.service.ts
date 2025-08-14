import { Injectable } from '@angular/core';
import { FlowNode }   from '../models/flow-canvas.types';

interface NodeLike {
    id: string;
    position: { x: number; y: number };
    width?: number;
    height?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NodePositioningService {

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
     * @param nodes Current nodes in the canvas
     * @param preferAfterNodeId Optional node id used as a placement anchor (place to its right).
     * @returns Coordinates `{ x, y }` in pixels, already aligned to the grid.
     */
    calculateNewNodePosition(nodes: FlowNode[], preferAfterNodeId?: string): { x: number; y: number } {
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

    /**
     * Get grid-aligned position
     */
    snapToGrid(position: { x: number; y: number }, gridSize: number = 24): { x: number; y: number } {
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    }

    /**
     * Check if two positions are close enough to be considered the same
     */
    arePositionsEqual(pos1: { x: number; y: number }, pos2: { x: number; y: number }, tolerance: number = 1): boolean {
        return Math.abs(pos1.x - pos2.x) <= tolerance && Math.abs(pos1.y - pos2.y) <= tolerance;
    }

    /**
     * Calculate the center point between multiple positions
     */
    calculateCenterPoint(positions: { x: number; y: number }[]): { x: number; y: number } {
        if (positions.length === 0) {
            return {x: 0, y: 0};
        }

        const sum = positions.reduce(
            (acc, pos) => ({x: acc.x + pos.x, y: acc.y + pos.y}),
            {x: 0, y: 0}
        );

        return {
            x: sum.x / positions.length,
            y: sum.y / positions.length
        };
    }
}
