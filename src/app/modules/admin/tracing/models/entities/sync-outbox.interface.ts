import { SyncOperation } from '../enums/sync-operation.enum';

export interface SyncOutbox {
    id: string;
    entityName: string;
    entityId: string;
    operation: SyncOperation;
    payload: Record<string, any>;
    version: number;
    deviceId: string;
    createdAt: Date;
    syncedAt?: Date;
    retryCount: number;
    lastError?: string;
}
