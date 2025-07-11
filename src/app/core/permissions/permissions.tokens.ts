import { InjectionToken }  from '@angular/core';
import { RoutePermission } from '@core/permissions/models/route-permission';

export const MODULE_PERMISSIONS = new InjectionToken<RoutePermission[]>('ModulePermissions');
