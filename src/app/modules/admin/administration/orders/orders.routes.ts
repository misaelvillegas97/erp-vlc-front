import { Routes }        from '@angular/router';
import { inject }        from '@angular/core';
import { OrdersService } from '@modules/admin/administration/orders/orders.service';

export default [
    {
        path         : '',
        loadComponent: () => import('./orders.component').then((m) => m.OrdersComponent),
        children: [
            {
                path         : '',
                loadComponent: () => import('./pages/list/list.component').then((m) => m.ListComponent),
                resolve      : {
                    orders: () => inject(OrdersService).findAll()
                }
            },
            {path: 'new', loadComponent: () => import('./pages/create/create.component').then((m) => m.CreateComponent)},
        ]
    }
] satisfies Routes;
