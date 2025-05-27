import { MaintenanceStatus, MaintenanceType } from './maintenance-record.model';

/**
 * DTO para estadísticas de mantenimiento
 */
export interface MaintenanceStatisticsDto {
    /**
     * Número de registros de mantenimiento pendientes
     */
    pendingMaintenanceCount: number;

    /**
     * Número de registros de mantenimiento completados
     */
    completedMaintenanceCount: number;

    /**
     * Número de alertas activas
     */
    activeAlertsCount: number;

    /**
     * Número de registros de mantenimiento próximos
     */
    upcomingMaintenanceCount: number;

    /**
     * Registros de mantenimiento agrupados por estado
     */
    maintenanceByStatus: { status: MaintenanceStatus; count: number }[];

    /**
     * Registros de mantenimiento agrupados por mes
     */
    maintenanceByMonth: { month: string; count: number }[];

    /**
     * Registros de mantenimiento agrupados por tipo
     */
    maintenanceByType: { type: MaintenanceType; count: number }[];

    /**
     * Registros de mantenimiento próximos agrupados por vehículo y mes
     */
    upcomingMaintenanceByVehicle: { month: string; vehicleCount: number }[];

    /**
     * Lista de alertas activas
     */
    activeAlerts: any[];
}
