import { OrderTypeEnum }   from '@modules/admin/administration/orders/domain/enums/order-type.enum';
import { OrderStatusEnum } from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { OrderProduct }    from '@modules/admin/administration/orders/domain/model/order-product';
import { Invoice }         from '@modules/admin/administration/orders/domain/model/invoice';

export interface Order {
    id?: string;
    orderNumber: string;
    businessName: string;
    type: OrderTypeEnum;
    status: OrderStatusEnum;
    deliveryLocation: string;
    deliveryDate: string;
    emissionDate: string;
    observations?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    products: OrderProduct[];
    invoice?: Invoice;
}
