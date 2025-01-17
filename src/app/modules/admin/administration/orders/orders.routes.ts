import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./orders.component').then((m) => m.OrdersComponent),
        children     : []
    }
] satisfies Routes;
