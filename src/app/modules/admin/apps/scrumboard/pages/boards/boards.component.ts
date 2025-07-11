import { CdkScrollable } from '@angular/cdk/scrolling';

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, } from '@angular/core';
import { MatIconModule }                                                                                from '@angular/material/icon';
import { RouterLink }                                                                                   from '@angular/router';
import { Board }                                                                                        from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService }                                                                            from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { DateTime }                                                                                     from 'luxon';
import { Subject, takeUntil }                                                                           from 'rxjs';
import { MatTooltip }                                                                                   from '@angular/material/tooltip';
import { MatDialog }                                                                                    from '@angular/material/dialog';
import { NewBoardComponent }                                                                            from '@modules/admin/apps/scrumboard/dialogs/new-board/new-board.component';
import { trackByFn }                                                                                    from '@libs/ui/utils/utils';

@Component({
    selector       : 'scrumboard-boards',
    templateUrl    : './boards.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [ CdkScrollable, RouterLink, MatIconModule, MatTooltip ],
})
export class ScrumboardBoardsComponent implements OnInit, OnDestroy {
    boards: Board[];
    protected readonly trackByFn = trackByFn;
    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private readonly _matDialog: MatDialog,
        private _scrumboardService: ScrumboardService
    ) {}

    ngOnInit(): void {
        // Get the boards
        this._scrumboardService.boards$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((boards: Board[]) => {
                this.boards = boards;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Format the given ISO_8601 date as a relative date
     *
     * @param date
     */
    formatDateAsRelative(date: string): string {
        return DateTime.fromISO(date).toRelative();
    }

    openNewBoardDialog(): void {
        this._matDialog.open(NewBoardComponent, {
            panelClass: [ 'dialog-mobile-fullscreen' ],
        });
    }
}
