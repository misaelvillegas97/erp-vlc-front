import { Component, Inject }                              from '@angular/core';
import { CommonModule }                                   from '@angular/common';
import { MatButtonModule }                                from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule }                                  from '@angular/material/icon';
import { MatTooltipModule }                               from '@angular/material/tooltip';
import { getStaticMapUrl }                                from '@shared/utils/gps.utils';

export interface LocationPreviewDialogData {
    latitude: number;
    longitude: number;
    locationName?: string;
}

@Component({
    selector  : 'app-location-preview-dialog',
    standalone: true,
    imports   : [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatTooltipModule
    ],
    template  : `
        <div mat-dialog-title class="flex items-center py-2">
            <h2 class="text-xl font-semibold">Vista previa de ubicación</h2>
            <button mat-icon-button mat-dialog-close class="ml-auto" aria-label="Cerrar diálogo">
                <mat-icon>close</mat-icon>
            </button>
        </div>
        <mat-dialog-content>
            <div class="mb-4">
                <div class="flex items-center mb-2">
                    <mat-icon class="text-blue-500 mr-1">location_on</mat-icon>
                    <span class="font-medium">{{ formatDecimalCoordinates(data.latitude, data.longitude) }}</span>
                </div>
                <div class="text-sm text-gray-500">
                    {{ formatCoordinates(data.latitude, data.longitude) }}
                </div>
                <div *ngIf="data.locationName" class="mt-2 text-sm">
                    <span class="font-medium">Nombre:</span> {{ data.locationName }}
                </div>
            </div>

            <div class="relative mb-4">
                <div class="w-full h-[500px] bg-hover rounded-lg overflow-hidden">
                    <img
                        [src]="getMapImageUrl()"
                        alt="Mapa de la ubicación"
                        class="w-full h-full object-cover"
                        (error)="handleImageError()"
                    />
                    <div *ngIf="imageError" class="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <div class="text-center p-4">
                            <mat-icon class="text-4xl text-gray-400 mb-2">error_outline</mat-icon>
                            <p class="text-gray-600">No se pudo cargar la imagen del mapa</p>
                        </div>
                    </div>
                </div>
            </div>
        </mat-dialog-content>

        <mat-dialog-actions class="w-full flex flex-col sm:flex-row justify-end gap-3">
            <button
                class="flex-1 w-full sm:w-auto m-0"
                mat-stroked-button
                color="primary"
                (click)="openMapInNewTab()"
                matTooltip="Abrir imagen en una nueva pestaña"
            >
                <mat-icon class="mr-2">open_in_new</mat-icon>
                Ver imagen completa
            </button>
            <button
                class="flex-1 w-full sm:w-auto m-0"
                mat-raised-button
                color="primary"
                (click)="openGoogleMaps()"
            >
                <mat-icon class="mr-2">map</mat-icon>
                Ver en Google Maps
            </button>
        </mat-dialog-actions>
    `
})
export class LocationPreviewDialogComponent {
    imageError = false;

    constructor(
        public dialogRef: MatDialogRef<LocationPreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: LocationPreviewDialogData
    ) {}

    /**
     * Formats decimal coordinates in a simplified way
     */
    formatDecimalCoordinates(latitude: number, longitude: number): string {
        return `${ latitude.toFixed(4) }, ${ longitude.toFixed(4) }`;
    }

    /**
     * Converts decimal coordinates to DMS (degrees, minutes, seconds) format
     */
    formatCoordinateToDMS(coordinate: number, isLatitude: boolean): string {
        const absolute = Math.abs(coordinate);
        const degrees = Math.floor(absolute);
        const minutesNotTruncated = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesNotTruncated);
        const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

        const direction = isLatitude
            ? (coordinate >= 0 ? 'N' : 'S')
            : (coordinate >= 0 ? 'E' : 'O');

        return `${ degrees }° ${ minutes }' ${ seconds }" ${ direction }`;
    }

    /**
     * Formats coordinates in a human-readable way
     */
    formatCoordinates(latitude: number, longitude: number): string {
        return `${ this.formatCoordinateToDMS(latitude, true) }, ${ this.formatCoordinateToDMS(longitude, false) }`;
    }

    /**
     * Gets the URL for the map image
     */
    getMapImageUrl(): string {
        // Use a larger size for the dialog
        return getStaticMapUrl([ {lat: this.data.latitude, lon: this.data.longitude} ], 17, 1024, 720);
    }

    /**
     * Opens the map image in a new tab
     */
    openMapInNewTab(): void {
        const url = this.getMapImageUrl();
        window.open(url, '_blank');
    }

    /**
     * Opens Google Maps in a new tab
     */
    openGoogleMaps(): void {
        const url = `https://www.google.com/maps?q=${ this.data.latitude },${ this.data.longitude }`;
        window.open(url, '_blank');
    }

    /**
     * Handles image loading errors
     */
    handleImageError(): void {
        this.imageError = true;
    }
}
