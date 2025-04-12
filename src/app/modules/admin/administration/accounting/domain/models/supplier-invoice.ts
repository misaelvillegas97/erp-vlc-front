import { SupplierInvoiceStatusEnum } from '@modules/admin/maintainers/suppliers/domain/enums/invoice-status.enum';
import { Supplier }                  from '@modules/admin/maintainers/suppliers/domain/model/supplier';

export interface SupplierInvoice {
    id: number;
    invoiceNumber: string,
    supplier?: Supplier,
    supplierId?: string,
    expenseType?: any,
    expenseTypeId?: string,
    status: SupplierInvoiceStatusEnum,
    issueDate: string,
    dueDate: string,
    isExempt: boolean,
    netAmount: number,
    taxAmount: number,
    grossAmount: number,
    description: string,
    observations: string
}

export class SupplierInvoiceMapper {
    static toCreateDto(data: any): SupplierInvoice {
        console.log('toCreateDto', data);
        return {
            id           : data.id,
            supplierId   : data.supplierId,
            expenseTypeId: data.expenseTypeId,
            invoiceNumber: data.invoiceNumber,
            status       : data.status,
            issueDate    : data.issueDate,
            dueDate      : data.dueDate,
            isExempt     : data.isExempt,
            netAmount  : +data.netAmount,
            taxAmount  : +data.taxAmount,
            grossAmount: +data.grossAmount,
            description  : data.description,
            observations : data.observations
        };
    }
}
