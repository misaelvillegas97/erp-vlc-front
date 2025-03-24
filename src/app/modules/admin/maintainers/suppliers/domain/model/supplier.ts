export interface Supplier {
    id: number;
    rut: string;
    businessName: string;
    fantasyName: string;
    type: string;
    taxCategory?: string;
    siiCode?: string;
    economicActivity?: string;
    address?: string;
    commune?: string;
    city?: string;
    phone: string;
    email: string;
    contactPerson?: string;
    contactPhone?: string;
    isActive: boolean;
    notes?: string;
    tags?: string[];
    paymentTermDays?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
