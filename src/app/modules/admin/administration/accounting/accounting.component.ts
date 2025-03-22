import { Component, inject } from '@angular/core';
import { PanelType }         from '@shared/components/drawer-listing/panel.type';
import { TranslocoService }  from '@ngneat/transloco';

@Component({
    selector   : 'app-accounting',
    imports    : [],
    templateUrl: './accounting.component.html'
})
export class AccountingComponent {
    readonly #ts = inject(TranslocoService);

    panels: PanelType[] = [
        {
            id          : 'orders.dashboard',
            title       : this.#ts.translate('operations.orders.dashboard.title'),
            description : this.#ts.translate('operations.orders.dashboard.subtitle'),
            icon        : 'heroicons_outline:chart-pie',
            selectedIcon: 'heroicons_solid:chart-pie',
            link        : '/operations/orders/dashboard'
        },
        {
            id          : 'orders.list',
            title       : this.#ts.translate('operations.orders.list.title'),
            description : this.#ts.translate('operations.orders.list.subtitle'),
            icon        : 'heroicons_outline:document-text',
            selectedIcon: 'heroicons_solid:document-text',
            link        : '/operations/orders/list'
        },
        {
            id          : 'orders.new',
            title       : this.#ts.translate('operations.orders.new.title'),
            description : this.#ts.translate('operations.orders.new.subtitle'),
            icon        : 'heroicons_outline:plus-circle',
            selectedIcon: 'heroicons_solid:plus-circle',
            link        : '/operations/orders/new'
        }
    ];
}
