import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./suppliers.component').then((m) => m.SuppliersComponent),
        children     : [
            {
                path      : '',
                redirectTo: 'list',
                pathMatch : 'full'
            },
            {
                path         : 'list',
                loadComponent: () => import('./pages/list/list.component').then((m) => m.ListComponent)
            },
            {
                path         : 'new',
                loadComponent: () => import('./pages/create/create.component').then((m) => m.CreateComponent)
            }
        ]
    }
] satisfies Routes;
