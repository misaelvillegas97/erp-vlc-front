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
    [RoleEnum.admin]            : 'Administrador',
    [RoleEnum.user]             : 'Usuario',
    [RoleEnum.dispatcher]       : 'Despachador',
    [RoleEnum.driver]           : 'Conductor',
    [RoleEnum.accountant]       : 'Contador',
    [RoleEnum.inventory_manager]: 'Administrador de inventario',
    [RoleEnum.warehouse_staff]  : 'Personal de almacén',
    [RoleEnum.quality_manager]  : 'Gerente de calidad',
    [RoleEnum.supervisor]       : 'Supervisor',
    [RoleEnum.operator]         : 'Operador',
};
