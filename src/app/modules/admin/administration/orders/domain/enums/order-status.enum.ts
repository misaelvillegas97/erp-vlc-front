import { Color } from '@shared/components/badge/domain/model/badge.type';

export enum OrderStatusEnum {
    CREATED = 'CREATED',
    IN_PROGRESS = 'IN_PROGRESS',
    PENDING_DELIVERY = 'PENDING_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELED = 'CANCELED',
}

export const OrderStatusConfig: Record<OrderStatusEnum, Record<string, Color>> = {
    [OrderStatusEnum.CREATED]         : {color: 'yellow'},
    [OrderStatusEnum.IN_PROGRESS]     : {color: 'blue'},
    [OrderStatusEnum.PENDING_DELIVERY]: {color: 'yellow'},
    [OrderStatusEnum.DELIVERED]       : {color: 'green'},
    [OrderStatusEnum.CANCELED]        : {color: 'red'},
};
