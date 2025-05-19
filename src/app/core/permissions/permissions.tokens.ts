import { InjectionToken }  from '@angular/core';
import { RoutePermission } from './permissions.service';

export const MODULE_PERMISSIONS = new InjectionToken<RoutePermission[]>('ModulePermissions');
