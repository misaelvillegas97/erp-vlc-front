/**
 * Modelo que representa un registro de carga de combustible
 */
export interface FuelRecord {
    id: string;
    vehicleId: string;           // ID del vehículo
    vehicleInfo?: {              // Información del vehículo (para mostrar en listados)
        brand: string;
        model: string;
        licensePlate: string;
    };
    date: string;                // Fecha de la carga de combustible
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
    vehicleInfo: {
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
