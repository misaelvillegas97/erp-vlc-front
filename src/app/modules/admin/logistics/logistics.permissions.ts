import { RoutePermission } from '@core/permissions/models/route-permission';
import { fleetManagementPermissions }       from '@modules/admin/logistics/fleet-management/fleet-management.permissions';
import { fuelManagementPermissions }        from '@modules/admin/logistics/fuel-management/fuel-management.permissions';
import { preventiveMaintenancePermissions } from '@modules/admin/logistics/preventive-maintenance/preventive-maintenance.permissions';
import { RoleEnum }                         from '@core/user/role.type';

export const LOGISTICS_FEATURE_KEY = 'logistics';
export const logisticsPermissions: RoutePermission[] = [
    {
        path        : 'logistics',
        title       : 'Logística',
        description : 'Gestión de logística',
        icon        : 'heroicons_outline:truck',
        allowedRoles: [ RoleEnum.admin, RoleEnum.driver, RoleEnum.dispatcher ],
        children    : [
            ...fleetManagementPermissions,
            ...fuelManagementPermissions,
            ...preventiveMaintenancePermissions
        ]
    }
];
