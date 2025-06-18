import { Warehouse } from '@modules/admin/inventory/domain/models/warehouse.model';

export interface InventoryItem {
    id?: string;
    name: string;
    description?: string;
    upcCode?: string;
    warehouseId: string;
    warehouse?: Warehouse;
    quantity: number;
    minimumStock?: number;
    maximumStock?: number;
    reorderPoint?: number;
    location?: string;
    batchNumber?: string;
    expirationDate?: Date;
    isReserved: boolean;
    createdAt: Date;
    updatedAt: Date;
}
