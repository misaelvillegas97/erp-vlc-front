/**
 * Enumeración de estaciones de servicio
 */
export enum FuelStation {
    COPEC = 'COPEC',
    ARAMCO = 'ARAMCO',
    SHELL = 'SHELL',
    YPF = 'YPF',
    TERPEL = 'TERPEL',
    OTHER = 'OTHER'
}

/**
 * Enumeración de tipos de combustible
 */
export enum FuelType {
    GASOLINE = 'GASOLINE',
    DIESEL = 'DIESEL',
    ELECTRIC = 'ELECTRIC',
    HYDROGEN = 'HYDROGEN',
    GAS = 'GAS',
    ETHANOL = 'ETHANOL',
    BIOFUEL = 'BIOFUEL',
    OTHER = 'OTHER'
}

/**
 * Modelo que representa un registro de carga de combustible
 */
export interface FuelRecord {
    id: string;
    vehicleId: string;           // ID del vehículo
    vehicle?: {              // Información del vehículo (para mostrar en listados)
        brand: string;
        model: string;
        licensePlate: string;
    };
    station: FuelStation;        // Estación de servicio
    fuelType: FuelType;          // Tipo de combustible
    date: string;                // Fecha de la carga de combustible
    userId: string;              // ID del usuario que realizó la carga
    userInfo?: {                 // Información del usuario (para mostrar en listados)
        name: string;
        email: string;
    };
    initialOdometer: number;     // Kilometraje inicial (desde)
    finalOdometer: number;       // Kilometraje final (hasta)
    liters: number;              // Cantidad de combustible en litros
    cost: number;                // Costo total en moneda local
    efficiency?: number;         // Eficiencia calculada (km/l)
    costPerKm?: number;          // Costo por kilómetro
    notes?: string;              // Notas adicionales
    createdAt: string;           // Fecha de creación del registro
    updatedAt?: string;          // Fecha de última actualización
}

/**
 * Interfaz para el resumen de consumo de combustible por vehículo
 */
export interface FuelConsumptionSummary {
    vehicleId: string;
    vehicle: {
        brand: string;
        model: string;
        licensePlate: string;
    };
    totalRecords: number;        // Total de registros
    totalLiters: number;         // Total de litros consumidos
    totalCost: number;           // Costo total
    totalDistance: number;       // Distancia total recorrida
    averageEfficiency: number;   // Eficiencia promedio (km/l)
    averageCostPerKm: number;    // Costo promedio por kilómetro
}

/**
 * Interfaz para el análisis de consumo de combustible por período
 */
export interface FuelConsumptionByPeriod {
    period: string;              // Período (fecha, mes, etc.)
    totalLiters: number;         // Total de litros consumidos
    totalCost: number;           // Costo total
    totalDistance: number;       // Distancia total recorrida
    averageEfficiency: number;   // Eficiencia promedio (km/l)
}
