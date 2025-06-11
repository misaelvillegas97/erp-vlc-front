import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoService }                          from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';
import { PermissionsService }                        from '@core/permissions/permissions.service';
import { INVENTORY_FEATURE_KEY }                     from './inventory.permissions';

@Component({
    selector  : 'app-inventory',
    standalone: true,
    imports   : [
        DrawerListingComponent,
        DrawerContentComponent,
        RouterOutlet,
    ],
    template  : `
        <drawer-listing
            [panels]="panels()"
            [selectedPanel]="'inventory-items'"
            [title]="'Inventario'"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>
    `
})
export class InventoryComponent {
    readonly #ts = inject(TranslocoService);
    readonly #permissionsService = inject(PermissionsService);

    // Get the panels for the inventory module from the centralized permissions service
    // No need to apply translations as all text is now in Spanish
    panels: WritableSignal<PanelType[]> = signal(
        this.#permissionsService.getModulePanels(INVENTORY_FEATURE_KEY)
    );
}
