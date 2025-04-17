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
            icon        : 'heroicons_outline:document-minus',
            selectedIcon: 'heroicons_solid:document-minus',
            link        : '/operations/accounting/payables/list'
        },
        {
            id         : 'accounting.receivables',
            title      : this.#ts.translate('operations.accounting.receivables.title'),
            description: this.#ts.translate('operations.accounting.receivables.subtitle'),
            icon        : 'heroicons_outline:document-plus',
            selectedIcon: 'heroicons_solid:document-plus',
            link       : '/operations/accounting/receivables/list'
        },
        {
            id          : 'accounting.banking',
            title       : 'Gestión Bancaria',
            description : 'Administre sus cuentas bancarias y transacciones',
            icon        : 'heroicons_outline:building-library',
            selectedIcon: 'heroicons_solid:building-library',
            children    : [
                {
                    id   : 'accounting.banking.accounts',
                    title: 'Cuentas Bancarias',
                    link : '/operations/accounting/banking/accounts'
                },
                {
                    id   : 'accounting.banking.transfers',
                    title: 'Transferencias',
                    link : '/operations/accounting/banking/transfers'
                },
                {
                    id   : 'accounting.banking.transactions',
                    title: 'Transacciones',
                    link : '/operations/accounting/banking/transactions'
                }
            ]
        },
        {
            id          : 'accounting.reports',
            title       : 'Reportes Contables',
            description : 'Genere informes financieros para análisis',
            icon        : 'heroicons_outline:clipboard-document-list',
            selectedIcon: 'heroicons_solid:clipboard-document-list',
            link        : '/operations/accounting/reports'
        }
    ];
}
