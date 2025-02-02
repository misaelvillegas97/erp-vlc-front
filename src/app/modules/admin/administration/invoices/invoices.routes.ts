import { Routes }            from '@angular/router';
import { InvoicesComponent } from '@modules/admin/administration/invoices/invoices.component';

export default [
    {
        path     : '',
        component: InvoicesComponent,
        children : [
            {path: '', loadComponent: () => import('@modules/admin/administration/invoices/pages/list/list.component').then(m => m.ListComponent)},
        ]
    }
] satisfies Routes;
