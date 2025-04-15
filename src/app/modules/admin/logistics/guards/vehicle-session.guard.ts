import { inject, Injectable }                                               from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, Observable, of }                                  from 'rxjs';
import { VehicleSessionsService }                                           from '../services/vehicle-sessions.service';
import { SessionStatus }                                                    from '../domain/model/vehicle-session.model';

@Injectable({
    providedIn: 'root'
})
export class VehicleSessionGuard implements CanActivate {
    readonly #sessionsService = inject(VehicleSessionsService);
    readonly #router = inject(Router);

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const sessionId = route.paramMap.get('id');

        if (!sessionId) {
            this.#router.navigate([ '/logistics/active-sessions' ]);
            return of(false);
        }

        return this.#sessionsService.findById(sessionId).pipe(
            map(session => {
                // Solo permitir acceso si la sesión está activa
                if (session && session.status === SessionStatus.ACTIVE) {
                    return true;
                }

                this.#router.navigate([ '/logistics/active-sessions' ]);
                return false;
            }),
            catchError(() => {
                this.#router.navigate([ '/logistics/active-sessions' ]);
                return of(false);
            }),
        );
    }
}
