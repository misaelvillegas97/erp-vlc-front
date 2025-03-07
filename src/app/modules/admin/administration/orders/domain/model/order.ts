import { OrderTypeEnum }   from '@modules/admin/administration/orders/domain/enums/order-type.enum';
import { OrderStatusEnum } from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { OrderProduct }    from '@modules/admin/administration/orders/domain/model/order-product';
import { Invoice }         from '@modules/admin/administration/invoices/domains/model/invoice';
import { Client }          from '@modules/admin/maintainers/clients/domain/model/client';

export interface Order {
    id?: string;
    orderNumber: string;
    businessName: string;
    type: OrderTypeEnum;
    status: OrderStatusEnum;
    deliveryLocation: string;
    deliveryDate: string;
    deliveredDate: string;
    emissionDate: string;
    observations?: { id: string, observation: string }[];
    invoiceNumber?: string;
    totalAmount?: number;
    products: OrderProduct[];
    invoices?: Invoice[];
    client: Client;
}
