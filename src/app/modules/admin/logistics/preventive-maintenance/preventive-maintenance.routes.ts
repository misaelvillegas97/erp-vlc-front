import { Routes }     from '@angular/router';
import { rolesGuard } from '@core/guards/roles.guard';
import { RoleEnum }   from '@core/user/role.type';

export default [
    {
        path         : '',
        loadComponent: () => import('./preventive-maintenance.component').then(m => m.PreventiveMaintenanceComponent),
        children     : [
            {
                path         : 'dashboard',
                title        : 'Dashboard de Mantenimiento',
                loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
                canActivate  : [ rolesGuard ],
                data         : {
                    roles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                }
            },
            {
                path         : 'list',
                title        : 'Registros de Mantenimiento',
                loadComponent: () => import('./pages/maintenance-records/maintenance-records.component').then(m => m.MaintenanceRecordsComponent),
                canActivate  : [ rolesGuard ],
                data         : {
                    roles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                }
            },
            {
                path         : 'register',
                title        : 'Nuevo Registro de Mantenimiento',
                loadComponent: () => import('./pages/maintenance-form/maintenance-form.component').then(m => m.MaintenanceFormComponent),
                canActivate  : [ rolesGuard ],
                data         : {
                    roles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                }
            },
            {
                path         : 'edit/:id',
                title        : 'Editar Registro de Mantenimiento',
                loadComponent: () => import('./pages/maintenance-form/maintenance-form.component').then(m => m.MaintenanceFormComponent),
                canActivate  : [ rolesGuard ],
                data         : {
                    roles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                }
            },
            {
                path         : 'documents',
                title        : 'Documentos de Vehículos',
                loadComponent: () => import('./pages/vehicle-documents/vehicle-documents.component').then(m => m.VehicleDocumentsComponent),
                canActivate  : [ rolesGuard ],
                data         : {
                    roles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                }
            },
            {
                path      : '',
                redirectTo: 'dashboard',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
