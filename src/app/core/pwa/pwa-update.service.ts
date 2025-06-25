import { inject, Injectable }          from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter }                      from 'rxjs/operators';
import { environment }                 from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PwaUpdateService {
    private swUpdate = inject(SwUpdate);

    constructor() {
        // Subscribe to version updates
        this.swUpdate.versionUpdates
            .pipe(
                filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
            )
            .subscribe(evt => {
                // Log the update details
                console.log(`Current app version: ${ evt.currentVersion.hash }`);
                console.log(`New app version available: ${ evt.latestVersion.hash }`);

                // Show update notification to the user
                this.showUpdateNotification();
            });
    }

    /**
     * Manually check for updates
     */
    checkForUpdates(): Promise<boolean> {
        console.log('Is production mode:', environment.production);
        if (!this.swUpdate.isEnabled) {
            console.log('Service Worker updates are not enabled. This is expected in development mode.');
            console.log('To enable service worker updates, run the application in production mode:');
            console.log('- Use "npm run start:prod" for development with production configuration');
            console.log('- Use "npm run serve:prod" for a full production build and server');
            return Promise.resolve(false);
        }

        console.log('Checking for updates...');
        return this.swUpdate.checkForUpdate();
    }

    /**
     * Show a notification to the user about the update
     */
    private showUpdateNotification(): void {
        // Check if the browser supports notifications
        if ('Notification' in window) {
            // If permission is already granted, show notification
            if (Notification.permission === 'granted') {
                this.createUpdateNotification();
            }
            // If permission is not denied, request it
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.createUpdateNotification();
                    }
                });
            }
        }

        // Also show an alert for browsers that don't support notifications
        // or if notifications are denied
        if (confirm('Hay una nueva versión disponible. ¿Desea actualizar ahora?')) {
            this.activateUpdate();
        }
    }

    /**
     * Create a notification for the update
     */
    private createUpdateNotification(): void {
        const notification = new Notification('Actualización disponible', {
            body: 'Hay una nueva versión de la aplicación disponible. Haga clic para actualizar.',
            icon: 'assets/icons/icon-128x128.png'
        });

        notification.onclick = () => {
            this.activateUpdate();
        };
    }

    /**
     * Activate the update and reload the page
     */
    private activateUpdate(): void {
        this.swUpdate.activateUpdate().then(() => {
            window.location.reload();
        });
    }
}
