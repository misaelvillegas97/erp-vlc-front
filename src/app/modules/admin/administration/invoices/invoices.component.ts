import { Component }                                           from '@angular/core';
import { PanelType }                                           from '@shared/components/drawer-listing/panel.type';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DrawerListingComponent }                              from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                                        from '@angular/router';

@Component({
    selector   : 'app-invoices',
    imports    : [
        DrawerListingComponent,
        RouterOutlet,
        TranslocoDirective,
        TranslocoPipe
    ],
    templateUrl: './invoices.component.html'
})
export class InvoicesComponent {
    panels: PanelType[] = [];

    constructor(private readonly _translateService: TranslocoService) {
        this.panels = [
            {
                id          : 'invoices.list',
                title       : this._translateService.translate('operations.invoices.list.title'),
                description : this._translateService.translate('operations.invoices.list.subtitle'),
                icon        : 'mat_outline:receipt_long',
                selectedIcon: 'mat_solid:receipt_long',
                link        : '/invoices'
            },
            {
                id          : 'invoices.new',
                title       : this._translateService.translate('operations.invoices.new.title'),
                description : this._translateService.translate('operations.invoices.new.subtitle'),
                icon        : 'heroicons_outline:plus-circle',
                selectedIcon: 'heroicons_solid:plus-circle',
                link        : '/invoices/new'
            }
        ];
    }
}
