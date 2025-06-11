export enum AlertType {
    LOW_STOCK = 'LOW_STOCK',
    OVERSTOCK = 'OVERSTOCK',
    EXPIRATION = 'EXPIRATION',
    REORDER = 'REORDER'
}

export enum AlertStatus {
    ACTIVE = 'ACTIVE',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED'
}

export interface InventoryAlert {
    id: string;
    inventoryItemId: string;
    type: AlertType;
    status: AlertStatus;
    alertKey?: string;
    alertParams?: Record<string, any>;
    notificationSent: boolean;
    priority?: number;
    createdAt: Date;
}
