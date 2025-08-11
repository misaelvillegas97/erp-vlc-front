import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./tracing.component').then(m => m.TracingComponent),
        children     : [
            {
                path      : '',
                redirectTo: 'templates',
                pathMatch : 'full'
            },
            // ========== TEMPLATES ==========
            {
                path    : 'templates',
                children: [
                    {
                        path         : '',
                        loadComponent: () => import('./pages/templates/templates-list/templates-list.component')
                            .then(c => c.TemplatesListComponent),
                        title        : 'Flow Templates'
                    },
                    {
                        path         : 'new',
                        loadComponent: () => import('./pages/templates/template-detail/template-detail.component')
                            .then(c => c.TemplateDetailComponent),
                        title        : 'New Flow Template'
                    },
                    {
                        path         : ':id',
                        loadComponent: () => import('./pages/templates/template-detail/template-detail.component')
                            .then(c => c.TemplateDetailComponent),
                        title        : 'Flow Template Details'
                    },
                    {
                        path      : '**',
                        redirectTo: '',
                        pathMatch : 'full'
                    }
                ]
            },
            // ========== BUILDER ==========
            {
                path    : 'builder',
                children: [
                    {
                        path         : 'version/:versionId',
                        loadComponent: () => import('./pages/builder/flow-canvas/flow-canvas.component')
                            .then(c => c.FlowCanvasComponent),
                        title        : 'Flow Builder'
                    },
                    {
                        path         : 'version/:versionId/step/:stepId',
                        loadComponent: () => import('./pages/builder/step-editor/step-editor.component')
                            .then(c => c.StepEditorComponent),
                        title        : 'Step Editor'
                    },
                    {
                        path         : 'version/:versionId/fields',
                        loadComponent: () => import('./pages/builder/field-editor/field-editor.component')
                            .then(c => c.FieldEditorComponent),
                        title        : 'Field Editor'
                    },
                    {
                        path         : 'version/:versionId/rules',
                        loadComponent: () => import('./pages/builder/rules-editor/rules-editor.component')
                            .then(c => c.RulesEditorComponent),
                        title        : 'Termination Rules'
                    },
                    {
                        path      : '**',
                        redirectTo: '/tracing/templates',
                        pathMatch : 'full'
                    }
                ]
            },
            // ========== EXECUTION ==========
            {
                path    : 'execution',
                children: [
                    {
                        path      : '',
                        redirectTo: 'instances',
                        pathMatch : 'full'
                    },
                    {
                        path         : 'instances',
                        loadComponent: () => import('./pages/execution/instances-list/instances-list.component')
                            .then(c => c.InstancesListComponent),
                        title        : 'Flow Instances'
                    },
                    {
                        path         : 'instances/new',
                        loadComponent: () => import('./pages/execution/instance-detail/instance-detail.component')
                            .then(c => c.InstanceDetailComponent),
                        title        : 'Start New Flow'
                    },
                    {
                        path         : 'instances/:id',
                        loadComponent: () => import('./pages/execution/instance-detail/instance-detail.component')
                            .then(c => c.InstanceDetailComponent),
                        title        : 'Flow Instance Details'
                    },
                    {
                        path         : 'instances/:id/progress',
                        loadComponent: () => import('./pages/execution/progress-monitor/progress-monitor.component')
                            .then(c => c.ProgressMonitorComponent),
                        title        : 'Flow Progress'
                    },
                    {
                        path         : 'runner/:instanceId/:stepId',
                        loadComponent: () => import('./pages/execution/step-runner/step-runner.component')
                            .then(c => c.StepRunnerComponent),
                        title        : 'Execute Step'
                    },
                    {
                        path      : '**',
                        redirectTo: 'instances',
                        pathMatch : 'full'
                    }
                ]
            },
            // ========== REPORTS ==========
            {
                path    : 'reports',
                children: [
                    {
                        path      : '',
                        redirectTo: 'dashboard',
                        pathMatch : 'full'
                    },
                    {
                        path         : 'dashboard',
                        loadComponent: () => import('./pages/reports/kpi-dashboard/kpi-dashboard.component')
                            .then(c => c.KpiDashboardComponent),
                        title        : 'KPI Dashboard'
                    },
                    {
                        path         : 'bottlenecks',
                        loadComponent: () => import('./pages/reports/bottlenecks-analysis/bottlenecks-analysis.component')
                            .then(c => c.BottlenecksAnalysisComponent),
                        title        : 'Bottlenecks Analysis'
                    },
                    {
                        path         : 'waste',
                        loadComponent: () => import('./pages/reports/waste-reports/waste-reports.component')
                            .then(c => c.WasteReportsComponent),
                        title        : 'Waste Reports'
                    },
                    {
                        path      : '**',
                        redirectTo: 'dashboard',
                        pathMatch : 'full'
                    }
                ]
            },
            // ========== SYNC ==========
            {
                path    : 'sync',
                children: [
                    {
                        path      : '',
                        redirectTo: 'status',
                        pathMatch : 'full'
                    },
                    {
                        path         : 'status',
                        loadComponent: () => import('./pages/sync/sync-status/sync-status.component')
                            .then(c => c.SyncStatusComponent),
                        title        : 'Sync Status'
                    },
                    {
                        path         : 'conflicts',
                        loadComponent: () => import('./pages/sync/conflict-resolution/conflict-resolution.component')
                            .then(c => c.ConflictResolutionComponent),
                        title        : 'Conflict Resolution'
                    },
                    {
                        path      : '**',
                        redirectTo: 'status',
                        pathMatch : 'full'
                    }
                ]
            },
            // ========== FALLBACK ==========
            {
                path      : '**',
                redirectTo: 'templates',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
