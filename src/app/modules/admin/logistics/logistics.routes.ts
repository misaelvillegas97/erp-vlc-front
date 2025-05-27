import { Routes }                     from '@angular/router';
import { rolesGuard }                 from '@core/guards/roles.guard';
import { PREVENTIVE_MAINTENANCE_KEY } from '@modules/admin/logistics/preventive-maintenance/preventive-maintenance.permissions';
import { FLEET_MANAGEMENT_KEY }       from '@modules/admin/logistics/fleet-management/fleet-management.permissions';
import { FUEL_MANAGEMENT_KEY }        from '@modules/admin/logistics/fuel-management/fuel-management.permissions';

export default [
    {
        path: FLEET_MANAGEMENT_KEY,
        loadChildren: () => import('./fleet-management/fleet-management.routes'),
    },
    {
        path: FUEL_MANAGEMENT_KEY,
        title       : 'Gestión de Combustible',
        canActivate : [ rolesGuard ],
        loadChildren: () => import('@modules/admin/logistics/fuel-management/fuel-management.routes'),
    },
    {
        path        : PREVENTIVE_MAINTENANCE_KEY,
        title       : 'Mantenimiento Preventivo',
        canActivate : [ rolesGuard ],
        loadChildren: () => import('@modules/admin/logistics/preventive-maintenance/preventive-maintenance.routes'),
    },
] satisfies Routes;
