import { InvoiceStatusEnum } from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';

export class Invoice {
    invoiceNumber: number;
    status: InvoiceStatusEnum;
    observations?: string;
    emissionDate: string;
    dueDate?: string;
    paymentDate?: string;
    netAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    deliveryAssignment?: any;
    createdAt: Date;
}
