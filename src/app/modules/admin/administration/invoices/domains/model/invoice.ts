import { InvoiceStatusEnum } from '@modules/admin/administration/invoices/domains/enums/invoice-status.enum';
import { Payment }           from '@modules/admin/administration/invoices/domains/model/payment';
import { OrderProduct }      from '@modules/admin/administration/orders/domain/model/order-product';

export class Invoice {
    id: string;
    invoiceNumber: number;
    status: InvoiceStatusEnum;
    isPaid: boolean;
    isActive: boolean;
    observations?: string;
    emissionDate: string;
    dueDate?: string;
    paymentDate?: string;
    netAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    deliveryAssignment?: any;
    order: { id: string, orderNumber: string, products: OrderProduct[] };
    createdAt: Date;
    payments?: Payment[];
}
