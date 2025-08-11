import { RoutePermission } from '@core/permissions/models/route-permission';
import { RoleEnum }        from '@core/user/role.type';

export const TRACING_FEATURE_KEY = 'tracing';
export const tracingPermissions: RoutePermission[] = [
    {
        path        : TRACING_FEATURE_KEY,
        title       : 'Trazabilidad',
        description : 'Sistema de trazabilidad de procesos y flujos de trabajo',
        icon        : 'heroicons_outline:document-chart-bar',
        navOptions  : {type: 'collapsable'},
        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ],
        children    : [
            {
                path        : 'templates',
                title       : 'Plantillas de Flujo',
                description : 'Gestión de plantillas y versiones de flujos',
                icon        : 'heroicons_outline:document-duplicate',
                selectedIcon: 'heroicons_solid:document-duplicate',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ],
                children    : [
                    {
                        path        : '',
                        title       : 'Lista de Plantillas',
                        description : 'Consulta y gestiona las plantillas de flujo',
                        icon        : 'heroicons_outline:queue-list',
                        selectedIcon: 'heroicons_solid:queue-list',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    },
                    {
                        path        : 'new',
                        title       : 'Nueva Plantilla',
                        description : 'Crear una nueva plantilla de flujo',
                        icon        : 'heroicons_outline:plus',
                        selectedIcon: 'heroicons_solid:plus',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    }
                ]
            },
            {
                path        : 'execution',
                title       : 'Ejecución de Flujos',
                description : 'Ejecutar y monitorear instancias de flujo',
                icon        : 'heroicons_outline:play',
                selectedIcon: 'heroicons_solid:play',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ],
                children    : [
                    {
                        path        : 'instances',
                        title       : 'Instancias de Flujo',
                        description : 'Lista y gestión de instancias activas',
                        icon        : 'heroicons_outline:clipboard-document-list',
                        selectedIcon: 'heroicons_solid:clipboard-document-list',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ]
                    },
                    {
                        path         : 'instances/new',
                        title        : 'Nueva Instancia',
                        description  : 'Iniciar nueva instancia de flujo',
                        icon         : 'heroicons_outline:plus-circle',
                        selectedIcon : 'heroicons_solid:plus-circle',
                        allowedRoles : [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ],
                        hideInMainNav: true
                    }
                ]
            },
            {
                path        : 'reports',
                title       : 'Reportes y KPIs',
                description : 'Análisis de rendimiento y métricas',
                icon        : 'heroicons_outline:presentation-chart-line',
                selectedIcon: 'heroicons_solid:presentation-chart-line',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ],
                children    : [
                    {
                        path        : 'dashboard',
                        title       : 'Dashboard KPI',
                        description : 'Métricas principales y tendencias',
                        icon        : 'heroicons_outline:chart-pie',
                        selectedIcon: 'heroicons_solid:chart-pie',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ]
                    },
                    {
                        path        : 'bottlenecks',
                        title       : 'Análisis de Cuellos de Botella',
                        description : 'Identificación de puntos críticos',
                        icon        : 'heroicons_outline:funnel',
                        selectedIcon: 'heroicons_solid:funnel',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ]
                    },
                    {
                        path        : 'waste',
                        title       : 'Reportes de Mermas',
                        description : 'Análisis de desperdicios y eficiencia',
                        icon        : 'heroicons_outline:exclamation-triangle',
                        selectedIcon: 'heroicons_solid:exclamation-triangle',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ]
                    }
                ]
            },
            {
                path        : 'sync',
                title       : 'Sincronización',
                description : 'Estado y gestión de sincronización offline',
                icon        : 'heroicons_outline:arrow-path',
                selectedIcon: 'heroicons_solid:arrow-path',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ],
                children    : [
                    {
                        path        : 'status',
                        title       : 'Estado de Sincronización',
                        description : 'Monitoreo de salud de sincronización',
                        icon        : 'heroicons_outline:signal',
                        selectedIcon: 'heroicons_solid:signal',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ]
                    },
                    {
                        path        : 'conflicts',
                        title       : 'Resolución de Conflictos',
                        description : 'Gestión de conflictos de sincronización',
                        icon        : 'heroicons_outline:exclamation-circle',
                        selectedIcon: 'heroicons_solid:exclamation-circle',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    }
                ]
            }
        ]
    }
];
