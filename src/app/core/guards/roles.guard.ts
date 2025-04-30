import { inject }                                        from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map }                                           from 'rxjs/operators';
import { RoleEnum }                                      from '@core/user/role.type';
import { UserService }                                   from '@core/user/user.service';
import { MatSnackBar }                                   from '@angular/material/snack-bar';

export const rolesGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
    const userService = inject(UserService);
    const router = inject(Router);
    const snackbar = inject(MatSnackBar);

    // Lee los roles permitidos desde los data de la ruta
    const allowedRoles: RoleEnum[] = route.data['roles'] ?? [];

    return userService.user$.pipe(
        map(user => {
            if (!user)
                return router.createUrlTree([ '/login' ], {queryParams: {returnUrl: state.url}});

            const userRoleId = user.role.id;

            if (userRoleId === RoleEnum.admin)
                return true;

            if (allowedRoles.includes(userRoleId))
                return true;

            snackbar.open(
                `No tienes permisos para acceder a "${ route.title || route.routeConfig.title || route.url }".`,
            );

            return router.createUrlTree([ '' ]);
        })
    );
};
