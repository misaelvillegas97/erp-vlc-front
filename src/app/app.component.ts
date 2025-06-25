import { Component, inject }         from '@angular/core';
import { registerLocaleData }        from '@angular/common';
import localeEs                      from '@angular/common/locales/es';
import { RouterOutlet }              from '@angular/router';
import { OfflineIndicatorComponent } from '@core/pwa/offline-indicator/offline-indicator.component';
import { PwaUpdateService }          from '@core/pwa/pwa-update.service';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : [ './app.component.scss' ],
    standalone : true,
    imports: [ RouterOutlet, OfflineIndicatorComponent ],
    providers  : [],
})
export class AppComponent {
    private pwaUpdateService = inject(PwaUpdateService);

    constructor() {
        registerLocaleData(localeEs);

        // Check for updates when the app starts
        this.pwaUpdateService.checkForUpdates().then(hasUpdate => {
            if (hasUpdate) {
                console.log('Update available and ready to install');
            }
        });
    }
}
