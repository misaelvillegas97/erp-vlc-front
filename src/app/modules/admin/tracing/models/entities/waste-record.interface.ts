export interface WasteRecord {
    id: string;
    stepExecutionId: string;
    qty: number;
    reason: string;
    affectsInventory: boolean;
    evidenceUrl?: string;
    costImpact?: number;
    sku?: string;
    lot?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
