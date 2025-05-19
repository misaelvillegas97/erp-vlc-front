import { Routes }     from '@angular/router';
import { rolesGuard } from '@core/guards/roles.guard';

export default [
    {
        path        : 'fleet-management',
        loadChildren: () => import('./fleet-management/fleet-management.routes'),
    },
    {
        path        : 'fuel-management',
        title       : 'Gestión de Combustible',
        canActivate : [ rolesGuard ],
        loadChildren: () => import('@modules/admin/logistics/fuel-management/fuel-management.routes'),
    },
] satisfies Routes;
