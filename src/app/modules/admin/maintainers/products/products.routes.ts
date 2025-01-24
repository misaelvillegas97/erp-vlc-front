import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./products.component').then(m => m.ProductsComponent),
        children     : [
            {path: '', loadComponent: () => import('./pages/list/list.component').then(m => m.ListComponent)},
            {path: 'new', loadComponent: () => import('./pages/create/create.component').then(m => m.CreateComponent)},
        ]
    },
] satisfies Routes;
