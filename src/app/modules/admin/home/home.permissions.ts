import { RoutePermission } from '@core/permissions/permissions.service';
import { RoleEnum }        from '@core/user/role.type';

export const homePermissions: RoutePermission[] = [
    {
        path        : 'home',
        title       : 'Home',
        icon        : 'heroicons_outline:home',
        allowedRoles: [ RoleEnum.admin, RoleEnum.driver, RoleEnum.dispatcher, RoleEnum.accountant ]
    }
];
