import { RoutePermission } from '@core/permissions/models/route-permission';
import { RoleEnum }        from '@core/user/role.type';

export const PREVENTIVE_MAINTENANCE_KEY = 'preventive-maintenance';
export const preventiveMaintenancePermissions: RoutePermission[] = [
    {
        path        : PREVENTIVE_MAINTENANCE_KEY,
        title       : 'Mantenimiento Preventivo',
        description : 'Gestión de mantenimiento preventivo de vehículos',
        icon        : 'heroicons_outline:wrench',
        navOptions  : {type: 'group'},
        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ],
        children    : [
            {
                path        : 'dashboard',
                title       : 'Dashboard',
                description : 'Resumen de mantenimientos y alertas',
                icon        : 'heroicons_outline:chart-bar',
                selectedIcon: 'heroicons_solid:chart-bar',
                allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
            },
            // {
            //     path        : 'alerts',
            //     title       : 'Alertas',
            //     description : 'Gestión de alertas de mantenimiento',
            //     icon        : 'heroicons_outline:bell',
            //     selectedIcon: 'heroicons_solid:bell',
            //     allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
            // },
            {
                path        : 'list',
                title       : 'Registros de Mantenimiento',
                description : 'Listado de mantenimientos realizados y programados',
                icon        : 'heroicons_outline:table-cells',
                selectedIcon: 'heroicons_solid:table-cells',
                allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
            },
            {
                path        : 'documents',
                title       : 'Documentos de Vehículos',
                description : 'Gestión de documentos y fechas de vencimiento',
                icon        : 'heroicons_outline:document-text',
                selectedIcon: 'heroicons_solid:document-text',
                allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
            }
        ]
    }
];
