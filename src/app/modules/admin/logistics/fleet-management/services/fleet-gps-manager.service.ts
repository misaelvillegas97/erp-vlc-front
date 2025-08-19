import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed }                     from '@angular/core/rxjs-interop';
import { Observable, of }                         from 'rxjs';
import { take, catchError }                       from 'rxjs/operators';
import { Notyf }                                  from 'notyf';

import { GeolocationService } from './geolocation.service';
import { GeoLocation }        from '../domain/model/vehicle-session.model';

/**
 * Service to manage GPS-related functionality for fleet control.
 * Handles geolocation permissions, position tracking, and GPS status management.
 * Extracted from FleetControlComponent to improve separation of concerns.
 */
@Injectable({
    providedIn: 'root'
})
export class FleetGpsManagerService {
    private readonly geolocationService = inject(GeolocationService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly notyf = new Notyf();

    // GPS state signals
    readonly hasGeolocationPermission = signal(false);
    readonly currentLocation = signal<GeoLocation | null>(null);
    readonly gpsState = signal<'active' | 'inactive' | 'loading'>('inactive');

    // Private flag to track GPS warning dialog display
    private hasShownGpsWarning = false;

    /**
     * Initializes GPS functionality and requests initial position.
     * Should be called when the component needs GPS functionality.
     * @returns Promise that resolves when GPS initialization is complete
     */
    async initializeGPS(): Promise<void> {
        this.gpsState.set('loading');

        try {
            const location = await this.getCurrentPosition();
            if (location) {
                this.currentLocation.set(location);
                this.hasGeolocationPermission.set(true);
                this.gpsState.set('active');
            } else {
                this.hasGeolocationPermission.set(false);
                this.gpsState.set('inactive');
            }
        } catch (error) {
            console.error('GPS initialization failed:', error);
            this.hasGeolocationPermission.set(false);
            this.gpsState.set('inactive');
            this.showGpsError();
        }
    }

    /**
     * Gets the current GPS position.
     * @returns Promise<GeoLocation | null> Current position or null if unavailable
     */
    async getCurrentPosition(): Promise<GeoLocation | null> {
        try {
            const position = await this.geolocationService
                .getCurrentPosition()
                .pipe(
                    take(1),
                    takeUntilDestroyed(this.destroyRef),
                    catchError((error) => {
                        console.error('Error getting current position:', error);
                        return of(null);
                    })
                )
                .toPromise();

            return position || null;
        } catch (error) {
            console.error('Failed to get current position:', error);
            return null;
        }
    }

    /**
     * Refreshes the current GPS position.
     * @returns Promise<GeoLocation | null> Updated position or null if unavailable
     */
    async refreshPosition(): Promise<GeoLocation | null> {
        this.gpsState.set('loading');

        const location = await this.getCurrentPosition();
        if (location) {
            this.currentLocation.set(location);
            this.gpsState.set('active');
            return location;
        } else {
            this.gpsState.set('inactive');
            this.showGpsError();
            return null;
        }
    }

    /**
     * Validates that GPS is available and location is current.
     * @returns Object with validation status and error message
     */
    validateGpsStatus(): { isValid: boolean; error?: string } {
        if (!this.hasGeolocationPermission()) {
            return {
                isValid: false,
                error  : 'Los permisos de ubicación no están habilitados'
            };
        }

        if (!this.currentLocation()) {
            return {
                isValid: false,
                error  : 'No se pudo obtener la ubicación actual'
            };
        }

        return {isValid: true};
    }

    /**
     * Checks if the GPS warning dialog should be shown.
     * Manages the logic for showing the warning only once per session.
     * @returns boolean indicating if the warning should be shown
     */
    shouldShowGpsWarning(): boolean {
        // Don't show if permissions are already granted
        if (this.hasGeolocationPermission()) {
            return false;
        }

        // Don't show if already shown in this session
        if (this.hasShownGpsWarning) {
            return false;
        }

        // Check localStorage for session persistence
        const hasShownBefore = localStorage.getItem('hasShownGpsWarning');
        if (hasShownBefore) {
            return false;
        }

        return true;
    }

    /**
     * Marks that the GPS warning dialog has been shown.
     * Updates both session flag and localStorage.
     */
    markGpsWarningShown(): void {
        this.hasShownGpsWarning = true;
        localStorage.setItem('hasShownGpsWarning', 'true');
    }

    /**
     * Clears the GPS warning flag (useful for testing or reset scenarios).
     */
    clearGpsWarningFlag(): void {
        this.hasShownGpsWarning = false;
        localStorage.removeItem('hasShownGpsWarning');
    }

    /**
     * Gets a formatted location string for display purposes.
     * @returns string Formatted location or error message
     */
    getLocationDisplayText(): string {
        const location = this.currentLocation();
        if (!location) {
            return 'Ubicación no disponible';
        }

        return `${ location.latitude.toFixed(6) }, ${ location.longitude.toFixed(6) }`;
    }

    /**
     * Gets GPS accuracy information if available.
     * @returns string Accuracy information or 'No disponible'
     */
    getAccuracyDisplayText(): string {
        const location = this.currentLocation();
        if (!location?.accuracy) {
            return 'No disponible';
        }

        return `±${ Math.round(location.accuracy) }m`;
    }

    /**
     * Shows GPS error notification to user.
     */
    private showGpsError(): void {
        this.notyf.error({
            message : 'No se pudo acceder a la ubicación GPS. Por favor, asegúrese de que está habilitada.',
            duration: 5000,
            ripple  : true
        });
    }
}
