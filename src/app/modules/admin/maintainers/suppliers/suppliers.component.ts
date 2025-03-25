import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoDirective, TranslocoService }      from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';

@Component({
    selector   : 'app-suppliers',
    imports: [
        DrawerListingComponent,
        RouterOutlet,
        TranslocoDirective
    ],
    templateUrl: './suppliers.component.html'
})
export class SuppliersComponent {
    readonly #ts = inject(TranslocoService);

    panels: WritableSignal<PanelType[]> = signal([
        {
            id          : 'suppliers.list',
            icon        : 'heroicons_outline:queue-list',
            selectedIcon: 'heroicons_solid:queue-list',
            title       : this.#ts.translate('maintainers.suppliers.list.title'),
            description : this.#ts.translate('maintainers.suppliers.list.description'),
            link        : [ '/maintainers', 'suppliers' ]
        },
        {
            id          : 'suppliers.new',
            icon        : 'heroicons_outline:plus-circle',
            selectedIcon: 'heroicons_solid:plus-circle',
            title       : this.#ts.translate('maintainers.suppliers.new.title'),
            description : this.#ts.translate('maintainers.suppliers.new.description'),
            link        : [ '/maintainers', 'suppliers', 'new' ]
        }
    ]);
}
