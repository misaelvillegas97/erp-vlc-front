import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { MatDialog }                                                      from '@angular/material/dialog';
import { ActivatedRoute, Router }                                         from '@angular/router';
import { ScrumboardCardDetailsComponent }                                 from '@modules/admin/apps/scrumboard/components/card/details/details.component';

@Component({
    selector       : 'scrumboard-card',
    templateUrl    : './card.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
})
export class ScrumboardCardComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _matDialog: MatDialog,
        private _router: Router
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Launch the side panel (drawer-style modal)
        this._matDialog
            .open(ScrumboardCardDetailsComponent, {
                autoFocus  : false,
                maxWidth   : '100vw',
                width      : '920px',
                hasBackdrop: true,
            })
            .afterClosed()
            .subscribe(() => {
                // Go up twice because card routes are set up like this; "card/CARD_ID"
                this._router.navigate([ './../..' ], {relativeTo: this._activatedRoute});
            });
    }
}
