import { Component }                                           from '@angular/core';
import { DrawerListingComponent }                              from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                                        from '@angular/router';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { PanelType }                                           from '@shared/components/drawer-listing/panel.type';

@Component({
    selector   : 'app-products',
    imports    : [
        DrawerListingComponent,
        RouterOutlet,
        TranslocoDirective,
        TranslocoPipe
    ],
    templateUrl: './products.component.html',
    styleUrl   : './products.component.scss'
})
export class ProductsComponent {
    panels: PanelType[];

    constructor(private readonly _translateService: TranslocoService) {
        this.panels = [
            {
                id          : 'products.list',
                icon        : 'heroicons_outline:queue-list',
                selectedIcon: 'heroicons_solid:queue-list',
                title       : this._translateService.translate('maintainers.products.list.title'),
                description : this._translateService.translate('maintainers.products.list.description'),
                link        : [ '/maintainers', 'products' ]
            },
            {
                id          : 'products.new',
                icon        : 'heroicons_outline:plus-circle',
                selectedIcon: 'heroicons_solid:plus-circle',
                title       : this._translateService.translate('maintainers.products.new.title'),
                description : this._translateService.translate('maintainers.products.new.description'),
                link        : [ '/maintainers', 'products', 'new' ]
            },
        ];
    }
}
