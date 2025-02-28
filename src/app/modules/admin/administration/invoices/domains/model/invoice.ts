import { InvoiceStatusEnum } from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';

export class Invoice {
    id: string;
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
    order: { id: string, orderNumber: string };
    createdAt: Date;
}
