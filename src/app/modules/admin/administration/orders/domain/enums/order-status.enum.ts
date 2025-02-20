import { Selector } from '@shared/selectors/model/selector';

export enum OrderStatusEnum {
    CREATED = 'CREATED',
    IN_PROGRESS = 'IN_PROGRESS',
    PENDING_DELIVERY = 'PENDING_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELED = 'CANCELED',
}

export const OrderStatusEnumValues: Selector[] = [
    {value: OrderStatusEnum.CREATED, label: 'Creada'},
    {value: OrderStatusEnum.IN_PROGRESS, label: 'En progreso'},
    {value: OrderStatusEnum.PENDING_DELIVERY, label: 'Pendiente de entrega'},
    {value: OrderStatusEnum.DELIVERED, label: 'Entregado'},
    {value: OrderStatusEnum.CANCELED, label: 'Cancelado'}
];
