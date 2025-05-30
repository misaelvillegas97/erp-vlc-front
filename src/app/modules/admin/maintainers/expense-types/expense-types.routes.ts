import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () =>
            import('./expense-types.component').then(m => m.ExpenseTypesComponent),
        children     : [
            {
                path         : 'list',
                loadComponent: () =>
                    import('./pages/list/list.component').then(m => m.ListComponent),
                title        : 'Listado de Tipos de Gastos'
            },
            {
                path         : 'new',
                loadComponent: () =>
                    import('./pages/create/create.component').then(m => m.CreateComponent),
                title        : 'Registro de Nuevo Tipo de Gasto'
            },
            {
                path      : '**',
                redirectTo: 'list',
            }
        ]
    }
] satisfies Routes;
