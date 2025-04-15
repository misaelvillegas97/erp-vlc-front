export interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    purchaseDate: string;
    documents?: VehicleDocument[];
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
}

export interface VehicleDocument {
    id: string;
    name: string;
    type: VehicleDocumentType;
    fileUrl: string;
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