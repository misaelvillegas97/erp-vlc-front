/**
 * Representa los estados posibles de un conductor
 */
export enum DriverStatus {
    AVAILABLE = 'AVAILABLE',     // Conductor disponible para una sesión
    IN_SESSION = 'IN_SESSION',   // Conductor actualmente en una sesión
    UNAVAILABLE = 'UNAVAILABLE', // Conductor no disponible (enfermedad, vacaciones, etc.)
    INACTIVE = 'INACTIVE'        // Conductor inactivo (ya no trabaja en la empresa)
}

/**
 * Representa un tipo de licencia de conducir
 */
export enum LicenseType {
    A = 'A',   // Vehículos livianos
    B = 'B',   // Vehículos de transporte de pasajeros
    C = 'C',   // Vehículos de carga
    D = 'D',   // Vehículos especiales
    E = 'E'    // Vehículos pesados
}

/**
 * Modelo que representa un conductor en el sistema
 */
export interface Driver {
    id: string;
    name: string;
    lastName: string;
    documentId: string;         // Número de identificación personal
    licenseNumber: string;      // Número de licencia de conducir
    licenseType: LicenseType;   // Tipo de licencia
    licenseExpiryDate: string;  // Fecha de vencimiento de la licencia
    photoUrl?: string;          // URL de la foto del conductor
    status: DriverStatus;       // Estado actual del conductor
    currentSessionId?: string;  // ID de la sesión actual (si está en una)
}
