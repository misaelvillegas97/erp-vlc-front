import { inject }                                                   from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError }            from 'rxjs';

import { AuthService } from '@core/auth/auth.service';
import { AuthUtils }   from '@core/auth/auth.utils';
import { DeviceService } from '@core/device/device.service';
import { environment } from 'environments/environment';

export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService  = inject(AuthService);
    const deviceService = inject(DeviceService);

    let headers = req.headers
        .set('device-id', deviceService.getDeviceId())
        .set('user-agent', navigator.userAgent)
        .set('app-version', environment.appVersion)
        .set('environment', environment.production ? 'production' : 'development');

    if (authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken) && !req.headers.get('Authorization')) {
        headers = headers.set('Authorization', 'Bearer ' + authService.accessToken);
    }

    let newReq = req.clone({ headers });

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
                return authService.signInUsingToken().pipe(
                    catchError(() => authService.signOut()),
                    switchMap(() => {
                        // Reintentar el request original con el nuevo token y headers de contexto
                        newReq = req.clone({
                            headers: headers.set('Authorization', 'Bearer ' + authService.accessToken),
                        });
                        return next(newReq);
                    })
                );
            } else {
                // Para otros errores, propagar el error
                return throwError(() => error);
            }
        })
    );
};
