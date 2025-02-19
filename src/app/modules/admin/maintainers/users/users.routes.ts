import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./users.component').then(m => m.UsersComponent),
        children     : [
            {
                path         : '',
                loadComponent: () => import('./pages/list/list.component').then(m => m.ListComponent),
            },
            {
                path         : 'new',
                loadComponent: () => import('./pages/create/create.component').then(m => m.CreateComponent),
            },
            {path: '**', redirectTo: '', pathMatch: 'full'}
        ]
    },
] as Routes;
