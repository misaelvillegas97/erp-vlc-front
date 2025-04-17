// import { Customer } from '@modules/admin/maintainers/customers/domain/model/customer';

export enum CustomerInvoiceStatusEnum {
    DRAFT = 'DRAFT',
    ISSUED = 'ISSUED',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED'
}

export interface CustomerInvoice {
    id: number;
    invoiceNumber: string;
    customer?: any; //Customer;
    customerId?: string;
    status: CustomerInvoiceStatusEnum;
    issueDate: string;
    dueDate: string;
    isExempt: boolean;
    netAmount: number;
    taxAmount: number;
    grossAmount: number;
    description?: string;
    observations?: string;
}

export class CustomerInvoiceMapper {
    static toCreateDto(data: any): CustomerInvoice {
        return {
            id           : data.id,
            customerId   : data.customerId,
            invoiceNumber: data.invoiceNumber,
            status       : data.status,
            issueDate    : data.issueDate,
            dueDate      : data.dueDate,
            isExempt     : data.isExempt,
            netAmount    : +data.netAmount,
            taxAmount    : +data.taxAmount,
            grossAmount  : +data.grossAmount,
            description  : data.description,
            observations : data.observations
        };
    }
}
