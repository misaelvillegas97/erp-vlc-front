import { Selector } from '@shared/selectors/model/selector';

export enum OrderStatusEnum {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    INVOICED = 'INVOICED',
    DELIVERED = 'DELIVERED',
    CANCELED = 'CANCELED',
}

export const OrderStatusEnumValues: Selector[] = [
    {value: OrderStatusEnum.PENDING, label: 'Pendiente',},
    {value: OrderStatusEnum.IN_PROGRESS, label: 'En progreso',},
    {value: OrderStatusEnum.INVOICED, label: 'Facturado',},
    {value: OrderStatusEnum.DELIVERED, label: 'Entregado',},
    {value: OrderStatusEnum.CANCELED, label: 'Cancelado',}
];
