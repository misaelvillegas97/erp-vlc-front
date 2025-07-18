import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./checklists.component').then(m => m.ChecklistsComponent),
        children     : [
            {
                path      : '',
                redirectTo: 'groups',
                pathMatch : 'full'
            },
            {
                path    : 'groups',
                children: [
                    {
                        path         : 'list',
                        loadComponent: () => import('./pages/checklist-groups-list/checklist-groups-list.component')
                            .then(c => c.ChecklistGroupsListComponent),
                        title        : 'Checklist Groups'
                    },
                    {
                        path         : 'new',
                        loadComponent: () => import('./pages/checklist-group-form/checklist-group-form.component')
                            .then(c => c.ChecklistGroupFormComponent),
                        title        : 'New Checklist Group'
                    },
                    {
                        path         : 'edit/:id',
                        loadComponent: () => import('./pages/checklist-group-form/checklist-group-form.component')
                            .then(c => c.ChecklistGroupFormComponent),
                        title        : 'Edit Checklist Group'
                    },
                    {
                        path      : '**',
                        redirectTo: 'list',
                        pathMatch : 'full'
                    }
                ]
            },
            {
                path    : 'templates',
                children: [
                    {
                        path         : 'list',
                        loadComponent: () => import('./pages/checklist-templates-list/checklist-templates-list.component')
                            .then(c => c.ChecklistTemplatesListComponent),
                        title        : 'Checklist Templates'
                    },
                    {
                        path         : 'new',
                        loadComponent: () => import('./pages/checklist-template-form/checklist-template-form.component')
                            .then(c => c.ChecklistTemplateFormComponent),
                        title        : 'Nueva Plantilla de Checklist'
                    },
                    {
                        path         : 'edit/:id',
                        loadComponent: () => import('./pages/checklist-template-form/checklist-template-form.component')
                            .then(c => c.ChecklistTemplateFormComponent),
                        title        : 'Editar Plantilla de Checklist'
                    },
                    {
                        path      : '**',
                        redirectTo: 'list',
                        pathMatch : 'full'
                    }
                ]
            },
            // {
            //   path: 'execute',
            //   children: [
            //     {
            //       path: '',
            //       loadComponent: () => import('./pages/checklist-execution-form/checklist-execution-form.component')
            //         .then(c => c.ChecklistExecutionFormComponent),
            //       title: 'Execute Checklist'
            //     },
            //     {
            //       path: ':id',
            //       loadComponent: () => import('./pages/checklist-execution-form/checklist-execution-form.component')
            //         .then(c => c.ChecklistExecutionFormComponent),
            //       title: 'Continue Checklist'
            //     }
            //   ]
            // },
            // {
            //   path: 'reports',
            //   children: [
            //     {
            //       path: ':executionId',
            //       loadComponent: () => import('./pages/checklist-report/checklist-report.component')
            //         .then(c => c.ChecklistReportComponent),
            //       title: 'Checklist Report'
            //     }
            //   ]
            // }
        ]
    }
] satisfies Routes;
