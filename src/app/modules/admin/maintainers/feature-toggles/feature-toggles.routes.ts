import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () =>
            import('./feature-toggles.component').then(m => m.FeatureTogglesComponent),
        children     : [
            {
                path         : 'list',
                loadComponent: () =>
                    import('./pages/list/list.component').then(m => m.ListComponent),
                title        : 'Listado de Feature Toggles'
            },
            {
                path         : 'new',
                loadComponent: () =>
                    import('./pages/create/create.component').then(m => m.CreateComponent),
                title        : 'Registro de Nuevo Feature Toggle'
            },
            {
                path         : 'edit/:id',
                loadComponent: () =>
                    import('./pages/edit/edit.component').then(m => m.EditComponent),
                title        : 'Edición de Feature Toggle'
            },
            {
                path      : '**',
                redirectTo: 'list',
            }
        ]
    }
] satisfies Routes;
