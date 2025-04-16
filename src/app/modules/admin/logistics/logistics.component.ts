import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DrawerListingComponent }                    from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                              from '@angular/router';
import { TranslocoPipe, TranslocoService }           from '@ngneat/transloco';
import { PanelType }                                 from '@shared/components/drawer-listing/panel.type';
import { DrawerContentComponent }                    from '@shared/components/drawer-listing/components/drawer-content.component';
import { LocationTrackingService }                   from './services/location-tracking.service';

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
export class LogisticsComponent {
    readonly #ts = inject(TranslocoService);
    readonly #locationTrackingService = inject(LocationTrackingService);

    // Verificar si es un dispositivo móvil para mostrar condicionalmente el panel de Modo Conducción
    readonly isMobileDevice = this.#locationTrackingService.isMobileOrTablet();

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
            description: this.#ts.translate('operations.logistics.fleet.active-sessions.description'),
            icon        : 'mat_outline:timer',
            selectedIcon: 'mat_solid:timer',
            link        : [ '/logistics', 'active-sessions' ]
        },
        {
            id          : 'driving-mode',
            title       : 'Modo Conducción',
            description : 'Ver detalles de la sesión en tiempo real',
            icon        : 'heroicons_outline:map',
            selectedIcon: 'heroicons_solid:map',
            link        : [ '/logistics', 'driving-mode' ],
            highlighted : this.isMobileDevice // destacar en dispositivos móviles
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
