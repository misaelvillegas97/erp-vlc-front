import { inject }                                        from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map }                                           from 'rxjs/operators';
import { RoleEnum }                                      from '@core/user/role.type';
import { UserService }                                   from '@core/user/user.service';
import { MatSnackBar }                                   from '@angular/material/snack-bar';
import { PermissionsService } from '@core/permissions/permissions.service';

export const rolesGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
    const userService = inject(UserService);
    const permissionsService = inject(PermissionsService);
    const router = inject(Router);
    const snackbar = inject(MatSnackBar);

    // Get the path from the route
    const path = route.routeConfig.path;

    return userService.user$.pipe(
        map(user => {
            if (!user)
                return router.createUrlTree([ '/login' ], {queryParams: {returnUrl: state.url}});

            const userRoleId = user.role.id;

            // Use the permissions service to check if the user has permission to access the route
            if (permissionsService.hasPermission(path, userRoleId))
                return true;

            snackbar.open(
                `No tienes permisos para acceder a "${ route.title || route.routeConfig.title || route.url }".`,
            );

            return router.createUrlTree([ '' ]);
        })
    );
};
