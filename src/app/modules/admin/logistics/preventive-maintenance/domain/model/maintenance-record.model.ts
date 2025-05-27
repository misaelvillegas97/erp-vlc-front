import { Vehicle } from '@modules/admin/maintainers/vehicles/domain/model/vehicle';

/**
 * Tipos de mantenimiento
 */
export enum MaintenanceType {
    PREVENTIVE = 'PREVENTIVE',     // Mantenimiento preventivo
    CORRECTIVE = 'CORRECTIVE',     // Mantenimiento correctivo
    SCHEDULED = 'SCHEDULED',       // Mantenimiento programado
    EMERGENCY = 'EMERGENCY'        // Mantenimiento de emergencia
}

/**
 * Estados de mantenimiento
 */
export enum MaintenanceStatus {
    PENDING = 'PENDING',           // Pendiente
    IN_PROGRESS = 'IN_PROGRESS',   // En progreso
    COMPLETED = 'COMPLETED',       // Completado
    CANCELED = 'CANCELED'        // Cancelado
}

/**
 * Modelo que representa un registro de mantenimiento
 */
export interface MaintenanceRecord {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    date: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    odometer: number;
    description?: string;
    cost: number;
    provider?: string;
    partsReplaced?: { part: string; cost: number; quantity: number }[];
    documents?: { id: string; name: string; url: string }[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
