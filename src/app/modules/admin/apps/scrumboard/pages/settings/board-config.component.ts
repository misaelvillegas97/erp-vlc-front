import { Component, Input }                     from '@angular/core';
import { MatIconAnchor }                        from '@angular/material/button';
import { MatIcon }                              from '@angular/material/icon';
import { RouterLink, RouterOutlet }             from '@angular/router';
import { Board }                                from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { DrawerContentComponent }               from '@shared/components/drawer-listing/components/drawer-content.component';
import { DrawerListingComponent }               from '@shared/components/drawer-listing/drawer-listing.component';
import { TranslocoDirective, TranslocoService } from '@ngneat/transloco';
import { PanelType }                            from '@shared/components/drawer-listing/panel.type';

@Component({
    selector   : 'app-board-config',
    standalone : true,
    imports    : [
        MatIcon,
        MatIconAnchor,
        RouterLink,
        DrawerContentComponent,
        DrawerListingComponent,
        RouterOutlet,
        TranslocoDirective
    ],
    templateUrl: './board-config.component.html'
})
export class BoardConfigComponent {
    @Input('board') board: Board;

    panels: PanelType[] = [];
    selectedPanel: PanelType;

    constructor(
        private readonly _ts: TranslocoService
    ) {
        this.panels = [
            {
                id         : 'board-info',
                icon       : 'heroicons_outline:information-circle',
                title      : this._ts.translate('scrumboard.settings.board-information.title'),
                description: this._ts.translate('scrumboard.settings.board-information.description'),
                link       : [ './' ]
            },
            {
                id         : 'members',
                icon       : 'heroicons_outline:user-group',
                title      : this._ts.translate('scrumboard.settings.members.title'),
                description: this._ts.translate('scrumboard.settings.members.description'),
                link       : [ './members' ]
            },
            {
                id         : 'labels',
                icon       : 'heroicons_outline:tag',
                title      : this._ts.translate('scrumboard.settings.labels.title'),
                description: this._ts.translate('scrumboard.settings.labels.description'),
                link       : [ './labels' ]
            }
        ];

        this.selectedPanel = this.panels[0];
    }

    public onPanelSelected(panel: PanelType) {
        this.selectedPanel = panel;
    }
}
