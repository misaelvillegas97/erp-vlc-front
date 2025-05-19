# Permissions System

This directory contains the implementation of a modular permissions system for the application. The system allows each module to define its own permissions and register them with a central service.

## Overview

The permissions system consists of the following components:

1. **PermissionsService**: A central service that collects and manages permissions from all modules.
2. **MODULE_PERMISSIONS**: An injection token used to collect permissions from different modules.
3. **provideModulePermissions**: A function that registers module permissions with the central service.
4. **Module-specific permissions files**: Each module defines its own permissions in a separate file.

## How to Use

### 1. Define Module Permissions

Create a file named `<module-name>.permissions.ts` in your module directory:

```typescript
// src/app/modules/admin/my-module/my-module.permissions.ts
import {RoutePermission} from '@core/permissions/permissions.service';
import {RoleEnum} from '@core/user/role.type';

export const myModulePermissions: RoutePermission[] = [
    {
        path: 'my-module',
        title: 'My Module',
        icon: 'heroicons_outline:some-icon',
        allowedRoles: [RoleEnum.admin, RoleEnum.someRole],
        children: [
            {
                path: 'submodule',
                title: 'Submodule',
                icon: 'heroicons_outline:another-icon',
                allowedRoles: [RoleEnum.admin, RoleEnum.someRole]
            }
            // More submodules...
        ]
    }
];
```

### 2. Register Module Permissions

In `app.config.ts`, import your module permissions and register them:

```typescript
import {provideModulePermissions} from '@core/permissions/permissions.providers';
import {myModulePermissions} from '@modules/admin/my-module/my-module.permissions';

export const appConfig: ApplicationConfig = {
    providers: [
        // Other providers...

        // Register module permissions
        provideModulePermissions(myModulePermissions),

        // More providers...
    ]
};
```

### 3. Use in Routes

In your module's routes file, use the `rolesGuard` without specifying roles in the data property:

```typescript
// src/app/modules/admin/my-module/my-module.routes.ts
import {rolesGuard} from '@core/guards/roles.guard';

export default [
    {
        path: '',
        loadComponent: () => import('./my-module.component').then(m => m.MyModuleComponent),
        children: [
            {
                path: 'submodule',
                title: 'Submodule',
                canActivate: [rolesGuard], // No need to specify roles here
                loadComponent: () => import('./pages/submodule/submodule.component').then(m => m.SubmoduleComponent)
            }
            // More routes...
        ]
    }
] satisfies Routes;
```

### 4. Use in Components

In your components, use the `requiredRoles` property to control visibility:

```typescript
// In a component with panels/menu items
panels: PanelType[] = [
  {
    id: 'submodule',
    title: 'Submodule',
    icon: 'heroicons_outline:some-icon',
    link: ['/my-module', 'submodule'],
    requiredRoles: [RoleEnum.admin, RoleEnum.someRole]
  }
  // More panels...
];
```

## Benefits

1. **Modularity**: Each module defines its own permissions.
2. **Centralization**: All permissions are collected and managed by a central service.
3. **Consistency**: The same permissions are used for routes, navigation, and components.
4. **Scalability**: Easy to add new modules and permissions without modifying existing code.
