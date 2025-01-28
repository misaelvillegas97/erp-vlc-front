import { Selector } from '@shared/selectors/model/selector';

export enum OrderTypeEnum {
    PURCHASE_ORDER = 'PURCHASE_ORDER',
    RETURN_ORDER = 'RETURN_ORDER',
}

export const OrderTypeEnumValues: Selector[] = [
    {value: OrderTypeEnum.PURCHASE_ORDER, label: 'orders.order-type.purchase-order'},
    {value: OrderTypeEnum.RETURN_ORDER, label: 'orders.order-type.return-order'},
];
