import { Provider }           from '@angular/core';
import { MODULE_PERMISSIONS } from './permissions.tokens';
import { RoutePermission } from '@core/permissions/models/route-permission';

export function provideModulePermissions(permissions: RoutePermission[]): Provider {
    return {
        provide : MODULE_PERMISSIONS,
        useValue: permissions,
        multi   : true
    };
}
