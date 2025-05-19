import { Routes }     from '@angular/router';
import { rolesGuard } from '@core/guards/roles.guard';
import { RoleEnum }   from '@core/user/role.type';

export default [
    {
        path    : '',
        children: [
            {
                path         : 'register',
                loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
                title        : 'Registro de Combustible'
            },
            {
                path         : 'list',
                loadComponent: () => import('./pages/list/list.component').then(m => m.ListComponent),
                title        : 'Listado de Registros de Combustible'
            },
            {
                path         : 'analysis',
                loadComponent: () => import('./pages/analysis/analysis.component').then(m => m.AnalysisComponent),
                title        : 'Análisis de Consumo de Combustible',
                canActivate  : [ rolesGuard ],
                data         : {
                    roles: [ RoleEnum.admin ]
                }
            },
            {
                path      : '',
                redirectTo: 'list',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
