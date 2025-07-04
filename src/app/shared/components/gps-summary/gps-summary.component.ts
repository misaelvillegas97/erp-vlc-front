import { ChangeDetectionStrategy, Component, Input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { CommonModule }                                                                from '@angular/common';
import { MatIconModule }                                                               from '@angular/material/icon';
import { GpsGeneric }                                                                  from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { calculateDistance }                                                           from '@shared/utils/gps.utils';

@Component({
    selector       : 'app-gps-summary',
    standalone     : true,
    imports        : [
        CommonModule,
        MatIconModule
    ],
    templateUrl    : './gps-summary.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsSummaryComponent implements OnChanges {
    @Input() gpsData: GpsGeneric[] = [];

    // Computed values
    maxSpeed = signal<number | undefined>(undefined);
    totalDistance = signal<number | undefined>(undefined);

    // Responsive settings
    isMobile = signal<boolean>(window.innerWidth < 768);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['gpsData'] && this.gpsData) {
            this.calculateStats();
        }

        // Check for mobile view
        window.addEventListener('resize', () => {
            this.isMobile.set(window.innerWidth < 768);
        });
    }

    /**
     * Calculate statistics from GPS data
     */
    private calculateStats(): void {
        if (!this.gpsData || this.gpsData.length === 0) {
            this.maxSpeed.set(undefined);
            this.totalDistance.set(undefined);
            return;
        }

        // Calculate max speed
        const maxSpeed = this.gpsData.reduce((max, point) =>
            Math.max(max, point.speed || 0), 0);
        this.maxSpeed.set(maxSpeed);

        // Calculate total distance
        const meters = calculateDistance(this.gpsData);
        this.totalDistance.set(meters / 1000); // Convert to kilometers
    }

    /**
     * Format speed value
     */
    formatSpeed(speed: number | undefined): string {
        if (speed === undefined) {
            return 'N/A';
        }
        return `${ speed.toFixed(1) } km/h`;
    }

    /**
     * Format distance value
     */
    formatDistance(distance: number | undefined): string {
        if (distance === undefined) {
            return 'N/A';
        }
        return `${ distance.toFixed(2) } km`;
    }
}
