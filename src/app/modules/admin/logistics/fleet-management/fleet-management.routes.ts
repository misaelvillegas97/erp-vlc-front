import { Routes }              from '@angular/router';
import { VehicleSessionGuard } from './guards/vehicle-session.guard';
import { rolesGuard }          from '@core/guards/roles.guard';

export default [
    {
        path         : '',
        loadComponent: () =>
            import('./fleet-management.component').then(m => m.FleetManagementComponent),
        children     : [
            {
                path         : 'fleet-control',
                loadComponent: () =>
                    import('./pages/fleet-control/fleet-control.component').then(m => m.FleetControlComponent),
                title        : 'Control de Flota'
            },
            {
                path         : 'active-sessions',
                loadComponent: () =>
                    import('./pages/active-sessions/active-sessions.component').then(m => m.ActiveSessionsComponent),
                title        : 'Sesiones Activas'
            },
            {
                path         : 'driving-mode',
                loadComponent: () =>
                    import('./pages/driving-mode/driving-mode.component').then(m => m.DrivingModeComponent),
                title        : 'Modo Conducción'
            },
            {
                path         : 'finish-session/:id',
                canActivate  : [ VehicleSessionGuard ],
                loadComponent: () =>
                    import('./pages/finish-session/finish-session.component').then(m => m.FinishSessionComponent),
                title        : 'Finalizar Sesión'
            },
            {
                path         : 'session-details/:id',
                loadComponent: () =>
                    import('./pages/session-details/session-details.component').then(m => m.SessionDetailsComponent),
                title        : 'Detalles de Sesión'
            },
            {
                path         : 'history',
                title        : 'Historial de Sesiones',
                canActivate  : [ rolesGuard ],
                loadComponent: () =>
                    import('./pages/history/history.component').then(m => m.HistoryComponent),
            },
            {
                path         : 'dashboards/active-sessions',
                title        : 'Dashboard de Sesiones Activas',
                loadComponent: () =>
                    import('./pages/dashboards/active-sessions-dashboard/active-sessions-dashboard.component').then(m => m.ActiveSessionsDashboardComponent),
            },
            {
                path         : 'dashboards/historical-analysis',
                title        : 'Dashboard de Análisis Histórico',
                loadComponent: () =>
                    import('./pages/dashboards/historical-analysis-dashboard/historical-analysis-dashboard.component').then(m => m.HistoricalAnalysisDashboardComponent),
            },
            {
                path         : 'dashboards/driver-performance',
                title        : 'Dashboard de Rendimiento de Conductores',
                loadComponent: () =>
                    import('./pages/dashboards/driver-performance-dashboard/driver-performance-dashboard.component').then(m => m.DriverPerformanceDashboardComponent),
            },
            {
                path         : 'dashboards/vehicle-utilization',
                title        : 'Dashboard de Utilización de Vehículos',
                loadComponent: () =>
                    import('./pages/dashboards/vehicle-utilization-dashboard/vehicle-utilization-dashboard.component').then(m => m.VehicleUtilizationDashboardComponent),
            },
            {
                path         : 'dashboards/geographical-analysis',
                title        : 'Dashboard de Análisis Geográfico',
                loadComponent: () =>
                    import('./pages/dashboards/geographical-analysis-dashboard/geographical-analysis-dashboard.component').then(m => m.GeographicalAnalysisDashboardComponent),
            },
            {
                path         : 'dashboards/compliance-safety',
                title        : 'Dashboard de Cumplimiento y Seguridad',
                loadComponent: () =>
                    import('./pages/dashboards/compliance-safety-dashboard/compliance-safety-dashboard.component').then(m => m.ComplianceSafetyDashboardComponent),
            },
            {
                path      : '',
                redirectTo: 'fleet-control',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
