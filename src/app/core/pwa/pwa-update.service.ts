import { inject, Injectable }          from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter }                      from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class PwaUpdateService {
    private swUpdate = inject(SwUpdate);

    constructor() {
        // Subscribe to version updates
        this.swUpdate.versionUpdates
            .pipe(
                filter((evt): evt is VersionReadyEvent => {
                    console.log('Version update event:', evt);
                    return evt.type === 'VERSION_READY';
                })
            )
            .subscribe(evt => {
                // Log the update details
                console.log(`Current app version: ${ evt.currentVersion.hash }`);
                console.log(`New app version available: ${ evt.latestVersion.hash }`);

                window.location.reload();

                // Show update notification to the user
                this.showUpdateNotification();
            });
    }

    /**
     * Manually check for updates
     */
    checkForUpdates(): Promise<boolean> {
        if (!this.swUpdate.isEnabled) {
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
        this.activateUpdate();
        // if (confirm('Hay una nueva versión disponible. ¿Desea actualizar ahora?')) {}
    }

    /**
     * Create a notification for the update
     */
    private createUpdateNotification(): void {
        const notification = new Notification('Actualización disponible', {
            body: 'Hay una nueva versión de la aplicación disponible. Haga clic para actualizar.',
            icon: 'icons/icon-128x128.png'
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
