import { InvoiceStatusEnum } from '@modules/admin/administration/orders/domain/enums/invoice-status.enum';

export class Invoice {
    invoiceNumber: number;
    status: InvoiceStatusEnum;
    observations?: string;
    emissionDate: string;
    netAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    createdAt: Date;
}
