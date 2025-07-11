import { RoutePermission } from '@core/permissions/models/route-permission';
import { RoleEnum }        from '@core/user/role.type';

export const dashboardsPermissions: RoutePermission[] = [
    {
        path        : 'dashboards',
        title       : 'Dashboards',
        description : 'Paneles de control',
        icon        : 'heroicons_outline:chart-bar',
        allowedRoles: [ RoleEnum.admin ],
        children    : [
            {
                path        : 'analytics',
                title       : 'Analytics',
                description : 'Análisis de datos',
                icon        : 'heroicons_outline:chart-pie',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'crypto',
                title       : 'Crypto',
                description : 'Criptomonedas',
                icon        : 'heroicons_outline:currency-dollar',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'finance',
                title       : 'Finance',
                description : 'Finanzas',
                icon        : 'heroicons_outline:banknotes',
                allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ]
            },
            {
                path        : 'project',
                title       : 'Project',
                description : 'Gestión de proyectos',
                icon        : 'heroicons_outline:clipboard-document-list',
                allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
            }
        ]
    }
];
