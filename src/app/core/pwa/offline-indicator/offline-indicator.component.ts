import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                         from '@angular/common';
import { MatSnackBar, MatSnackBarModule }       from '@angular/material/snack-bar';

@Component({
    selector  : 'app-offline-indicator',
    standalone: true,
    imports   : [ CommonModule, MatSnackBarModule ],
    template  : `
        <div *ngIf="isOffline()" class="offline-banner">
            <span>Estás trabajando en modo offline</span>
        </div>
    `,
    styles    : [ `
        .offline-banner {
            background-color: #f44336;
            color: white;
            text-align: center;
            padding: 10px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
        }
    ` ]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
    isOffline = signal<boolean>(false);
    private snackBarRef: any;

    constructor(private snackBar: MatSnackBar) {}

    ngOnInit(): void {
        // Check initial online status
        this.isOffline.set(!navigator.onLine);

        // Add event listeners for online/offline events
        window.addEventListener('online', this.handleOnlineEvent);
        window.addEventListener('offline', this.handleOfflineEvent);

        // Show snackbar if offline at startup
        if (this.isOffline()) {
            this.showOfflineSnackbar();
        }
    }

    ngOnDestroy(): void {
        // Remove event listeners
        window.removeEventListener('online', this.handleOnlineEvent);
        window.removeEventListener('offline', this.handleOfflineEvent);

        // Close snackbar if open
        if (this.snackBarRef) {
            this.snackBarRef.dismiss();
        }
    }

    private handleOnlineEvent = (): void => {
        this.isOffline.set(false);
        this.showOnlineSnackbar();
    };

    private handleOfflineEvent = (): void => {
        this.isOffline.set(true);
        this.showOfflineSnackbar();
    };

    private showOfflineSnackbar(): void {
        if (this.snackBarRef) {
            this.snackBarRef.dismiss();
        }

        this.snackBarRef = this.snackBar.open(
            'Estás trabajando en modo offline. Algunas funciones pueden no estar disponibles.',
            'Entendido',
            {
                duration  : 5000,
                panelClass: 'offline-snackbar'
            }
        );
    }

    private showOnlineSnackbar(): void {
        if (this.snackBarRef) {
            this.snackBarRef.dismiss();
        }

        this.snackBarRef = this.snackBar.open(
            'Conexión restablecida.',
            'Entendido',
            {
                duration  : 3000,
                panelClass: 'online-snackbar'
            }
        );
    }
}
