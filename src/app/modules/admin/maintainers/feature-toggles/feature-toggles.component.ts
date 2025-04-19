import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoPipe, TranslocoService }           from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';

@Component({
    selector  : 'app-feature-toggles',
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
            [title]="'maintainers.feature-toggles.title' | transloco"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>
    `
})
export class FeatureTogglesComponent {
    readonly #ts = inject(TranslocoService);

    panels: WritableSignal<PanelType[]> = signal([
        {
            id          : 'feature-toggles.list',
            title       : this.#ts.translate('maintainers.feature-toggles.list.title'),
            description : this.#ts.translate('maintainers.feature-toggles.list.description'),
            icon        : 'mat_outline:toggle_off',
            selectedIcon: 'mat_solid:toggle_on',
            link        : [ '/maintainers', 'feature-toggles', 'list' ]
        },
        {
            id          : 'feature-toggles.new',
            title       : this.#ts.translate('maintainers.feature-toggles.new.title'),
            description : this.#ts.translate('maintainers.feature-toggles.new.description'),
            icon        : 'heroicons_outline:plus-circle',
            selectedIcon: 'heroicons_solid:plus-circle',
            link        : [ '/maintainers', 'feature-toggles', 'new' ]
        }
    ]);
}
