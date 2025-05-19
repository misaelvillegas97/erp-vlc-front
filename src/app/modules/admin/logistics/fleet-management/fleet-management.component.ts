import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoPipe, TranslocoService }           from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';
import { PermissionsService }                        from '@core/permissions/permissions.service';
import { FLEET_MANAGEMENT_KEY }                      from '@modules/admin/logistics/fleet-management/fleet-management.permissions';
import { LOGISTICS_FEATURE_KEY }                     from '@modules/admin/logistics/logistics.permissions';

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
            [title]="'operations.logistics.fleet.title' | transloco"
        >
            <drawer-content class="h-full">
                <router-outlet></router-outlet>
            </drawer-content>
        </drawer-listing>
    `
})
export class FleetManagementComponent {
    readonly #ts = inject(TranslocoService);
    readonly #permissionsService = inject(PermissionsService);

    // Obtener los paneles del módulo de logística desde el servicio de permisos centralizado
    // y aplicar traducciones donde sea necesario
    panels: WritableSignal<PanelType[]> = signal(
        this.#permissionsService.getModulePanels(LOGISTICS_FEATURE_KEY, FLEET_MANAGEMENT_KEY).map(panel => {
            // Aplicar traducciones para títulos que usan claves de traducción
            if (panel.title?.startsWith('operations.logistics')) {
                return {
                    ...panel,
                    title      : this.#ts.translate(panel.title),
                    description: panel.description?.startsWith('operations.logistics')
                        ? this.#ts.translate(panel.description)
                        : panel.description
                };
            }
            return panel;
        })
    );
}
