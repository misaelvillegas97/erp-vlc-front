import { RoutePermission } from '@core/permissions/models/route-permission';
import { RoleEnum }        from '@core/user/role.type';

export const PROCEDURES_FEATURE_KEY = 'procedures';
export const proceduresPermissions: RoutePermission[] = [
    {
        path        : PROCEDURES_FEATURE_KEY,
        title       : 'Procedimientos',
        description : 'Gestión de procedimientos y documentación',
        icon        : 'heroicons_outline:document-text',
        navOptions  : {type: 'collapsable'},
        allowedRoles: [ RoleEnum.admin ],
        children    : [
            {
                path        : 'create',
                title       : 'Crear Procedimiento',
                description : 'Crear nuevos procedimientos',
                icon        : 'heroicons_outline:plus',
                selectedIcon: 'heroicons_solid:plus',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'manage',
                title       : 'Gestionar Procedimientos',
                description : 'Editar y eliminar procedimientos',
                icon        : 'heroicons_outline:cog-6-tooth',
                selectedIcon: 'heroicons_solid:cog-6-tooth',
                allowedRoles: [ RoleEnum.admin ]
            },
            {
                path        : 'versions',
                title       : 'Gestión de Versiones',
                description : 'Crear y editar versiones de procedimientos',
                icon        : 'heroicons_outline:document-duplicate',
                selectedIcon: 'heroicons_solid:document-duplicate',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_reviewer ],
                children    : [
                    {
                        path        : 'create',
                        title       : 'Crear Versión',
                        description : 'Crear nueva versión del procedimiento',
                        icon        : 'heroicons_outline:plus',
                        selectedIcon: 'heroicons_solid:plus',
                        allowedRoles: [ RoleEnum.admin ]
                    },
                    {
                        path        : 'edit',
                        title       : 'Editar Versión',
                        description : 'Editar versión del procedimiento',
                        icon        : 'heroicons_outline:pencil',
                        selectedIcon: 'heroicons_solid:pencil',
                        allowedRoles: [ RoleEnum.admin ]
                    },
                    {
                        path        : 'submit',
                        title       : 'Enviar a Revisión',
                        description : 'Enviar versión para revisión',
                        icon        : 'heroicons_outline:paper-airplane',
                        selectedIcon: 'heroicons_solid:paper-airplane',
                        allowedRoles: [ RoleEnum.admin ]
                    }
                ]
            },
            {
                path        : 'review',
                title       : 'Revisión de Procedimientos',
                description : 'Revisar y aprobar procedimientos',
                icon        : 'heroicons_outline:eye',
                selectedIcon: 'heroicons_solid:eye',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_reviewer ],
                children    : [
                    {
                        path        : 'pending',
                        title       : 'Pendientes de Revisión',
                        description : 'Procedimientos pendientes de revisión',
                        icon        : 'heroicons_outline:clock',
                        selectedIcon: 'heroicons_solid:clock',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_reviewer ]
                    },
                    {
                        path        : 'approve',
                        title       : 'Aprobar Procedimientos',
                        description : 'Aprobar procedimientos revisados',
                        icon        : 'heroicons_outline:check-circle',
                        selectedIcon: 'heroicons_solid:check-circle',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_reviewer ]
                    },
                    {
                        path        : 'request-changes',
                        title       : 'Solicitar Cambios',
                        description : 'Solicitar cambios en procedimientos',
                        icon        : 'heroicons_outline:exclamation-triangle',
                        selectedIcon: 'heroicons_solid:exclamation-triangle',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_reviewer ]
                    }
                ]
            },
            {
                path        : 'publication',
                title       : 'Publicación',
                description : 'Gestionar publicación de procedimientos',
                icon        : 'heroicons_outline:megaphone',
                selectedIcon: 'heroicons_solid:megaphone',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_publisher ],
                children    : [
                    {
                        path        : 'publish',
                        title       : 'Publicar Procedimientos',
                        description : 'Publicar procedimientos aprobados',
                        icon        : 'heroicons_outline:globe-alt',
                        selectedIcon: 'heroicons_solid:globe-alt',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_publisher ]
                    },
                    {
                        path        : 'manage',
                        title       : 'Gestionar Publicaciones',
                        description : 'Gestionar procedimientos publicados',
                        icon        : 'heroicons_outline:cog-6-tooth',
                        selectedIcon: 'heroicons_solid:cog-6-tooth',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_publisher ]
                    },
                    {
                        path        : 'evidence',
                        title       : 'Cargar Evidencias',
                        description : 'Cargar evidencias de publicación',
                        icon        : 'heroicons_outline:photo',
                        selectedIcon: 'heroicons_solid:photo',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_publisher ]
                    }
                ]
            },
            {
                path        : 'publications',
                title       : 'Publicaciones',
                description : 'Ver y reconocer publicaciones',
                icon        : 'heroicons_outline:document-check',
                selectedIcon: 'heroicons_solid:document-check',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_publisher ],
                children    : [
                    {
                        path        : 'view',
                        title       : 'Ver Publicaciones',
                        description : 'Ver procedimientos publicados',
                        icon        : 'heroicons_outline:eye',
                        selectedIcon: 'heroicons_solid:eye',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.procedure_publisher ]
                    },
                    {
                        path        : 'acknowledge',
                        title       : 'Reconocer Publicaciones',
                        description : 'Reconocer lectura de publicaciones',
                        icon        : 'heroicons_outline:hand-thumb-up',
                        selectedIcon: 'heroicons_solid:hand-thumb-up',
                        allowedRoles: [ RoleEnum.admin ]
                    }
                ]
            },
            {
                path        : 'reports',
                title       : 'Reportes y Auditoría',
                description : 'Reportes y auditoría de procedimientos',
                icon        : 'heroicons_outline:document-chart-bar',
                selectedIcon: 'heroicons_solid:document-chart-bar',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin ],
                children    : [
                    {
                        path        : 'audit',
                        title       : 'Auditoría',
                        description : 'Ver auditoría de procedimientos',
                        icon        : 'heroicons_outline:shield-check',
                        selectedIcon: 'heroicons_solid:shield-check',
                        allowedRoles: [ RoleEnum.admin ]
                    },
                    {
                        path        : 'export',
                        title       : 'Exportar Reportes',
                        description : 'Exportar reportes de procedimientos',
                        icon        : 'heroicons_outline:arrow-down-tray',
                        selectedIcon: 'heroicons_solid:arrow-down-tray',
                        allowedRoles: [ RoleEnum.admin ]
                    },
                    {
                        path        : 'econsents',
                        title       : 'Gestionar E-Consents',
                        description : 'Gestionar consentimientos electrónicos',
                        icon        : 'heroicons_outline:document-check',
                        selectedIcon: 'heroicons_solid:document-check',
                        allowedRoles: [ RoleEnum.admin ]
                    }
                ]
            }
        ]
    }
];
