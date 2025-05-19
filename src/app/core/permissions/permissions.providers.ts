import { Provider }           from '@angular/core';
import { RoutePermission }    from './permissions.service';
import { MODULE_PERMISSIONS } from './permissions.tokens';

export function provideModulePermissions(permissions: RoutePermission[]): Provider {
    return {
        provide : MODULE_PERMISSIONS,
        useValue: permissions,
        multi   : true
    };
}
