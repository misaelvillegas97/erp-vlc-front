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
}

export const roleNames = {
    [RoleEnum.admin]     : 'admin',
    [RoleEnum.user]      : 'user',
    [RoleEnum.dispatcher]: 'dispatcher',
    [RoleEnum.driver]    : 'driver',
    [RoleEnum.accountant]: 'accountant',
};
