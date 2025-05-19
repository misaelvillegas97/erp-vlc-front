import { RoutePermission } from '@core/permissions/permissions.service';
import { RoleEnum }        from '@core/user/role.type';

export const FLEET_MANAGEMENT_KEY = 'fleet-management';
export const fleetManagementPermissions: RoutePermission[] = [
    {
        path        : FLEET_MANAGEMENT_KEY,
        title       : 'Gestión de flota',
        description : 'Gestión de flota y vehículos',
        icon        : 'heroicons_outline:truck',
        navOptions  : {type: 'group'},
        allowedRoles: [ RoleEnum.driver ],
        children    : [
            {
                path        : 'fleet-control',
                title       : 'Control de Flota',
                description : 'Inicia tu ruta y registra tus sesiones de conducción',
                icon        : 'heroicons_outline:truck',
                selectedIcon: 'heroicons_solid:truck',
                allowedRoles: [ RoleEnum.driver, RoleEnum.dispatcher ]
            },
            {
                path        : 'active-sessions',
                title       : 'Sesiones Activas',
                description : 'Consulta las sesiones activas de los vehículos',
                icon        : 'heroicons_outline:user-circle',
                selectedIcon: 'heroicons_solid:user-circle',
                allowedRoles: [ RoleEnum.driver, RoleEnum.dispatcher ]
            },
            {
                path        : 'driving-mode',
                title       : 'Modo Conducción',
                description : 'Una vista de mapa para monitorear la sesión actual',
                icon        : 'heroicons_outline:map',
                selectedIcon: 'heroicons_solid:map',
                allowedRoles: [ RoleEnum.driver ]
            },
            {
                path        : 'history',
                title       : 'Historial de Sesiones',
                description : 'Consulta el historial de sesiones de los vehículos',
                icon        : 'heroicons_outline:clock',
                selectedIcon: 'heroicons_solid:clock',
                allowedRoles: [ RoleEnum.admin ]
            }
        ]
    }
];
