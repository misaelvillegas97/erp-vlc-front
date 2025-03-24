import { Component, inject }                                   from '@angular/core';
import { PanelType }                                           from '@shared/components/drawer-listing/panel.type';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DrawerListingComponent }                              from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                                        from '@angular/router';

@Component({
    selector   : 'app-accounting',
    imports: [
        DrawerListingComponent,
        RouterOutlet,
        TranslocoDirective,
        TranslocoPipe
    ],
    templateUrl: './accounting.component.html'
})
export class AccountingComponent {
    readonly #ts = inject(TranslocoService);

    panels: PanelType[] = [
        {
            id         : 'accounting.dashboard',
            title      : this.#ts.translate('operations.accounting.dashboard.title'),
            description: this.#ts.translate('operations.accounting.dashboard.subtitle'),
            icon        : 'heroicons_outline:chart-pie',
            selectedIcon: 'heroicons_solid:chart-pie',
            link       : '/operations/accounting/dashboard'
        },
        {
            id          : 'accounting.payables',
            title       : this.#ts.translate('operations.accounting.payables.title'),
            description : this.#ts.translate('operations.accounting.payables.subtitle'),
            icon        : 'heroicons_outline:document-text',
            selectedIcon: 'heroicons_solid:document-text',
            link        : '/operations/accounting/payables/list'
        },
        {
            id         : 'accounting.receivables',
            title      : this.#ts.translate('operations.accounting.receivables.title'),
            description: this.#ts.translate('operations.accounting.receivables.subtitle'),
            icon        : 'heroicons_outline:document-text',
            selectedIcon: 'heroicons_solid:document-text',
            link       : '/operations/accounting/receivables/list'
        },
        {
            id          : 'accounting.bank',
            title       : this.#ts.translate('operations.accounting.bank.title'),
            description : this.#ts.translate('operations.accounting.bank.subtitle'),
            icon        : 'heroicons_outline:banknotes',
            selectedIcon: 'heroicons_solid:banknotes',
            link        : '/operations/accounting/bank/transfers'
        }
    ];
}
