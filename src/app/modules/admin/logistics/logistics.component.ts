import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoPipe, TranslocoService }           from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';

@Component({
    selector  : 'app-logistics',
    standalone: true,
    imports   : [
        DrawerListingComponent,
        DrawerContentComponent,
        RouterOutlet,
        TranslocoPipe
    ],
    template  : `
        <drawer-listing
            [panels]="panels()"
            [selectedPanel]="'fleet-control'"
            [title]="'logistics.fleet.title' | transloco"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>
    `
})
export class LogisticsComponent {
    readonly #ts = inject(TranslocoService);

    panels: WritableSignal<PanelType[]> = signal([
        {
            id          : 'fleet-control',
            title       : this.#ts.translate('operations.logistics.fleet.control.title'),
            description : this.#ts.translate('operations.logistics.fleet.control.description'),
            icon        : 'mat_outline:directions_car',
            selectedIcon: 'mat_solid:directions_car',
            link        : [ '/logistics', 'fleet-control' ]
        },
        {
            id          : 'active-sessions',
            title       : this.#ts.translate('operations.logistics.fleet.active-sessions.title'),
            description : this.#ts.translate('operations.logistics.fleet.active.description'),
            icon        : 'mat_outline:timer',
            selectedIcon: 'mat_solid:timer',
            link        : [ '/logistics', 'active-sessions' ]
        },
        {
            id          : 'history',
            title       : this.#ts.translate('operations.logistics.fleet.history.title'),
            description : this.#ts.translate('operations.logistics.fleet.history.description'),
            icon        : 'mat_outline:history',
            selectedIcon: 'mat_solid:history',
            link        : [ '/logistics', 'history' ]
        }
    ]);
}
