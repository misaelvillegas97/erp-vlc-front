import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';
import { RouterOutlet }                              from '@angular/router';
import { PermissionsService }                        from '@core/permissions/permissions.service';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { PREVENTIVE_MAINTENANCE_KEY }                from '@modules/admin/logistics/preventive-maintenance/preventive-maintenance.permissions';
import { LOGISTICS_FEATURE_KEY }                     from '@modules/admin/logistics/logistics.permissions';

@Component({
    selector  : 'app-preventive-maintenance',
    standalone: true,
    imports   : [
        DrawerListingComponent,
        DrawerContentComponent,
        RouterOutlet
    ],
    template  : `
        <drawer-listing
            [panels]="panels()"
            [selectedPanel]="'preventive-maintenance'"
            [title]="'Mantenimiento Preventivo'"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>
    `
})
export class PreventiveMaintenanceComponent {
    readonly #permissionsService = inject(PermissionsService);

    panels: WritableSignal<PanelType[]> = signal(this.#permissionsService.getModulePanels(LOGISTICS_FEATURE_KEY, PREVENTIVE_MAINTENANCE_KEY));
}
