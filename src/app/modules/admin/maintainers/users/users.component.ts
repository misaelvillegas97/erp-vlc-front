import { Component, inject }                                   from '@angular/core';
import { DrawerListingComponent }                              from '@shared/components/drawer-listing/drawer-listing.component';
import { RouterOutlet }                                        from '@angular/router';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';

@Component({
    selector   : 'app-users',
    imports    : [
        DrawerListingComponent,
        RouterOutlet,
        TranslocoDirective,
        TranslocoPipe
    ],
    templateUrl: './users.component.html'
})
export class UsersComponent {
    readonly #ts = inject(TranslocoService);
    readonly panels = [
        {
            id          : 'users.list',
            icon        : 'heroicons_outline:queue-list',
            selectedIcon: 'heroicons_solid:queue-list',
            title       : this.#ts.translate('maintainers.users.list.title'),
            description : this.#ts.translate('maintainers.users.list.description'),
            link        : [ '/maintainers', 'users' ]
        },
        {
            id          : 'users.new',
            icon        : 'heroicons_outline:plus-circle',
            selectedIcon: 'heroicons_solid:plus-circle',
            title       : this.#ts.translate('maintainers.users.new.title'),
            description : this.#ts.translate('maintainers.users.new.description'),
            link        : [ '/maintainers', 'users', 'new' ]
        },
    ];

}
