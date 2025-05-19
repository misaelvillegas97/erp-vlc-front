import { Routes }     from '@angular/router';
import { rolesGuard } from '@core/guards/roles.guard';
import { RoleEnum }   from '@core/user/role.type';

export default [
    {
        path    : '',
        loadComponent: () => import('./fuel-management.component').then(m => m.FuelManagementComponent),
        children: [
            {
                path         : 'register',
                title: 'Registro de Combustible',
                loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
            },
            {
                path         : 'list',
                title: 'Listado de Registros de Combustible',
                loadComponent: () => import('./pages/list/list.component').then(m => m.ListComponent),
            },
            {
                path         : 'analysis',
                title        : 'Análisis de Consumo de Combustible',
                canActivate  : [ rolesGuard ],
                loadComponent: () => import('./pages/analysis/analysis.component').then(m => m.AnalysisComponent),
            },
            {
                path      : '',
                redirectTo: 'list',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
