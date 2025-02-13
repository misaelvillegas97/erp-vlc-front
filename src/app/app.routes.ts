import { Route }               from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard }           from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard }         from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent }     from 'app/layout/layout.component';

export const appRoutes: Route[] = [

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
        component       : LayoutComponent,
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
        component       : LayoutComponent,
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
        path     : '',
        component: LayoutComponent,
        data     : {
            layout: 'empty'
        },
        children : [
            {path: 'homs', loadChildren: () => import('app/modules/landing/home/home.routes')},
        ]
    },

    // Admin routes
    {
        path            : '',
        canActivate     : [ AuthGuard ],
        canActivateChild: [ AuthGuard ],
        component       : LayoutComponent,
        resolve         : {
            initialData: initialDataResolver
        },
        children        : [
            {path: 'home', loadChildren: () => import('app/modules/admin/home/home.routes')},
            // Dashboards
            {
                path: 'dashboards', children: [
                    {path: 'project', loadChildren: () => import('app/modules/admin/dashboards/project/project.routes')},
                    {path: 'analytics', loadChildren: () => import('app/modules/admin/dashboards/analytics/analytics.routes')},
                    {path: 'finance', loadChildren: () => import('app/modules/admin/dashboards/finance/finance.routes')},
                    {path: 'crypto', loadChildren: () => import('app/modules/admin/dashboards/crypto/crypto.routes')},
                ]
            },
            {
                path    : 'operations',
                children: [
                    {path: 'orders', loadChildren: () => import('app/modules/admin/administration/orders/orders.routes')},
                    {path: 'invoices', loadChildren: () => import('app/modules/admin/administration/invoices/invoices.routes')},
                ]
            },
            {
                path    : 'maintainers',
                children: [
                    {path: 'clients', loadChildren: () => import('app/modules/admin/maintainers/clients/client.routes')},
                    {path: 'products', loadChildren: () => import('app/modules/admin/maintainers/products/products.routes')},
                ]
            }
        ]
    }
];
