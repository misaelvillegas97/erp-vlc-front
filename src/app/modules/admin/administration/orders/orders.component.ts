import { Component }    from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';

import { DrawerListingComponent } from '@shared/components/drawer-listing/drawer-listing.component';
import { PanelType }              from '@shared/components/drawer-listing/panel.type';

@Component({
    selector   : 'app-orders',
    imports: [
        DrawerListingComponent,
        RouterOutlet,
        TranslocoDirective,
        TranslocoPipe
    ],
    templateUrl: './orders.component.html'
})
export class OrdersComponent {
    panels: PanelType[] = [];

    constructor(private readonly _translateService: TranslocoService) {
        this.panels = [
            {
                id          : 'orders.list',
                title       : this._translateService.translate('operations.orders.list.title'),
                description : this._translateService.translate('operations.orders.list.subtitle'),
                icon        : 'heroicons_outline:document-text',
                selectedIcon: 'heroicons_solid:document-text',
                link: '/operations/orders'
            },
            {
                id          : 'orders.new',
                title       : this._translateService.translate('operations.orders.new.title'),
                description : this._translateService.translate('operations.orders.new.subtitle'),
                icon        : 'heroicons_outline:plus-circle',
                selectedIcon: 'heroicons_solid:plus-circle',
                link: '/operations/orders/new'
            }
        ];
    }
}
