import { Routes }            from '@angular/router';
import { InvoicesComponent } from '@modules/admin/administration/invoices/invoices.component';

export default [
    {
        path     : '',
        component: InvoicesComponent,
        children : [
            {path: 'list', loadComponent: () => import('@modules/admin/administration/invoices/pages/list/list.component').then(m => m.ListComponent)},
            {path: 'dashboard', loadComponent: () => import('@modules/admin/administration/invoices/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)},
            {path: '**', redirectTo: 'dashboard'}
        ]
    }
] satisfies Routes;
