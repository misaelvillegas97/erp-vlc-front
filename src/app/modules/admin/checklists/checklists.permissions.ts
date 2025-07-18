import { RoutePermission } from '@core/permissions/models/route-permission';
import { RoleEnum }        from '@core/user/role.type';

export const CHECKLISTS_FEATURE_KEY = 'checklists';
export const checklistsPermissions: RoutePermission[] = [
    {
        path        : CHECKLISTS_FEATURE_KEY,
        title       : 'Checklists',
        description : 'Gestión de checklists y control de calidad',
        icon        : 'heroicons_outline:clipboard-document-check',
        navOptions  : {type: 'collapsable'},
        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ],
        children    : [
            {
                path        : 'dashboard',
                title       : 'Dashboard de Checklists',
                description : 'Visualiza el estado general de los checklists',
                icon        : 'heroicons_outline:chart-bar',
                selectedIcon: 'heroicons_solid:chart-bar',
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ]
            },
            {
                path        : 'groups',
                title       : 'Grupos de Checklists',
                description : 'Gestión de grupos de checklists',
                icon        : 'heroicons_outline:folder',
                selectedIcon: 'heroicons_solid:folder',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ],
                children    : [
                    {
                        path        : 'list',
                        title       : 'Lista de Grupos',
                        description : 'Consulta y gestiona los grupos de checklists',
                        icon        : 'heroicons_outline:queue-list',
                        selectedIcon: 'heroicons_solid:queue-list',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    },
                    {
                        path        : 'new',
                        title       : 'Crear Grupo',
                        description : 'Crear un nuevo grupo de checklists',
                        icon        : 'heroicons_outline:plus',
                        selectedIcon: 'heroicons_solid:plus',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    }
                ]
            },
            {
                path        : 'templates',
                title       : 'Plantillas de Checklists',
                description : 'Gestión de plantillas de checklists',
                icon        : 'heroicons_outline:document-duplicate',
                selectedIcon: 'heroicons_solid:document-duplicate',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ],
                children    : [
                    {
                        path        : 'list',
                        title       : 'Lista de Plantillas',
                        description : 'Consulta y gestiona las plantillas de checklists',
                        icon        : 'heroicons_outline:queue-list',
                        selectedIcon: 'heroicons_solid:queue-list',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    },
                    {
                        path        : 'new',
                        title       : 'Crear Plantilla',
                        description : 'Crear una nueva plantilla de checklist',
                        icon        : 'heroicons_outline:plus',
                        selectedIcon: 'heroicons_solid:plus',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    }
                ]
            },
            {
                path        : 'execute',
                title       : 'Ejecutar Checklists',
                description : 'Ejecutar y completar checklists',
                icon        : 'heroicons_outline:play',
                selectedIcon: 'heroicons_solid:play',
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ]
            },
            {
                path        : 'reports',
                title       : 'Reportes de Checklists',
                description : 'Visualización y análisis de resultados',
                icon        : 'heroicons_outline:document-chart-bar',
                selectedIcon: 'heroicons_solid:document-chart-bar',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ],
                children    : [
                    {
                        path        : 'executions',
                        title       : 'Ejecuciones',
                        description : 'Reportes de ejecuciones de checklists',
                        icon        : 'heroicons_outline:clipboard-document-list',
                        selectedIcon: 'heroicons_solid:clipboard-document-list',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor ]
                    },
                    {
                        path        : 'analytics',
                        title       : 'Análisis y Métricas',
                        description : 'Análisis avanzado y métricas de calidad',
                        icon        : 'heroicons_outline:chart-pie',
                        selectedIcon: 'heroicons_solid:chart-pie',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.quality_manager ]
                    }
                ]
            }
        ]
    }
];
