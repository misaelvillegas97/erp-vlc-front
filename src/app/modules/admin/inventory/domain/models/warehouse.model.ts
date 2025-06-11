import { InventoryItem } from './inventory-item.model';

export interface Warehouse {
    id: string;
    name: string;
    description?: string;
    address: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    isActive: boolean;
    inventoryItems?: InventoryItem[];
}
