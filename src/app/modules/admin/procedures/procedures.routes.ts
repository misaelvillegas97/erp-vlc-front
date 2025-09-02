import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./procedures.component').then(m => m.ProceduresComponent),
        children     : [
            {
                path      : '',
                redirectTo: 'list',
                pathMatch : 'full'
            },
            {
                path         : 'list',
                loadComponent: () => import('./pages/procedure-list/procedure-list.component')
                    .then(c => c.ProcedureListComponent),
                title        : 'Procedures'
            },
            {
                path         : ':id/edit',
                loadComponent: () => import('./pages/procedure-editor/procedure-editor.component')
                    .then(c => c.ProcedureEditorComponent),
                title        : 'Edit Procedure'
            },
            {
                path         : ':id/versions/:v',
                loadComponent: () => import('./pages/procedure-version-detail/procedure-version-detail.component')
                    .then(c => c.ProcedureVersionDetailComponent),
                title        : 'Procedure Version'
            },
            {
                path         : 'new',
                loadComponent: () => import('./pages/procedure-editor/procedure-editor.component')
                    .then(c => c.ProcedureEditorComponent),
                title        : 'New Procedure'
            },
            {
                path         : ':id/publish',
                loadComponent: () => import('./pages/procedure-publish/procedure-publish.component')
                    .then(c => c.ProcedurePublishComponent),
                title        : 'Publish Procedure'
            },
            {
                path      : '**',
                redirectTo: 'list',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
