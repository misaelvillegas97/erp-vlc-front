import { Driver }  from '@modules/admin/logistics/domain/model/driver.model';
import { Vehicle } from '@modules/admin/logistics/domain/model/vehicle.model';

/**
 * Representa una coordenada geográfica con datos adicionales
 */
export interface GeoLocation {
    latitude: number;     // Latitud en grados decimales
    longitude: number;    // Longitud en grados decimales
    accuracy: number;     // Precisión en metros
    timestamp?: number;   // Timestamp de cuando se obtuvo la ubicación
}

export interface GpsGeneric {
    latitude: number;         // Latitud en grados decimales
    longitude: number;         // Longitud en grados decimales
    timestamp: number;   // Timestamp de cuando se obtuvo la ubicación
    speed?: number;     // Velocidad en km/h
    totalDistance?: number; // Distancia total recorrida en km
    lastLocations?: { lat: number, lng: number }[]; // Últimas ubicaciones registradas
}

/**
 * Estados posibles para una sesión de vehículo
 */
export enum SessionStatus {
    ACTIVE = 'ACTIVE',       // Sesión actualmente en curso
    COMPLETED = 'COMPLETED', // Sesión finalizada normalmente
    CANCELLED = 'CANCELLED', // Sesión cancelada
    EXPIRED = 'EXPIRED'      // Sesión expirada (no se finalizó correctamente)
}

/**
 * Modelo base para una sesión de vehículo
 */
export interface VehicleSession {
    id: string;                     // ID único de la sesión
    driverId: string;               // ID del conductor
    vehicleId: string;              // ID del vehículo
    status: SessionStatus;          // Estado de la sesión
    startTime: Date;         // Fecha y hora de inicio
    endTime?: Date;          // Fecha y hora de finalización
    initialOdometer: number;        // Lectura del odómetro al inicio
    finalOdometer?: number;         // Lectura del odómetro al finalizar
    initialLocation: GeoLocation;   // Ubicación inicial
    finalLocation?: GeoLocation;    // Ubicación final
    currentLocation?: GeoLocation;  // Ubicación actual (para sesiones activas)
    observations?: string;          // Observaciones al inicio
    incidents?: string;             // Incidentes reportados al finalizar
    photoUrls?: string[];           // URLs de fotos tomadas durante la sesión
    purpose?: string;               // Propósito de la sesión
    notes?: string;                 // Notas adicionales
    locations?: GeoLocation[]; // Historial de ubicaciones
    gps?: GpsGeneric[];              // Datos GPS genéricos
    driver?: Driver;
    vehicle?: Vehicle;
}

/**
 * DTO para crear una nueva sesión de vehículo
 */
export interface CreateSessionDto {
    driverId: string;               // ID del conductor
    vehicleId: string;              // ID del vehículo
    initialOdometer: number;        // Lectura del odómetro al inicio
    initialLocation: GeoLocation;   // Ubicación inicial
    observations?: string;          // Observaciones al inicio
}

// Alias para compatibilidad con el código existente
export type NewVehicleSessionDto = CreateSessionDto;

/**
 * DTO para finalizar una sesión de vehículo
 */
export interface FinishSessionDto {
    finalOdometer: number;          // Lectura del odómetro al finalizar
    finalLocation: GeoLocation;     // Ubicación final
    incidents?: string;             // Incidentes reportados al finalizar
    photos?: File[];                // Fotos del vehículo al finalizar
}

/**
 * Vista ampliada de sesión activa con datos de conductor y vehículo
 */
export interface ActiveSessionView {
    id: string;                    // ID de la sesión
    startTimestamp: string;        // Fecha y hora de inicio
    duration: number;              // Duración en minutos
    initialOdometer: number;       // Lectura del odómetro al inicio
    driver: {                      // Datos del conductor
        id: string;
        firstName: string;
        lastName: string;
        documentId: string;
        photoUrl?: string;
    };
    vehicle: {                     // Datos del vehículo
        id: string;
        brand: string;
        model: string;
        licensePlate: string;
        photoUrl?: string;
    };
    currentLocation?: GeoLocation; // Ubicación actual
    status: 'normal' | 'warning' | 'alert'; // Estado por duración
}
