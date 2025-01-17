import { OrderTypeEnum }   from '@modules/admin/administration/orders/pages/domain/enums/order-type.enum';
import { OrderStatusEnum } from '@modules/admin/administration/orders/pages/domain/enums/order-status.enum';
import { OrderProduct }    from '@modules/admin/administration/orders/pages/domain/model/order-product';

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
    products: OrderProduct[];
}
