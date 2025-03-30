import { Component }                       from '@angular/core';
import { RouterOutlet }                    from '@angular/router';
import { DrawerListingComponent }          from '@shared/components/drawer-listing/drawer-listing.component';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { PanelType }                       from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }          from '@shared/components/drawer-listing/components/drawer-content.component';

@Component({
    selector   : 'app-news',
    standalone : true,
    imports    : [
        RouterOutlet,
        DrawerListingComponent,
        TranslocoPipe,
        DrawerContentComponent
    ],
    templateUrl: './client.component.html'
})
export class ClientComponent {
    panels: PanelType[];

    constructor(private readonly _translateService: TranslocoService) {
        this.panels = [
            {
                id          : 'client.list',
                icon        : 'heroicons_outline:queue-list',
                selectedIcon: 'heroicons_solid:queue-list',
                title       : this._translateService.translate('maintainers.client.list.title'),
                description : this._translateService.translate('maintainers.client.list.description'),
                link        : [ '/maintainers', 'clients' ]
            },
            {
                id          : 'client.new',
                icon        : 'heroicons_outline:plus-circle',
                selectedIcon: 'heroicons_solid:plus-circle',
                title       : this._translateService.translate('maintainers.client.new.title'),
                description : this._translateService.translate('maintainers.client.new.description'),
                link        : [ '/maintainers', 'clients', 'new' ]
            },
        ];
    }
}
