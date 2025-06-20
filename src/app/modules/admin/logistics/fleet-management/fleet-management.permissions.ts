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
            },
            {
                path        : 'dashboards',
                title       : 'Dashboards',
                description : 'Consulta los dashboards de la flota',
                icon        : 'heroicons_outline:chart-bar',
                selectedIcon: 'heroicons_solid:chart-bar',
                allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ],
                children    : [
                    {
                        path        : 'active-sessions',
                        title       : 'Sesiones Activas',
                        description : 'Consulta las sesiones activas de los vehículos',
                        icon        : 'heroicons_outline:user-circle',
                        selectedIcon: 'heroicons_solid:user-circle',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    },
                    {
                        path        : 'historical-analysis',
                        title       : 'Análisis Histórico',
                        description : 'Consulta el análisis histórico de la flota',
                        icon        : 'mat_outline:bar_chart',
                        selectedIcon: 'mat_solid:bar_chart',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    },
                    {
                        path        : 'driver-performance',
                        title       : 'Rendimiento del Conductor',
                        description : 'Consulta el rendimiento de los conductores',
                        icon        : 'heroicons_outline:user-group',
                        selectedIcon: 'heroicons_solid:user-group',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    },
                    {
                        path        : 'vehicle-utilization',
                        title       : 'Utilización de Vehículos',
                        description : 'Consulta la utilización de los vehículos',
                        icon        : 'mat_outline:directions_car',
                        selectedIcon: 'mat_solid:directions_car',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    },
                    {
                        path        : 'geographical-analysis',
                        title       : 'Análisis Geográfico',
                        description : 'Consulta el análisis geográfico de la flota',
                        icon        : 'heroicons_outline:globe-alt',
                        selectedIcon: 'heroicons_solid:globe-alt',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    },
                    {
                        path        : 'compliance-safety',
                        title       : 'Cumplimiento y Seguridad',
                        description : 'Consulta el cumplimiento y seguridad de la flota',
                        icon        : 'heroicons_outline:shield-check',
                        selectedIcon: 'heroicons_solid:shield-check',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    }
                ]
            },
        ]
    }
];
