import { RoutePermission } from '@core/permissions/models/route-permission';
import { RoleEnum }        from '@core/user/role.type';

export const homePermissions: RoutePermission[] = [
    {
        path        : 'home',
        title       : 'Home',
        icon        : 'heroicons_outline:home',
        selectedIcon: 'heroicons_solid:home',
        allowedRoles: [ RoleEnum.admin, RoleEnum.driver, RoleEnum.dispatcher, RoleEnum.accountant ]
    }
];
