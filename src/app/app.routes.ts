import { Routes }                 from '@angular/router';
import { initialDataResolver }    from 'app/app.resolvers';
import { AuthGuard }              from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard }            from 'app/core/auth/guards/noAuth.guard';
import { rolesGuard }             from '@core/guards/roles.guard';
import { RoleEnum }               from '@core/user/role.type';
import { INVENTORY_FEATURE_KEY }  from '@modules/admin/inventory/inventory.permissions';
import { APPS_FEATURE_KEY }       from '@modules/admin/apps/apps.permissions';
import { SCRUMBOARD_FEATURE_KEY } from '@modules/admin/apps/scrumboard/scrumboard.permissions';
import { CHECKLISTS_FEATURE_KEY } from '@modules/admin/checklists/checklists.permissions';
import { TRACING_FEATURE_KEY } from '@modules/admin/tracing/tracing.permissions';

export const appRoutes: Routes = [

    // Redirect empty path to '/example'
    {path: '', pathMatch: 'full', redirectTo: 'home'},

    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    {path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'home'},

    // Auth routes for guests
    {
        path            : '',
        canActivate     : [ NoAuthGuard ],
        canActivateChild: [ NoAuthGuard ],
        loadComponent: () => import('app/layout/layout.component').then(m => m.LayoutComponent),
        data            : {
            layout: 'empty'
        },
        children        : [
            {path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.routes')},
            {path: 'confirm/:token', loadChildren: () => import('app/modules/auth/confirm/confirm.routes')},
            {path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes')},
            {path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes')},
            {path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes')},
            {path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.routes')}
        ]
    },

    // Auth routes for authenticated users
    {
        path            : '',
        canActivate     : [ AuthGuard ],
        canActivateChild: [ AuthGuard ],
        loadComponent: () => import('app/layout/layout.component').then(m => m.LayoutComponent),
        data            : {
            layout: 'empty'
        },
        children        : [
            {path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes')},
            {path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.routes')}
        ]
    },

    // Landing routes
    {
        path         : '',
        loadComponent: () => import('app/layout/layout.component').then(m => m.LayoutComponent),
        data         : {
            layout: 'empty'
        },
        children     : [
            {path: 'homs', loadChildren: () => import('app/modules/landing/home/home.routes')},
        ]
    },

    // Admin routes
    {
        path            : '',
        canActivate     : [ AuthGuard ],
        canActivateChild: [ AuthGuard ],
        loadComponent   : () => import('app/layout/layout.component').then(m => m.LayoutComponent),
        resolve         : {
            initialData: initialDataResolver
        },
        children        : [
            {path: 'home', loadChildren: () => import('app/modules/admin/home/home.routes')},
            {
                path    : 'operations',
                children: [
                    {
                        path        : 'accounting',
                        loadChildren: () => import('app/modules/admin/administration/accounting/accounting.routes')
                    },
                    {
                        path        : 'orders',
                        loadChildren: () => import('app/modules/admin/administration/orders/orders.routes')
                    },
                    {
                        path        : 'invoices',
                        loadChildren: () => import('app/modules/admin/administration/invoices/invoices.routes')
                    },
                ]
            },
            {
                path        : 'logistics',
                canActivate: [ rolesGuard ],
                data       : {
                    roles: [ RoleEnum.admin, RoleEnum.driver ]
                },
                loadChildren: () => import('app/modules/admin/logistics/logistics.routes'),
            },
            {
                path        : INVENTORY_FEATURE_KEY,
                canActivate : [ rolesGuard ],
                data        : {
                    roles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                },
                loadChildren: () => import('app/modules/admin/inventory/inventory.routes')
            },
            {
                path        : CHECKLISTS_FEATURE_KEY,
                canActivate : [ rolesGuard ],
                data        : {
                    roles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ]
                },
                loadChildren: () => import('app/modules/admin/checklists/checklists.routes')
            },
            {
                path        : TRACING_FEATURE_KEY,
                canActivate : [ rolesGuard ],
                data        : {
                    roles: [ RoleEnum.admin, RoleEnum.quality_manager, RoleEnum.supervisor, RoleEnum.operator ]
                },
                loadChildren: () => import('app/modules/admin/tracing/tracing.routes')
            },
            {
                path    : APPS_FEATURE_KEY,
                title   : 'Aplicaciones',
                children: [
                    {
                        path        : SCRUMBOARD_FEATURE_KEY,
                        title       : 'Tablero Scrum',
                        loadChildren: () => import('app/modules/admin/apps/scrumboard/scrumboard.routes')
                    }
                ]
            },
            {
                path    : 'maintainers',
                children: [
                    {
                        path        : 'clients',
                        title       : 'Mantenedor de Clientes',
                        canActivate : [ rolesGuard ],
                        data        : {
                            roles: [ RoleEnum.admin ]
                        },
                        loadChildren: () => import('app/modules/admin/maintainers/clients/client.routes')
                    },
                    {
                        path        : 'products',
                        title       : 'Mantenedor de Productos',
                        canActivate : [ rolesGuard ],
                        data        : {
                            roles: [ RoleEnum.admin ]
                        },
                        loadChildren: () => import('app/modules/admin/maintainers/products/products.routes')
                    },
                    {
                        path        : 'users',
                        title       : 'Mantenedor de Usuarios',
                        canActivate : [ rolesGuard ],
                        data        : {
                            roles: [ RoleEnum.admin ]
                        },
                        loadChildren: () => import('app/modules/admin/maintainers/users/users.routes')
                    },
                    {
                        path        : 'suppliers',
                        title       : 'Mantenedor de Proveedores',
                        canActivate : [ rolesGuard ],
                        data        : {
                            roles: [ RoleEnum.admin ]
                        },
                        loadChildren: () => import('app/modules/admin/maintainers/suppliers/suppliers.routes')
                    },
                    {
                        path        : 'expense-types',
                        title       : 'Mantenedor de Tipos de Gastos',
                        canActivate : [ rolesGuard ],
                        data        : {
                            roles: [ RoleEnum.admin ]
                        },
                        loadChildren: () => import('app/modules/admin/maintainers/expense-types/expense-types.routes')
                    },
                    {
                        path        : 'vehicles',
                        title       : 'Mantenedor de Vehículos',
                        canActivate : [ rolesGuard ],
                        data        : {
                            roles: [ RoleEnum.admin ]
                        },
                        loadChildren: () => import('app/modules/admin/maintainers/vehicles/vehicles.routes')
                    },
                    {
                        path        : 'feature-toggles',
                        title       : 'Mantenedor de características',
                        canActivate : [ rolesGuard ],
                        data        : {
                            roles: [ RoleEnum.admin ]
                        },
                        loadChildren: () => import('app/modules/admin/maintainers/feature-toggles/feature-toggles.routes')
                    },
                ]
            }
        ]
    }
];
