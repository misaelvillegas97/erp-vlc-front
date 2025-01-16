import { Component }                                           from '@angular/core';
import { RouterOutlet }                                        from '@angular/router';
import { DrawerListingComponent }                              from '@shared/components/drawer-listing/drawer-listing.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { PanelType }                                           from '@shared/components/drawer-listing/panel.type';

@Component({
    selector   : 'app-news',
    standalone : true,
    imports    : [
        RouterOutlet,
        DrawerListingComponent,
        TranslocoDirective,
        TranslocoPipe
    ],
    templateUrl: './client.component.html'
})
export class ClientComponent {
    panels: PanelType[];

    constructor(private readonly _translateService: TranslocoService) {
        this.panels = [
            {
                id         : 'clients',
                title      : this._translateService.translate('admin.news.title'),
                description: this._translateService.translate('admin.news.description'),

                children: [
                    {
                        id          : 'news.list',
                        icon        : 'heroicons_outline:newspaper',
                        selectedIcon: 'heroicons_solid:newspaper',
                        title       : this._translateService.translate('admin.news.list.title'),
                        description : this._translateService.translate('admin.news.list.description'),
                        link        : [ '/admin', 'news' ]
                    },
                    {
                        id          : 'news.create',
                        icon        : 'heroicons_outline:plus-circle',
                        selectedIcon: 'heroicons_solid:plus-circle',
                        title       : this._translateService.translate('admin.news.create.title'),
                        description : this._translateService.translate('admin.news.create.description'),
                        link        : [ '/admin', 'news', 'create' ]
                    },
                ]
            },
            {
                id         : 'categories',
                title      : this._translateService.translate('admin.news.categories.title'),
                description: this._translateService.translate('admin.news.categories.description'),
                children   : [
                    {
                        id          : 'categories.list',
                        icon        : 'heroicons_outline:tag',
                        selectedIcon: 'heroicons_solid:tag',
                        title       : this._translateService.translate('admin.news.categories.list.title'),
                        description : this._translateService.translate('admin.news.categories.list.description'),
                        link        : [ '/admin', 'news', 'categories' ]
                    },
                    {
                        id          : 'categories.create',
                        icon        : 'heroicons_outline:plus-circle',
                        selectedIcon: 'heroicons_solid:plus-circle',
                        title       : this._translateService.translate('admin.news.categories.create.title'),
                        description : this._translateService.translate('admin.news.categories.create.description'),
                        link        : [ '/admin', 'news', 'categories', 'create' ]
                    }
                ]
            }
        ];
    }
}
