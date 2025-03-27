import { SupplierTypeEnum } from '@modules/admin/maintainers/suppliers/domain/enums/supplier-type.enum';

export interface Supplier {
    id: number;
    rut: string;
    businessName: string;
    fantasyName: string;
    type: SupplierTypeEnum;
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
