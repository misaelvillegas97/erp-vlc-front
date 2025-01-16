import { Routes }        from '@angular/router';
import { inject }        from '@angular/core';
import { ClientService } from '@modules/admin/maintainers/clients/client.service';

export default [
    {
        path         : '',
        loadComponent: () => import('./client.component').then(m => m.ClientComponent),
        children     : [
            {
                path         : '',
                loadComponent: () => import('./pages/list/list.component').then(m => m.ListComponent),
                resolve      : {
                    clients: () => inject(ClientService).getAll(),
                },
            },
            {
                path: 'new',
                loadComponent: () => import('./pages/create/create.component').then(m => m.CreateComponent),
            },
            {path: '**', redirectTo: '', pathMatch: 'full'}
        ]
    },
] as Routes;
