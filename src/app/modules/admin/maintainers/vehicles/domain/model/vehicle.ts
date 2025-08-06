export interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    purchaseDate: string;
    displayName?: string;
    // New fields from DTO
    vin?: string;
    type?: VehicleType;
    color?: string;
    fuelType?: FuelType;
    tankCapacity?: number;
    lastKnownOdometer: number;
    lastRefuelingOdometer: number;
    status?: VehicleStatus;
    departmentId?: string;
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    nextMaintenanceKm?: number;
    insuranceNumber?: string;
    insuranceExpiry?: string;
    technicalInspectionExpiry?: string;
    notes?: string;
    photo?: string;
    additionalPhotos?: string[];
    // Existing fields
    documents?: VehicleDocument[];
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
}

export interface VehicleDocument {
    id: string;
    name: string;
    type: VehicleDocumentType;
    file: string;
    expirationDate?: string;
    createdAt: string;
}

export enum VehicleDocumentType {
    CIRCULATION_PERMIT = 'CIRCULATION_PERMIT',  // Permiso de circulación
    SOAP = 'SOAP',  // Seguro obligatorio
    TECHNICAL_REVISION = 'TECHNICAL_REVISION',  // Revisión técnica
    INSURANCE = 'INSURANCE',  // Seguro adicional
    OTHER = 'OTHER'
}

// New enums from DTO
export enum VehicleType {
    SEDAN = 'SEDAN',
    SUV = 'SUV',
    TRUCK = 'TRUCK',
    VAN = 'VAN',
    PICKUP = 'PICKUP',
    MOTORCYCLE = 'MOTORCYCLE',
    BUS = 'BUS',
    OTHER = 'OTHER'
}

export enum FuelType {
    GASOLINE = 'GASOLINE',
    DIESEL = 'DIESEL',
    ELECTRIC = 'ELECTRIC',
    HYBRID = 'HYBRID',
    LPG = 'LPG',
    CNG = 'CNG',
    OTHER = 'OTHER'
}

export enum VehicleStatus {
    AVAILABLE = 'AVAILABLE',
    IN_USE = 'IN_USE',
    IN_MAINTENANCE = 'IN_MAINTENANCE',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}
