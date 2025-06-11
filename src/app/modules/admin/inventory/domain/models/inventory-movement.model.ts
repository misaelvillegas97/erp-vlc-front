export enum MovementType {
    RECEIPT = 'RECEIPT',
    SHIPMENT = 'SHIPMENT',
    ADJUSTMENT = 'ADJUSTMENT',
    TRANSFER = 'TRANSFER',
    RETURN = 'RETURN',
    RESERVATION = 'RESERVATION',
    RELEASE = 'RELEASE'
}

export interface InventoryMovement {
    id: string;
    inventoryItemId: string;
    type: MovementType;
    quantity: number;
    reference?: string;
    metadata?: Record<string, any>;
    createdById: string;
    createdAt: Date;
}
