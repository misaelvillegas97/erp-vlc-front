import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, EMPTY }      from 'rxjs';
import { catchError, tap }            from 'rxjs/operators';
import { MatSnackBar }                from '@angular/material/snack-bar';

import { TracingApiService }                          from '../../../../services/tracing-api.service';
import { FlowVersion }                                from '../../../../models/entities';
import { FlowNode, FlowConnection, StoredConnection } from '../models/flow-canvas.types';
import { FlowStepResponseDto }                        from '../../../../models/dtos/flow-step-response.dto';

@Injectable({
    providedIn: 'root'
})
export class FlowCanvasApiService {
    private readonly api = inject(TracingApiService);
    private readonly snackBar = inject(MatSnackBar);

    // Loading states
    public readonly isSaving = signal(false);
    public readonly isLoading = signal(false);

    /**
     * Load flow steps from API and convert to FlowNodes
     */
    async loadFlowSteps(versionId: string): Promise<{ nodes: FlowNode[], connections: FlowConnection[] }> {
        try {
            this.isLoading.set(true);

            const steps = await this.api.findStepsByVersion(versionId).pipe(
                catchError(error => {
                    console.error('Error loading flow steps from API:', error);
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

            console.log(`Loaded ${ nodes.length } flow steps and ${ connections.length } connections from API`);
            this.isLoading.set(false);

            return {nodes, connections};
        } catch (error) {
            console.error('Error loading flow steps:', error);
            this.snackBar.open('Error al cargar los pasos del flujo', 'Cerrar', {duration: 5000});
            this.isLoading.set(false);
            return {nodes: [], connections: []};
        }
    }

    /**
     * Create a new node in the API
     */
    createNodeInAPI(node: FlowNode, version: FlowVersion | null, currentNodeCount: number): Observable<FlowStepResponseDto> {
        if (!version?.id) {
            console.error('Cannot create node in API: no version ID available');
            this.snackBar.open('Error: No se pudo obtener el ID de la versión', 'Cerrar', {duration: 5000});
            return EMPTY;
        }

        const createStepDto = {
            flowVersionId: version.id,
            key          : node.id, // Use node ID as key
            name         : node.name,
            type         : node.stepType,
            position     : node.position,
            order        : currentNodeCount, // Set order based on current node count
            isActive     : true
        };

        this.isSaving.set(true);

        return this.api.createFlowStep(createStepDto).pipe(
            tap(response => {
                console.log('Node created in API:', response);
                this.snackBar.open(`Paso "${ node.name }" creado exitosamente`, '', {duration: 2000});
            }),
            catchError(error => {
                console.error('Error creating node in API:', error);
                this.snackBar.open('Error al crear el paso en el servidor', 'Cerrar', {duration: 5000});
                return EMPTY;
            }),
            tap(() => this.isSaving.set(false))
        );
    }

    /**
     * Update a node in the API
     */
    updateNodeInAPI(nodeId: string, updateData: any): Observable<FlowStepResponseDto> {
        this.isSaving.set(true);

        return this.api.updateFlowStep(nodeId, updateData).pipe(
            tap(response => {
                console.log('Node updated in API:', response);
                this.snackBar.open('Paso actualizado exitosamente', '', {duration: 2000});
            }),
            catchError(error => {
                console.error('Error updating node in API:', error);
                this.snackBar.open('Error al actualizar el paso en el servidor', 'Cerrar', {duration: 5000});
                return EMPTY;
            }),
            tap(() => this.isSaving.set(false))
        );
    }

    /**
     * Delete a node from the API
     */
    deleteNodeInAPI(nodeId: string): Observable<void> {
        this.isSaving.set(true);

        return this.api.deleteFlowStep(nodeId).pipe(
            tap(() => {
                console.log('Node deleted in API:', nodeId);
                this.snackBar.open('Paso eliminado exitosamente', '', {duration: 2000});
            }),
            catchError(error => {
                console.error('Error deleting node in API:', error);
                this.snackBar.open('Error al eliminar el paso en el servidor', 'Cerrar', {duration: 5000});
                return EMPTY;
            }),
            tap(() => this.isSaving.set(false))
        );
    }

    /**
     * Save a connection to API via configJson
     */
    saveConnectionToAPI(connection: FlowConnection, nodes: FlowNode[]): Observable<any> {
        // Extract source node ID from fOutputId (remove '-output' suffix)
        const sourceNodeId = connection.fOutputId.replace('-output', '');

        // Find the source node
        const sourceNode = nodes.find(node => node.id === sourceNodeId);
        if (!sourceNode) {
            console.error('Source node not found for connection:', connection);
            return EMPTY;
        }

        // Extract target node ID from fInputId (remove '-input' suffix)
        const targetNodeId = connection.fInputId.replace('-input', '');

        // Create connection data for configJson
        const connectionData: StoredConnection = {
            id           : connection.id,
            targetNodeId : targetNodeId,
            targetInputId: connection.fInputId
        };

        // Get the current step data from API to preserve existing configJson
        return this.api.findStepById(sourceNodeId).pipe(
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
                    this.updateNodeInAPI(sourceNodeId, {configJson: currentConfigJson}).subscribe();
                    console.log(`Saved connection to API: ${ sourceNodeId } -> ${ targetNodeId }`);
                } else {
                    console.log(`Connection already exists in API: ${ connectionData.id }`);
                }
            }),
            catchError(error => {
                console.error('Error loading step data for connection save:', error);
                return EMPTY;
            })
        );
    }

    /**
     * Remove a connection from API via configJson
     */
    removeConnectionFromAPI(connection: FlowConnection, nodes: FlowNode[]): Observable<any> {
        // Extract source node ID from fOutputId (remove '-output' suffix)
        const sourceNodeId = connection.fOutputId.replace('-output', '');

        // Find the source node
        const sourceNode = nodes.find(node => node.id === sourceNodeId);
        if (!sourceNode) {
            console.error('Source node not found for connection removal:', connection);
            return EMPTY;
        }

        // Get the current step data from API to preserve existing configJson
        return this.api.findStepById(sourceNodeId).pipe(
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
                    this.updateNodeInAPI(sourceNodeId, {configJson: currentConfigJson}).subscribe();
                    console.log(`Removed connection from API: ${ connection.id }`);
                } else {
                    console.log(`Connection not found in API: ${ connection.id }`);
                }
            }),
            catchError(error => {
                console.error('Error loading step data for connection removal:', error);
                return EMPTY;
            })
        );
    }
}
