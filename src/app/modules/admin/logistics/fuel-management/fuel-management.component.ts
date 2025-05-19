import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';
import { RouterOutlet }                              from '@angular/router';
import { PermissionsService }                        from '@core/permissions/permissions.service';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { FUEL_MANAGEMENT_KEY }                       from '@modules/admin/logistics/fuel-management/fuel-management.permissions';
import { LOGISTICS_FEATURE_KEY }                     from '@modules/admin/logistics/logistics.permissions';

@Component({
    selector  : 'app-fuel-management',
    standalone: true,
    imports   : [
        DrawerListingComponent,
        DrawerContentComponent,
        RouterOutlet
    ],
    template  : `
        <drawer-listing
            [panels]="panels()"
            [selectedPanel]="'fuel-management'"
            [title]="'Gestion de Combustible'"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>
    `
})
export class FuelManagementComponent {
    readonly #permissionsService = inject(PermissionsService);

    panels: WritableSignal<PanelType[]> = signal(this.#permissionsService.getModulePanels(LOGISTICS_FEATURE_KEY, FUEL_MANAGEMENT_KEY));
}
