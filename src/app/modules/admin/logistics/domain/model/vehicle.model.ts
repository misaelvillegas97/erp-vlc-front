/**
 * Representa los estados posibles de un vehículo
 */
export enum VehicleStatus {
    AVAILABLE = 'AVAILABLE',       // Vehículo disponible para uso
    IN_USE = 'IN_USE',            // Vehículo actualmente en uso
    MAINTENANCE = 'MAINTENANCE',  // Vehículo en mantenimiento
    REPAIR = 'REPAIR',            // Vehículo en reparación
    INACTIVE = 'INACTIVE'         // Vehículo inactivo (fuera de la flota)
}

/**
 * Representa los tipos de vehículos en el sistema
 */
export enum VehicleType {
    SEDAN = 'SEDAN',
    SUV = 'SUV',
    PICKUP = 'PICKUP',
    VAN = 'VAN',
    TRUCK = 'TRUCK',
    BUS = 'BUS',
    MOTORCYCLE = 'MOTORCYCLE',
    OTHER = 'OTHER'
}

/**
 * Modelo que representa un vehículo en el sistema
 */
export interface Vehicle {
    id: string;
    brand: string;                // Marca del vehículo
    model: string;                // Modelo del vehículo
    year: number;                 // Año de fabricación
    licensePlate: string;         // Placa/matrícula del vehículo
    vin: string;                  // Número de identificación del vehículo (VIN)
    type: VehicleType;            // Tipo de vehículo
    color: string;                // Color del vehículo
    fuelType: string;             // Tipo de combustible
    lastKnownOdometer: number;    // Último odómetro registrado en km
    tankCapacity: number;         // Capacidad del tanque en litros
    photoUrl?: string;            // URL de la foto del vehículo
    status: VehicleStatus;        // Estado actual del vehículo
    currentSessionId?: string;    // ID de la sesión actual (si está en uso)
    lastMaintenanceDate?: string; // Fecha del último mantenimiento
    nextMaintenanceDate?: string; // Fecha programada para el próximo mantenimiento
}
