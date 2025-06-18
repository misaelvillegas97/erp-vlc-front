export interface InventoryBatch {
    id: string;
    inventoryItemId: string;
    inventoryItem?: any; // Could be typed as InventoryItem if needed
    quantity: number;
    batchNumber?: string;
    expirationDate?: Date;
    receiptDate: Date;
    isReserved: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
