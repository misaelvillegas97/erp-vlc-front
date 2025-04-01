import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoPipe, TranslocoService }           from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';

@Component({
    selector: 'app-expense-type',
    imports : [
        DrawerListingComponent,
        DrawerContentComponent,
        RouterOutlet,
        TranslocoPipe
    ],
    template: `
        <drawer-listing
            [panels]="panels()"
            [selectedPanel]="'list'"
            [title]="'maintainers.expense-types.title' | transloco"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>

    `
})
export class ExpenseTypesComponent {
    readonly #ts = inject(TranslocoService);

    panels: WritableSignal<PanelType[]> = signal([
        {
            id          : 'expense-type.list',
            title      : this.#ts.translate('maintainers.expense-types.list.title'),
            description: this.#ts.translate('maintainers.expense-types.list.description'),
            icon        : 'mat_outline:label',
            selectedIcon: 'mat_solid:label',
            link       : [ '/maintainers', 'expense-types', 'list' ]
        },
        {
            id          : 'expense-type.new',
            title      : this.#ts.translate('maintainers.expense-types.new.title'),
            description: this.#ts.translate('maintainers.expense-types.new.description'),
            icon        : 'mat_outline:add_circle',
            selectedIcon: 'mat_solid:add_circle',
            link       : [ '/maintainers', 'expense-types', 'new' ]
        }
    ]);
}
