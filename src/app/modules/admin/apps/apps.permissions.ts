import { RoutePermission }       from '@core/permissions/models/route-permission';
import { scrumboardPermissions } from '@modules/admin/apps/scrumboard/scrumboard.permissions';

export const APPS_FEATURE_KEY = 'apps';
export const appsPermissions: RoutePermission[] = [
    {
        path        : APPS_FEATURE_KEY,
        title       : 'Aplicaciones',
        description : 'Aplicaciones de la plataforma',
        icon        : 'heroicons_outline:squares-2x2',
        selectedIcon: 'heroicons_solid:squares-2x2',
        allowedRoles: [],
        children    : [
            ...scrumboardPermissions,
        ]
    }
] satisfies RoutePermission[];
