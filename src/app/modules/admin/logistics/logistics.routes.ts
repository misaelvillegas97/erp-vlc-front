import { Routes }              from '@angular/router';
import { VehicleSessionGuard } from './guards/vehicle-session.guard';

export default [
    {
        path         : '',
        loadComponent: () =>
            import('./logistics.component').then(m => m.LogisticsComponent),
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
                loadComponent: () =>
                    import('./pages/history/history.component').then(m => m.HistoryComponent),
                title        : 'Historial de Sesiones'
            },
            {
                path      : '',
                redirectTo: 'fleet-control',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
