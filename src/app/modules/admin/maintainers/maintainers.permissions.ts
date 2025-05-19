import { RoutePermission } from '@core/permissions/permissions.service';
import { RoleEnum }        from '@core/user/role.type';

export const maintainersPermissions: RoutePermission[] = [
    {
        path        : 'maintainers',
        title       : 'Mantenedores',
        description : 'Gestión de datos maestros',
        icon        : 'heroicons_outline:cog',
        allowedRoles: [ RoleEnum.admin ],
        children    : [
            {
                path        : 'clients',
                title       : 'Mantenedor de Clientes',
                description : 'Gestión de clientes',
                icon        : 'heroicons_outline:building-storefront',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'products',
                title       : 'Mantenedor de Productos',
                description : 'Gestión de productos',
                icon        : 'heroicons_outline:shopping-bag',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'users',
                title       : 'Mantenedor de Usuarios',
                description : 'Gestión de usuarios',
                icon        : 'heroicons_outline:users',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'suppliers',
                title       : 'Mantenedor de Proveedores',
                description : 'Gestión de proveedores',
                icon        : 'heroicons_outline:user-group',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'expense-types',
                title       : 'Mantenedor de Tipos de Gastos',
                description : 'Gestión de tipos de gastos',
                icon        : 'heroicons_outline:receipt-percent',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'vehicles',
                title       : 'Mantenedor de Vehículos',
                description : 'Gestión de vehículos',
                icon        : 'heroicons_outline:truck',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'feature-toggles',
                title       : 'Mantenedor de características',
                description : 'Gestión de características',
                icon        : 'heroicons_outline:adjustments-horizontal',
                allowedRoles: [ RoleEnum.admin ]
            }
        ]
    }
];
