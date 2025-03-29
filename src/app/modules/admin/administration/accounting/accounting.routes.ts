import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./accounting.component').then(m => m.AccountingComponent),
        children     : [
            {
                path         : 'dashboard',
                loadComponent: () =>
                    import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
                title        : 'Dashboard Principal'
            },
            {
                path    : 'payables',
                children: [
                    {
                        path         : 'list',
                        loadComponent: () =>
                            import('./pages/payables/list/list.component').then(m => m.ListComponent),
                        title        : 'Listado de Facturas - Cuentas por Pagar'
                    },
                    {
                        path         : 'new',
                        loadComponent: () =>
                            import('./pages/payables/new/create.component').then(m => m.CreateComponent),
                        title        : 'Registro de Nueva Factura - Cuentas por Pagar'
                    },
                    {
                        path         : 'detail/:id',
                        loadComponent: () =>
                            import('./pages/payables/detail/detail.component').then(m => m.DetailComponent),
                        title        : 'Detalle de Factura - Cuentas por Pagar'
                    }
                ]
            },
            {
                path    : 'receivables',
                children: [
                    {
                        path         : 'list',
                        loadComponent: () =>
                            import('./pages/receivables/list/list.component').then(m => m.ListComponent),
                        title        : 'Listado de Facturas - Cuentas por Cobrar'
                    },
                    {
                        path         : 'new',
                        loadComponent: () =>
                            import('./pages/receivables/new/new.component').then(m => m.NewComponent),
                        title        : 'Generar Factura - Cuentas por Cobrar'
                    },
                    {
                        path         : 'detail/:id',
                        loadComponent: () =>
                            import('./pages/receivables/detail/detail.component').then(m => m.DetailComponent),
                        title        : 'Detalle de Factura - Cuentas por Cobrar'
                    }
                ]
            },
            {
                path    : 'bank',
                children: [
                    {
                        path         : 'transfers',
                        loadComponent: () =>
                            import('./pages/bank/transfers/transfers.component').then(m => m.TransfersComponent),
                        title        : 'Transferencias'
                    }
                ]
            }
        ]
    }
] satisfies Routes;
