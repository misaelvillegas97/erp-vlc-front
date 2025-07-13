import { inject }                                                       from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes, } from '@angular/router';

import { catchError, Observable, throwError } from 'rxjs';
import { Board }                              from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService }                  from '@modules/admin/apps/scrumboard/services/scrumboard.service';

/**
 * Board resolver
 *
 * @param route
 * @param state
 */
const boardResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Observable<Board> => {
    const scrumboardService = inject(ScrumboardService);
    const router = inject(Router);

    return scrumboardService.getBoard(route.paramMap.get('boardId')).pipe(
        // Error here means the requested board is not available
        catchError((error) => {
            // Log the error
            console.error(error);

            // Get the parent url
            const parentUrl = state.url.split('/').slice(0, -1).join('/');

            // Navigate to there
            router.navigateByUrl(parentUrl);

            // Throw an error
            return throwError(error);
        })
    );
};

/**
 * Card resolver
 *
 * @param route
 * @param state
 */
const cardResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const scrumboardService = inject(ScrumboardService);
    const router = inject(Router);

    return scrumboardService.getCard(route.paramMap.get('cardId')).pipe(
        // Error here means the requested card is not available
        catchError((error) => {
            // Log the error
            console.error(error);

            // Get the parent url
            const parentUrl = state.url.split('/').slice(0, -1).join('/');

            // Navigate to there
            router.navigateByUrl(parentUrl);

            // Throw an error
            return throwError(error);
        })
    );
};

export default [
    {
        path     : '',
        loadComponent: () => import('./pages/boards/boards.component').then(m => m.ScrumboardBoardsComponent),
        resolve  : {
            boards: () => inject(ScrumboardService).getBoards(),
        },
    },
    {
        path     : ':boardId',
        loadComponent: () => import('./pages/board/board.component').then(m => m.ScrumboardBoardComponent),
        resolve  : {
            board: boardResolver,
        },
        children : [
            {
                path     : 'card/:cardId',
                loadComponent: () => import('./components/card/card.component').then(m => m.ScrumboardCardComponent),
                resolve  : {
                    card: cardResolver,
                },
            }
        ],
    },
    {
        path         : ':boardId/settings',
        loadComponent: () => import('./pages/settings/board-config.component').then(m => m.BoardConfigComponent),
        loadChildren : () => import('./pages/settings/board-config.routes').then(c => c.default),
        resolve      : {
            board: boardResolver
        }
    }
] as Routes;
