import { Routes }              from '@angular/router';
import { AccountingComponent } from './accounting.component';

export default [
    {
        path     : '',
        component: AccountingComponent,
        children : [
            {
                path      : '',
                pathMatch : 'full',
                redirectTo: 'dashboard'
            },
            {
                path         : 'dashboard',
                loadComponent: () => import('./pages/dashboard/dashboard.component').then(c => c.DashboardComponent),
                data         : {breadcrumb: 'Dashboard'}
            },
            // Cuentas por Pagar (Payables)
            {
                path    : 'payables',
                children: [
                    {
                        path      : '',
                        pathMatch : 'full',
                        redirectTo: 'list'
                    },
                    {
                        path         : 'list',
                        loadComponent: () => import('./pages/payables/list/list.component').then(c => c.ListComponent),
                        data         : {breadcrumb: 'Cuentas por Pagar'}
                    },
                    {
                        path         : 'new',
                        loadComponent: () => import('./pages/payables/create/create.component').then(c => c.CreateComponent),
                        data         : {breadcrumb: 'Crear Cuenta por Pagar'}
                    },
                    {
                        path         : ':id',
                        loadComponent: () => import('./pages/payables/detail/detail.component').then(c => c.DetailComponent),
                        data         : {breadcrumb: 'Detalle de Cuenta por Pagar'}
                    }
                ]
            },
            // Cuentas por Cobrar (Receivables)
            {
                path    : 'receivables',
                children: [
                    {
                        path      : '',
                        pathMatch : 'full',
                        redirectTo: 'list'
                    },
                    {
                        path         : 'list',
                        loadComponent: () => import('./pages/receivables/list/list.component').then(c => c.ListComponent),
                        data         : {breadcrumb: 'Cuentas por Cobrar'}
                    },
                    {
                        path         : 'new',
                        loadComponent: () => import('./pages/receivables/new/new.component').then(c => c.NewComponent),
                        data         : {breadcrumb: 'Crear Cuenta por Cobrar'}
                    },
                    {
                        path         : 'detail/:id',
                        loadComponent: () => import('./pages/receivables/detail/detail.component').then(c => c.DetailComponent),
                        data         : {breadcrumb: 'Detalle de Cuenta por Cobrar'}
                    }
                ]
            },
            // Bancos y Transferencias (Banking)
            {
                path    : 'banking',
                children: [
                    {
                        path      : '',
                        pathMatch : 'full',
                        redirectTo: 'accounts'
                    },
                    {
                        path         : 'accounts',
                        loadComponent: () => import('./pages/bank/accounts/accounts.component').then(c => c.BankAccountsComponent),
                        data         : {breadcrumb: 'Cuentas Bancarias'}
                    },
                    {
                        path         : 'transfers',
                        loadComponent: () => import('./pages/bank/transfers/transfers.component').then(c => c.TransfersComponent),
                        data         : {breadcrumb: 'Transferencias'}
                    },
                    {
                        path         : 'transactions',
                        loadComponent: () => import('./pages/bank/transactions/transactions.component').then(c => c.TransactionsComponent),
                        data         : {breadcrumb: 'Transacciones Bancarias'}
                    }
                ]
            }
        ]
    }
] as Routes;
