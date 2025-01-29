import { inject }                                                   from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError }            from 'rxjs';

import { AuthService } from '@core/auth/auth.service';
import { AuthUtils }   from '@core/auth/auth.utils';

export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);

    let newReq = req.clone();

    // Agrega el Bearer token si no está expirado
    if (authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)) {
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
        });
    }

    // Manejo de errores
    return next(newReq).pipe(
        catchError((error) => {
            if (
                error instanceof HttpErrorResponse &&
                error.status === 401 &&
                // IMPORTANTE: Excluir la ruta de refresh
                !error.url.includes('/refresh') &&
                !error.url.includes('/sign-in') &&
                !error.url.includes('/sign-out')
            ) {
                console.log('HTTP 401 Unauthorized Error');
                // Si tenemos un accessToken => intentar refrescar
                if (authService.accessToken) {
                    return authService.signInUsingToken().pipe(
                        catchError(() => authService.signOut()),
                        switchMap(() => {
                            // Reintentar el request original con el nuevo token
                            newReq = req.clone({
                                headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
                            });
                            return next(newReq);
                        })
                    );
                } else {
                    // Si no hay token, forzar signOut
                    return throwError(() => authService.signOut());
                }
            } else {
                // Para otros errores, propagar el error
                return throwError(() => error);
            }
        })
    );
};
