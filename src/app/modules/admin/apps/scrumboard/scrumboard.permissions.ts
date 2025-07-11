import { RoutePermission } from '@core/permissions/models/route-permission';

export const SCRUMBOARD_FEATURE_KEY = 'scrumboard';
export const scrumboardPermissions: RoutePermission[] = [
    {
        path        : SCRUMBOARD_FEATURE_KEY,
        title       : 'Tablero Scrum',
        icon        : 'mat_outline:calendar_view_week',
        selectedIcon: 'mat_solid:calendar_view_week',
        allowedRoles: [],
    }
];
