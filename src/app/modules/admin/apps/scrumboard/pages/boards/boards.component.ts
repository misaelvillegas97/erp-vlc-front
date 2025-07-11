import { CdkScrollable } from '@angular/cdk/scrolling';

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, ViewEncapsulation, } from '@angular/core';
import { MatIconModule }                                                                     from '@angular/material/icon';
import { RouterLink }                                                                        from '@angular/router';
import { ScrumboardService }                                                                 from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { DateTime }                                                                          from 'luxon';
import { MatTooltip }                                                                        from '@angular/material/tooltip';
import { MatDialog }                                                                         from '@angular/material/dialog';
import { NewBoardComponent }                                                                 from '@modules/admin/apps/scrumboard/dialogs/new-board/new-board.component';
import { trackByFn }                                                                         from '@libs/ui/utils/utils';

@Component({
    selector       : 'scrumboard-boards',
    templateUrl    : './boards.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [ CdkScrollable, RouterLink, MatIconModule, MatTooltip ],
})
export class ScrumboardBoardsComponent {
    readonly #boardService = inject(ScrumboardService);
    readonly #matDialog = inject(MatDialog);
    readonly #cdr = inject(ChangeDetectorRef);

    boards = this.#boardService.boards;
    protected readonly trackByFn = trackByFn;

    /**
     * Format the given ISO_8601 date as a relative date
     *
     * @param date
     */
    formatDateAsRelative(date: string): string {
        return DateTime.fromISO(date).toRelative();
    }

    openNewBoardDialog(): void {
        this.#matDialog.open(NewBoardComponent, {
            panelClass: [ 'dialog-mobile-fullscreen' ],
        });
    }
}
