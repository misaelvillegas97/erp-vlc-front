import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () =>
            import('./vehicles.component').then(m => m.VehiclesComponent),
        children     : [
            {
                path         : 'list',
                loadComponent: () =>
                    import('./pages/list/list.component').then(m => m.ListComponent),
                title        : 'Listado de Vehículos'
            },
            {
                path         : 'new',
                loadComponent: () =>
                    import('./pages/create/create.component').then(m => m.CreateComponent),
                title        : 'Registro de Nuevo Vehículo'
            },
            {
                path         : 'edit/:id',
                loadComponent: () =>
                    import('./pages/edit/edit.component').then(m => m.EditComponent),
                title        : 'Editar Vehículo'
            },
            {
                path      : '**',
                redirectTo: 'list',
            }
        ]
    }
] satisfies Routes;
