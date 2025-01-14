import { NgFor, NgTemplateOutlet }                                                                     from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule }                                                                             from '@angular/material/button';
import { MatMenuModule }                                                                               from '@angular/material/menu';

import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { StorageService }                                         from '@fuse/services/storage';
import { AvailableLangs, TranslocoService }                       from '@ngneat/transloco';
import { take }                                                   from 'rxjs';

@Component({
    selector       : 'languages',
    templateUrl    : './languages.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'languages',
    standalone     : true,
    imports        : [ MatButtonModule, MatMenuModule, NgTemplateOutlet, NgFor ],
})
export class LanguagesComponent implements OnInit, OnDestroy {
    availableLangs: AvailableLangs;
    activeLang: string;
    flagCodes: any;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseNavigationService: FuseNavigationService,
        private _translocoService: TranslocoService,
        private _storageService: StorageService,
    ) {
    }

    ngOnInit(): void {
        // Get the available languages from transloco
        this.availableLangs = this._translocoService.getAvailableLangs();

        // Subscribe to language changes
        this._translocoService.langChanges$.subscribe((activeLang) => {
            // Get the active lang
            this.activeLang = activeLang;

            // Update the navigation
            this._updateNavigation(activeLang);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // Set the country iso codes for languages for flags
        this.flagCodes = {
            'en': 'us',
            'es': 'es',
        };
    }

    ngOnDestroy(): void {
    }

    setActiveLang(lang: string): void {
        // Set mew active lang in storage
        this._storageService.set('activeLang', lang).then();

        // Set the active lang
        this._translocoService.setActiveLang(lang);
        this._updateNavigation(lang);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    private _updateNavigation(lang: string): void {
        // For the demonstration purposes, we will only update the Dashboard names
        // from the navigation but you can do a full swap and change the entire
        // navigation data.
        //
        // You can import the data from a file or request it from your backend,
        // it's up to you.

        // Get the component -> navigation data -> item
        const navComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

        // Return if the navigation component does not exist
        if (!navComponent) {
            return null;
        }

        // Get the flat navigation data
        const navigation = navComponent.navigation;

        // Get the Project dashboard item and update its title
        const projectDashboardItem = this._fuseNavigationService.getItem('dashboards.project', navigation);
        if (projectDashboardItem) {
            this._translocoService.selectTranslate('Project').pipe(take(1))
                .subscribe((translation) => {
                    // Set the title
                    projectDashboardItem.title = translation;

                    // Refresh the navigation component
                    navComponent.refresh();
                });
        }

        // Get the Analytics dashboard item and update its title
        const analyticsDashboardItem = this._fuseNavigationService.getItem('dashboards.analytics', navigation);
        if (analyticsDashboardItem) {
            this._translocoService.selectTranslate('Analytics').pipe(take(1))
                .subscribe((translation) => {
                    // Set the title
                    analyticsDashboardItem.title = translation;

                    // Refresh the navigation component
                    navComponent.refresh();
                });
        }
    }
}
