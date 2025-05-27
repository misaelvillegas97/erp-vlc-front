import { RoutePermission } from '@core/permissions/permissions.service';
import { RoleEnum }        from '@core/user/role.type';

export const FUEL_MANAGEMENT_KEY = 'fuel-management';
export const fuelManagementPermissions: RoutePermission[] = [
    {
        path        : FUEL_MANAGEMENT_KEY,
        title       : 'Gestión de Combustible',
        description : 'Gestión de combustible y consumo',
        icon        : 'heroicons_outline:fire',
        selectedIcon: 'heroicons_solid:fire',
        navOptions  : {
            type: 'group'
        },
        allowedRoles: [ RoleEnum.driver, RoleEnum.dispatcher ],
        children    : [
            {
                path        : 'analysis',
                title: 'Análisis de Consumo',
                description : 'Consulta el análisis de consumo de combustible',
                icon        : 'heroicons_outline:chart-bar',
                selectedIcon: 'heroicons_solid:chart-bar',
                allowedRoles: [ RoleEnum.admin ],
            },
            {
                path        : 'list',
                title: 'Listado de Registros',
                description : 'Consulta el listado de registros de combustible',
                icon        : 'heroicons_outline:table-cells',
                selectedIcon: 'heroicons_solid:table-cells',
                allowedRoles: [ RoleEnum.driver, RoleEnum.dispatcher ]
            },
            {
                path        : 'register',
                title: 'Crear Registro',
                description : 'Registra el consumo de combustible',
                icon        : 'heroicons_outline:plus-circle',
                selectedIcon: 'heroicons_solid:plus-circle',
                navOptions  : {hidden: () => true},
                allowedRoles: [ RoleEnum.driver, RoleEnum.dispatcher ]
            }
        ]
    }
] satisfies RoutePermission[];
