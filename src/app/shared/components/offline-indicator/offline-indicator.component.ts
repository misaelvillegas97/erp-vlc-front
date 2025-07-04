import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                                  from '@angular/common';
import { MatIconModule }                                                 from '@angular/material/icon';
import { MatButtonModule }                                               from '@angular/material/button';
import { MatTooltipModule }                                              from '@angular/material/tooltip';
import { Subscription }                                                  from 'rxjs';

@Component({
    selector       : 'app-offline-indicator',
    standalone     : true,
    imports        : [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
    ],
    templateUrl    : './offline-indicator.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
    isOffline = signal<boolean>(false);
    private networkStatusSubscription: Subscription | null = null;

    ngOnInit(): void {
        // Check initial network status
        this.isOffline.set(!navigator.onLine);

        // Listen for online/offline events
        window.addEventListener('online', this.handleNetworkChange.bind(this));
        window.addEventListener('offline', this.handleNetworkChange.bind(this));
    }

    ngOnDestroy(): void {
        // Remove event listeners
        window.removeEventListener('online', this.handleNetworkChange.bind(this));
        window.removeEventListener('offline', this.handleNetworkChange.bind(this));

        // Unsubscribe from any subscriptions
        if (this.networkStatusSubscription) {
            this.networkStatusSubscription.unsubscribe();
        }
    }

    /**
     * Handle network status change events
     */
    private handleNetworkChange(): void {
        this.isOffline.set(!navigator.onLine);
    }

    /**
     * Try to reconnect to the network
     */
    tryReconnect(): void {
        // This is mostly a placebo - it will trigger a new network check
        // but the actual reconnection depends on the device's connectivity
        window.location.reload();
    }
}
