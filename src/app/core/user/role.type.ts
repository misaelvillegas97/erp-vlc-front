export interface Role {
    id: number;
    name: string;
}

export enum RoleEnum {
    'admin' = 1,
    'user' = 2,
    'dispatcher' = 3,
    'driver' = 4,
    'accountant' = 5,
    'inventory_manager' = 6,
    'warehouse_staff' = 7,
    'quality_manager' = 8,
    'supervisor' = 9,
    'operator' = 10,
}

export const roleNames = {
    [RoleEnum.admin]     : 'admin',
    [RoleEnum.user]      : 'user',
    [RoleEnum.dispatcher]: 'dispatcher',
    [RoleEnum.driver]    : 'driver',
    [RoleEnum.accountant]: 'accountant',
    [RoleEnum.inventory_manager]: 'inventory_manager',
    [RoleEnum.warehouse_staff]: 'warehouse_staff',
    [RoleEnum.quality_manager]: 'quality_manager',
    [RoleEnum.supervisor]     : 'supervisor',
    [RoleEnum.operator]       : 'operator',
};
