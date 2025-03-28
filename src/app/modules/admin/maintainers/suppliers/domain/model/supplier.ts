import { SupplierTypeEnum } from '@modules/admin/maintainers/suppliers/domain/enums/supplier-type.enum';

export interface Supplier {
    id?: number;
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

export class SupplierMapper {
    static fromForm(form: any): Supplier {
        return {
            rut             : form.rut,
            businessName    : form.businessName,
            fantasyName     : form.fantasyName,
            type            : form.type,
            economicActivity: form.economicActivity,
            address         : form.address,
            commune         : form.commune,
            city            : form.city,
            phone           : form.phone,
            email           : form.email,
            contactPerson   : form.contactPerson,
            contactPhone    : form.contactPhone,
            isActive        : form.isActive,
            notes           : form.notes,
            tags            : form.tags,
            paymentTermDays : form.paymentTermDays,
        };
    }
}
