import { Injectable }                from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of }            from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConditionalPreloadStrategy implements PreloadingStrategy {

    /**
     * Preload route only if connection is fast (Wi-Fi or high-speed mobile)
     */
    preload(route: Route, fn: () => Observable<any>): Observable<any> {
        // Check if route should be preloaded based on data flag
        if (route.data && route.data['preload'] === false) {
            return of(null);
        }

        // Check network connection
        if (this.isSlowConnection()) {
            return of(null);
        }

        // Preload the route
        return fn();
    }

    /**
     * Determine if connection is slow based on NetworkInformation API
     */
    private isSlowConnection(): boolean {
        // Check if NetworkInformation API is available
        if (!('connection' in navigator)) {
            // If API not available, assume fast connection for desktop
            return false;
        }

        const connection = this.getConnectionInfo();

        if (!connection.available) return false;

        // Consider connection slow if:
        // 1. effectiveType is '2g' or 'slow-2g'
        // 2. saveData is enabled (user opted for data saving)
        // 3. downlink is less than 1 Mbps
        const slowTypes = [ 'slow-2g', '2g' ];
        const isSlowType = slowTypes.includes(connection.effectiveType);
        const isSaveDataEnabled = connection.saveData === true;
        const isSlowDownlink = connection.downlink && connection.downlink < 1;

        return isSlowType || isSaveDataEnabled || isSlowDownlink;
    }

    /**
     * Check if user is on Wi-Fi (when API supports it)
     */
    private isWiFi(): boolean {
        if (!('connection' in navigator)) {
            return false;
        }

        const connection = (navigator as any).connection;
        return connection && connection.type === 'wifi';
    }

    /**
     * Get connection information for debugging
     */
    getConnectionInfo(): any {
        if (!('connection' in navigator)) {
            return {available: false, reason: 'NetworkInformation API not supported'};
        }

        const connection = (navigator as any).connection;

        if (!connection) {
            return {available: false, reason: 'Connection object not available'};
        }

        return {
            available    : true,
            effectiveType: connection.effectiveType,
            downlink     : connection.downlink,
            rtt          : connection.rtt,
            saveData     : connection.saveData,
            type         : connection.type
        };
    }
}
