import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoPipe, TranslocoService }           from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';

@Component({
    selector  : 'app-vehicles',
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
            [selectedPanel]="'list'"
            [title]="'maintainers.vehicles.title' | transloco"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>
    `
})
export class VehiclesComponent {
    readonly #ts = inject(TranslocoService);

    panels: WritableSignal<PanelType[]> = signal([
        {
            id          : 'vehicles.list',
            title       : this.#ts.translate('maintainers.vehicles.list.title'),
            description : this.#ts.translate('maintainers.vehicles.list.description'),
            icon        : 'mat_outline:directions_car',
            selectedIcon: 'mat_solid:directions_car',
            link        : [ '/maintainers', 'vehicles', 'list' ]
        },
        {
            id          : 'vehicles.new',
            title       : this.#ts.translate('maintainers.vehicles.new.title'),
            description : this.#ts.translate('maintainers.vehicles.new.description'),
            icon        : 'mat_outline:add_circle',
            selectedIcon: 'mat_solid:add_circle',
            link        : [ '/maintainers', 'vehicles', 'new' ]
        }
    ]);
}
