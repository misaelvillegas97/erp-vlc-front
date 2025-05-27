/**
 * Tipos de alertas de mantenimiento
 */
export enum AlertType {
    ODOMETER = 'ODOMETER',           // Alerta basada en el odómetro
    DATE = 'DATE',                   // Alerta basada en fecha
    INSPECTION = 'INSPECTION',       // Alerta de inspección técnica
    INSURANCE = 'INSURANCE',         // Alerta de seguro
    CIRCULATION_PERMIT = 'CIRCULATION_PERMIT' // Alerta de permiso de circulación
}

/**
 * Estados posibles de una alerta
 */
export enum AlertStatus {
    ACTIVE = 'ACTIVE',               // Alerta activa
    ACKNOWLEDGED = 'ACKNOWLEDGED',   // Alerta reconocida
    RESOLVED = 'RESOLVED',           // Alerta resuelta
    DISMISSED = 'DISMISSED'          // Alerta descartada
}

/**
 * Modelo que representa una alerta de mantenimiento
 */
export interface MaintenanceAlert {
    id: string;
    vehicleId: string;
    type: AlertType;
    status: AlertStatus;
    title: string;
    description: string;
    dueDate?: string;
    thresholdKm?: number;
    notificationSent: boolean;
    priority?: number; // 1-5, donde 5 es la prioridad más alta
    maintenanceRecordId?: string;
    createdAt: string;
    updatedAt: string;
}
