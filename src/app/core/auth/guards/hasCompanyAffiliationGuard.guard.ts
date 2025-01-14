import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { inject }                                    from '@angular/core';

import { of, switchMap } from 'rxjs';

import { AuthService } from '@core/auth/auth.service';
import { UserService } from '@core/user/user.service';

export const HasCompanyAffiliationGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);

    // Check auth status and if it is authenticated, check userService to see if the user has a company affiliation
    return inject(AuthService).check().pipe(
        switchMap((authenticated) => {
            if (!authenticated) {
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${ state.url }`;
                const urlTree = router.parseUrl(`sign-in?${ redirectURL }`);
                return of(urlTree);
            }
            return inject(UserService).user$.pipe(
                switchMap((user) => {
                    if (!user.assignedCompanies) {
                        return of(false);
                    }
                    return of(true);
                }),
            );
        }),
    );
};
