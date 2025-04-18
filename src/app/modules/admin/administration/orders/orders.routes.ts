import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./orders.component').then((m) => m.OrdersComponent),
        children: [
            {
                title: 'Dashboard Principal',
                path         : 'dashboard',
                loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
            },
            {
                title: 'Listado de Órdenes',
                path: 'list',
                loadComponent: () => import('./pages/list/list.component').then((m) => m.ListComponent),
            },
            {
                title: 'Registro de Nueva Orden',
                path         : 'new',
                loadComponent: () => import('./pages/create/create.component').then((m) => m.CreateComponent),
            },
        ]
    }
] satisfies Routes;
