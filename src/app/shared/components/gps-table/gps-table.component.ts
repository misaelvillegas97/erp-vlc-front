import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule }                                              from '@angular/common';
import { MatIconModule }                                             from '@angular/material/icon';
import { GpsGeneric }                                                from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';

@Component({
    selector       : 'app-gps-table',
    standalone     : true,
    imports        : [
        CommonModule,
        MatIconModule
    ],
    templateUrl    : './gps-table.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsTableComponent implements OnInit {
    @Input() gpsData: GpsGeneric[] = [];
    @Input() title: string = 'Registro de puntos GPS';

    // Responsive settings
    isMobile = signal<boolean>(false);

    ngOnInit(): void {
        // Check if we're on a mobile device
        this.checkMobileView();

        // Listen for window resize events
        window.addEventListener('resize', () => this.checkMobileView());
    }

    /**
     * Checks if the current view is mobile based on screen width
     */
    private checkMobileView(): void {
        this.isMobile.set(window.innerWidth < 768);
    }

    /**
     * Format timestamp to readable date/time
     */
    formatDateTime(timestamp: number): string {
        if (!timestamp) {
            return 'N/A';
        }

        const date = new Date(timestamp * 1000);
        return date.toLocaleString('es-ES', {
            day   : '2-digit',
            month : '2-digit',
            year  : 'numeric',
            hour  : '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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
