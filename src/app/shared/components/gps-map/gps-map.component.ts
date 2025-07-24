import { AfterViewInit, ChangeDetectionStrategy, Component, computed, input, OnChanges, OnDestroy, signal, SimpleChanges, viewChildren } from '@angular/core';
import { CommonModule }                                                                                                                  from '@angular/common';
import { GoogleMapsModule, MapInfoWindow }                                                                                               from '@angular/google-maps';
import { MatButtonModule }                                                                                                               from '@angular/material/button';
import { MatIconModule }                                                                                                                 from '@angular/material/icon';
import { MatSliderModule }                                                                                                               from '@angular/material/slider';
import { MatSelectModule }                                                                                                               from '@angular/material/select';
import { MatTooltipModule }                                                                                                              from '@angular/material/tooltip';
import { GpsGeneric }                                                                                                                    from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { WebGLPathLayer }                                                                                                                from '@shared/utils/webgl-path-layer';

@Component({
    selector       : 'app-gps-map',
    standalone     : true,
    imports        : [
        CommonModule,
        GoogleMapsModule,
        MatButtonModule,
        MatIconModule,
        MatSliderModule,
        MatSelectModule,
        MatTooltipModule
    ],
    templateUrl    : './gps-map.component.html',
    styleUrls      : [ './gps-map.component.scss' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host           : {
        '[class.dark-theme]' : 'isDarkTheme()',
        '[class.light-theme]': '!isDarkTheme()'
    }
})
export class GpsMapComponent implements AfterViewInit, OnChanges, OnDestroy {
    gpsData = input<GpsGeneric[]>();
    isActive = input<boolean>(false);
    playbackMode = input<boolean>(false);

    // Map signals
    mapInstance = signal<google.maps.Map | null>(null);
    mapCenter = signal<google.maps.LatLngLiteral>({lat: 0, lng: 0});
    polylinePath = signal<google.maps.LatLngLiteral[]>([]);

    // Marker signals
    startMarker = signal<any>(null);
    endMarker = signal<any>(null);
    currentPositionMarker = signal<any>(null);
    gpsMarkers = signal<any[]>([]);

    // Info window signals
    selectedMarker = signal<any | null>(null);

    // WebGL layer for complex routes
    private webGLPathLayer: WebGLPathLayer | null = null;

    // Optimization signals
    private lastGpsDataLength = signal<number>(0);
    private lastGpsDataHash = signal<string>('');
    private userInteracting = signal<boolean>(false);
    private mapInitialized = signal<boolean>(false);
    private isFirstDataLoad = signal<boolean>(true);

    // Playback signals
    isPlaying = signal<boolean>(false);
    playbackPosition = signal<number>(0); // Current index in GPS data array
    playbackSpeed = signal<number>(1); // Speed multiplier (1x, 2x, 5x, etc.)
    playbackProgress = signal<number>(0); // Progress percentage (0-100)
    playbackCurrentTime = signal<string>(''); // Current timestamp being shown
    playbackAnimationMarker = signal<any>(null);
    private playbackTimer: any = null;

    // Smooth interpolation signals
    private interpolationProgress = signal<number>(0); // Progress between two GPS points (0-1)
    private interpolationStartPoint = signal<any>(null); // Starting GPS point for interpolation
    private interpolationEndPoint = signal<any>(null); // Ending GPS point for interpolation
    private interpolationTimer: any = null;

    // Zoom control signals for playback
    private originalZoomLevel = signal<number | null>(null); // Original zoom level before playback
    private playbackZoomLevel = signal<number>(15); // Optimal zoom level for playback viewing
    private isPlaybackZoomActive = signal<boolean>(false); // Whether playback zoom is currently active

    infoWindows = viewChildren(MapInfoWindow);

    // Map options with optimized settings for caching
    mapOptions = {
        center           : {lat: 0, lng: 0},
        mapTypeId        : 'roadmap',
        mapTypeControl   : false,
        streetViewControl: false,
        cameraControl    : false,
        fullscreenControl: true,
        keyboardShortcuts: true,
        // Settings that optimize caching
        tilt          : 0, // Disable tilt to improve performance
        clickableIcons: false, // Disable clickable icons to improve performance
        maxZoom       : 18, // Limit max zoom to reduce tile loading
        minZoom       : 3, // Set minimum zoom
        mapId         : 'gps-tracking-map' // Unique ID for the map
    };

    // Info window options with proper pixelOffset and dark theme support
    infoWindowOptions = computed(() => ({
        zIndex        : 1000,
        disableAutoPan: true,
        headerContent : this.headerComputed(),
        pixelOffset   : new google.maps.Size(0, -8),
        // Custom styling for dark theme
        maxWidth      : 300,
        headerDisabled: false,
        closeButton   : false
    }));

    // Check if dark theme is active
    isDarkTheme = computed(() => {
        // You can implement your dark theme detection logic here
        // For example, checking a service, localStorage, or CSS class
        return document.documentElement.classList.contains('dark') ||
            localStorage.getItem('theme') === 'dark' ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Computed header for info window with dark theme support
    headerComputed = computed((): Element => {
        const marker = this.selectedMarker();
        if (marker) {
            const el = document.createElement('div');
            const isDark = this.isDarkTheme();

            el.style.cssText = `
                padding: 8px 12px;
                margin: -8px -12px 8px -12px;
                border-bottom: 1px solid ${ isDark ? '#374151' : '#e5e7eb' };
                background-color: ${ isDark ? '#1f2937' : '#f9fafb' };
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                font-weight: 600;
                color: ${ isDark ? '#f3f4f6' : '#1f2937' };
            `;

            el.innerHTML = marker.title;
            return el;
        }
        return document.createElement('div');
    });

    ngAfterViewInit(): void {
        if (this.gpsData()?.length > 0) {
            this.setupMapData();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['gpsData'] && !changes['gpsData'].firstChange) {
            this.updateMapDataIfNeeded();
        }

        // Handle playback mode changes
        if (changes['playbackMode'] && !changes['playbackMode'].firstChange) {
            const currentPlaybackMode = changes['playbackMode'].currentValue;
            const previousPlaybackMode = changes['playbackMode'].previousValue;

            // If playback mode was turned off, restore original zoom and stop playback
            if (previousPlaybackMode && !currentPlaybackMode) {
                this.stopPlayback();
                this.restoreOriginalZoom();
            }
        }
    }

    ngOnDestroy(): void {
        this.cleanupMarkers();
        this.stopPlayback();
        this.stopInterpolation();

        // Restore original zoom level if playback zoom is active
        if (this.isPlaybackZoomActive()) {
            this.restoreOriginalZoom();
        }
    }

    onMapInitialized(map: google.maps.Map): void {
        this.mapInstance.set(map);
        this.mapInitialized.set(true);

        // Add event listeners to track user interactions
        map.addListener('dragstart', () => this.userInteracting.set(true));
        map.addListener('dragend', () => setTimeout(() => this.userInteracting.set(false), 1000));
        map.addListener('zoom_changed', () => {
            this.userInteracting.set(true);
            setTimeout(() => this.userInteracting.set(false), 2000);
        });
        
        if (this.gpsData()?.length > 0) {
            this.setupMapData();
        }
    }

    private updateMapDataIfNeeded(): void {
        const currentData = this.gpsData();
        if (!currentData || currentData.length === 0) {
            return;
        }

        // Create a simple hash of the GPS data to detect changes
        const currentLength = currentData.length;
        const currentHash = this.createGpsDataHash(currentData);

        // Only update if data has actually changed
        if (currentLength !== this.lastGpsDataLength() || currentHash !== this.lastGpsDataHash()) {
            const previousLength = this.lastGpsDataLength();

            this.lastGpsDataLength.set(currentLength);
            this.lastGpsDataHash.set(currentHash);

            // If only new points were added (common case), use incremental update
            if (currentLength > previousLength && this.mapInitialized() && previousLength > 0) {
                this.incrementalUpdateMapData();
            } else {
                this.setupMapData();
            }
        }
    }

    private createGpsDataHash(data: GpsGeneric[]): string {
        if (!data || data.length === 0) return '';

        // Create hash based on first point, last point, and length
        // This is efficient and catches most changes
        const first = data[0];
        const last = data[data.length - 1];

        return `${ first.latitude }_${ first.longitude }_${ first.timestamp }_${ last.latitude }_${ last.longitude }_${ last.timestamp }_${ data.length }`;
    }

    private incrementalUpdateMapData(): void {
        if (!this.gpsData() || this.gpsData().length === 0 || !this.mapInstance()) {
            return;
        }

        const path = this.gpsData().map(point => ({
            lat: point.latitude,
            lng: point.longitude
        }));

        // Update polyline path
        this.polylinePath.set(path);

        // Update current position marker if active
        if (this.isActive()) {
            const lastPosition = path[path.length - 1];
            this.currentPositionMarker.set({
                position: lastPosition,
                title   : 'Ubicación actual',
                icon    : {
                    path        : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale       : 8,
                    fillColor   : '#34A853',
                    fillOpacity : 0.8,
                    strokeColor : '#FFFFFF',
                    strokeWeight: 2,
                    rotation    : path.length > 1 ? Math.atan2(
                        path[path.length - 1].lat - path[path.length - 2].lat,
                        path[path.length - 1].lng - path[path.length - 2].lng
                    ) * (180 / Math.PI) : 0
                }
            });
        }

        // Don't call fitBounds to preserve user's zoom/pan
    }

    // Playback control methods
    startPlayback(): void {
        if (!this.playbackMode() || !this.gpsData() || this.gpsData().length === 0) {
            return;
        }

        // Store original zoom level and set playback zoom
        this.setPlaybackZoom();

        this.isPlaying.set(true);
        this.animatePlayback();
    }

    pausePlayback(): void {
        this.isPlaying.set(false);
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
        // Stop interpolation when pausing
        this.stopInterpolation();
    }

    stopPlayback(): void {
        this.isPlaying.set(false);
        this.playbackPosition.set(0);
        this.playbackProgress.set(0);
        this.playbackCurrentTime.set('');

        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }

        // Stop interpolation
        this.stopInterpolation();

        // Restore original zoom level
        this.restoreOriginalZoom();

        // Remove animation marker
        this.playbackAnimationMarker.set(null);

        // Reset to show full route
        if (this.playbackMode()) {
            this.setupMapData();
        }
    }

    private stopInterpolation(): void {
        if (this.interpolationTimer) {
            clearTimeout(this.interpolationTimer);
            this.interpolationTimer = null;
        }
        this.interpolationProgress.set(0);
        this.interpolationStartPoint.set(null);
        this.interpolationEndPoint.set(null);
    }

    setPlaybackSpeed(speed: number): void {
        this.playbackSpeed.set(speed);
    }

    setPlaybackPosition(position: number): void {
        const gpsData = this.gpsData();
        if (!gpsData || gpsData.length === 0 || position < 0 || position >= gpsData.length) {
            return;
        }

        // Additional validation to ensure the GPS point at this position exists and has required properties
        const gpsPoint = gpsData[position];
        if (!gpsPoint || typeof gpsPoint.latitude !== 'number' || typeof gpsPoint.longitude !== 'number') {
            console.warn(`Invalid GPS data at position ${ position }:`, gpsPoint);
            return;
        }

        // Stop any ongoing interpolation when manually setting position
        this.stopInterpolation();

        this.playbackPosition.set(position);
        this.updatePlaybackProgress();
        this.updatePlaybackMarker();
    }

    private animatePlayback(): void {
        if (!this.isPlaying() || !this.gpsData() || this.gpsData().length === 0) {
            return;
        }

        const currentPosition = this.playbackPosition();
        const gpsData = this.gpsData();

        if (currentPosition >= gpsData.length - 1) {
            // Playback finished
            this.stopPlayback();
            return;
        }

        // Start smooth interpolation to next point
        const currentPoint = gpsData[currentPosition];
        const nextPoint = gpsData[currentPosition + 1];

        if (currentPoint && nextPoint &&
            typeof currentPoint.latitude === 'number' &&
            typeof currentPoint.longitude === 'number' &&
            typeof nextPoint.latitude === 'number' &&
            typeof nextPoint.longitude === 'number') {

            // Calculate total time for this segment
            let segmentDuration = 1000; // Default 1 second
            if (typeof currentPoint.timestamp === 'number' &&
                typeof nextPoint.timestamp === 'number') {
                const timeDiff = (nextPoint.timestamp - currentPoint.timestamp) * 1000;
                segmentDuration = Math.max(500, timeDiff / this.playbackSpeed()); // Minimum 500ms
            } else {
                segmentDuration = Math.max(500, 1000 / this.playbackSpeed());
            }

            // Start smooth interpolation
            this.startSmoothInterpolation(currentPoint, nextPoint, segmentDuration, () => {
                // Callback when interpolation is complete
                this.playbackPosition.set(currentPosition + 1);
                this.updatePlaybackProgress();

                // Continue to next segment
                this.playbackTimer = setTimeout(() => {
                    this.animatePlayback();
                }, 50); // Small delay before next segment
            });
        } else {
            // Fallback to instant movement if data is invalid
            this.playbackPosition.set(currentPosition + 1);
            this.updatePlaybackProgress();
            this.updatePlaybackMarker();

            this.playbackTimer = setTimeout(() => {
                this.animatePlayback();
            }, 1000 / this.playbackSpeed());
        }
    }

    private startSmoothInterpolation(startPoint: any, endPoint: any, duration: number, onComplete: () => void): void {
        this.stopInterpolation(); // Stop any existing interpolation

        this.interpolationStartPoint.set(startPoint);
        this.interpolationEndPoint.set(endPoint);
        this.interpolationProgress.set(0);

        const startTime = Date.now();
        const interpolationStep = 16; // ~60fps (16ms per frame)

        const animate = () => {
            if (!this.isPlaying()) {
                return; // Stop if playback was paused
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.interpolationProgress.set(progress);
            this.updateSmoothPlaybackMarker();

            if (progress >= 1) {
                // Interpolation complete
                onComplete();
            } else {
                // Continue interpolation
                this.interpolationTimer = setTimeout(animate, interpolationStep);
            }
        };

        animate();
    }

    private updateSmoothPlaybackMarker(): void {
        const startPoint = this.interpolationStartPoint();
        const endPoint = this.interpolationEndPoint();
        const progress = this.interpolationProgress();

        if (!startPoint || !endPoint) {
            return;
        }

        // Linear interpolation between start and end points
        const interpolatedLat = this.lerp(startPoint.latitude, endPoint.latitude, progress);
        const interpolatedLng = this.lerp(startPoint.longitude, endPoint.longitude, progress);

        const position = {
            lat: interpolatedLat,
            lng: interpolatedLng
        };

        // Calculate smooth rotation based on direction of movement
        const rotation = Math.atan2(
            endPoint.latitude - startPoint.latitude,
            endPoint.longitude - startPoint.longitude
        ) * (180 / Math.PI);

        // Create or update animation marker with interpolated position
        this.playbackAnimationMarker.set({
            position: position,
            title   : `Reproducción - Punto ${ this.playbackPosition() + 1 }`,
            icon    : {
                path        : google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale       : 10,
                fillColor   : '#FF6B35',
                fillOpacity : 1,
                strokeColor : '#FFFFFF',
                strokeWeight: 2,
                rotation    : rotation
            }
        });

        // Smoothly pan map to follow the marker and maintain optimal zoom
        if (this.mapInstance()) {
            this.mapInstance().panTo(position);

            // Ensure zoom level remains optimal during playback
            if (this.isPlaybackZoomActive() && this.mapInstance().getZoom() !== this.playbackZoomLevel()) {
                this.mapInstance().setZoom(this.playbackZoomLevel());
            }
        }
    }

    private lerp(start: number, end: number, progress: number): number {
        return start + (end - start) * progress;
    }

    // Zoom control methods for playback
    private setPlaybackZoom(): void {
        if (!this.mapInstance()) {
            return;
        }

        // Store the current zoom level if not already stored
        if (this.originalZoomLevel() === null) {
            const currentZoom = this.mapInstance().getZoom();
            this.originalZoomLevel.set(currentZoom || 10); // Default to 10 if getZoom returns undefined
        }

        // Set the optimal zoom level for playback
        this.mapInstance().setZoom(this.playbackZoomLevel());
        this.isPlaybackZoomActive.set(true);
    }

    private restoreOriginalZoom(): void {
        if (!this.mapInstance() || this.originalZoomLevel() === null) {
            return;
        }

        // Restore the original zoom level
        this.mapInstance().setZoom(this.originalZoomLevel()!);
        this.isPlaybackZoomActive.set(false);
        this.originalZoomLevel.set(null); // Reset for next playback session
    }

    private updatePlaybackProgress(): void {
        const gpsData = this.gpsData();
        const currentPosition = this.playbackPosition();

        if (!gpsData || gpsData.length === 0 || currentPosition < 0 || currentPosition >= gpsData.length) {
            return;
        }

        const progress = (currentPosition / (gpsData.length - 1)) * 100;
        this.playbackProgress.set(Math.min(100, Math.max(0, progress)));

        // Update current time display
        const currentPoint = gpsData[currentPosition];
        if (currentPoint && typeof currentPoint.timestamp === 'number') {
            this.playbackCurrentTime.set(this.formatDateTime(currentPoint.timestamp));
        }
    }

    private updatePlaybackMarker(): void {
        const gpsData = this.gpsData();
        const currentPosition = this.playbackPosition();

        if (!gpsData || gpsData.length === 0 || currentPosition < 0 || currentPosition >= gpsData.length) {
            return;
        }

        const currentPoint = gpsData[currentPosition];
        if (!currentPoint || typeof currentPoint.latitude !== 'number' || typeof currentPoint.longitude !== 'number') {
            console.warn(`Invalid GPS data at position ${ currentPosition }:`, currentPoint);
            return;
        }

        const position = {
            lat: currentPoint.latitude,
            lng: currentPoint.longitude
        };

        // Calculate rotation based on direction of movement
        let rotation = 0;
        if (currentPosition > 0) {
            const prevPoint = gpsData[currentPosition - 1];
            if (prevPoint &&
                typeof prevPoint.latitude === 'number' &&
                typeof prevPoint.longitude === 'number') {
                rotation = Math.atan2(
                    currentPoint.latitude - prevPoint.latitude,
                    currentPoint.longitude - prevPoint.longitude
                ) * (180 / Math.PI);
            }
        }

        // Create or update animation marker
        this.playbackAnimationMarker.set({
            position: position,
            title   : `Reproducción - Punto ${ currentPosition + 1 }`,
            icon    : {
                path        : google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale       : 10,
                fillColor   : '#FF6B35',
                fillOpacity : 1,
                strokeColor : '#FFFFFF',
                strokeWeight: 2,
                rotation    : rotation
            }
        });

        // Center map on current position during playback and maintain optimal zoom
        if (this.mapInstance()) {
            this.mapInstance().panTo(position);

            // Ensure zoom level remains optimal during playback
            if (this.isPlaybackZoomActive() && this.mapInstance().getZoom() !== this.playbackZoomLevel()) {
                this.mapInstance().setZoom(this.playbackZoomLevel());
            }
        }
    }

    onMarkerMouseOver(marker: any): void {
        // Close all info windows first
        this.infoWindows().forEach(infoWindow => infoWindow.close());

        // Set the selected marker
        this.selectedMarker.set(marker);

        // Open the info window after a small delay to ensure the marker is set
        setTimeout(() => {
            this.infoWindows().forEach(infoWindow => infoWindow.open());
        }, 10);
    }

    onMarkerMouseOut(): void {
        // Close info windows when mouse leaves marker
        setTimeout(() => {
            this.infoWindows().forEach(infoWindow => infoWindow.close());
            this.selectedMarker.set(null);
        }, 100); // Small delay to allow moving to info window
    }

    private setupMapData(): void {
        if (!this.gpsData() || this.gpsData().length === 0 || !this.mapInstance()) {
            return;
        }

        this.cleanupMarkers();

        const path = this.gpsData().map(point => ({
            lat: point.latitude,
            lng: point.longitude
        }));

        const lastPosition = path[path.length - 1];
        this.mapCenter.set(lastPosition);

        // Use WebGL for routes with many points (more than 1000)
        if (path.length > 1000) {
            // Don't set polylinePath for WebGL rendering to avoid duplicate lines
            this.polylinePath.set([]);

            try {
                // Create and add the WebGL layer
                if (this.webGLPathLayer) {
                    this.webGLPathLayer.setMap(null);
                }

                this.webGLPathLayer = new WebGLPathLayer(path, {
                    color    : '#4285F4',
                    lineWidth: 3
                });

                // Wait for the map to be fully initialized before setting the WebGL layer
                setTimeout(() => {
                    if (this.webGLPathLayer && this.mapInstance()) {
                        this.webGLPathLayer.setMap(this.mapInstance());
                    }
                }, 100);

            } catch (error) {
                console.warn('Failed to create WebGL layer, falling back to polyline:', error);
                // Fallback to standard polyline if WebGL fails
                this.polylinePath.set(path);
                this.webGLPathLayer = null;
            }
        } else {
            // Use standard polyline for smaller routes
            this.polylinePath.set(path);

            // Make sure no WebGL layer is active
            if (this.webGLPathLayer) {
                this.webGLPathLayer.setMap(null);
                this.webGLPathLayer = null;
            }
        }

        // Create start marker
        this.startMarker.set({
            position: path[0],
            title   : 'Inicio',
            icon    : {
                url       : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRDQUY1MCI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN7ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
                scaledSize: new google.maps.Size(36, 36)
            }
        });

        // Create end marker if session is completed
        if (!this.isActive()) {
            this.endMarker.set({
                position: lastPosition,
                title   : 'Fin',
                icon    : {
                    url       : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0Y0NDMzNiI+PHBhdGggZD0iTTIxIDNMMyA5djFsMi4xIDIuOEwzIDIxaDFsMi44LTIuMUwyMSAyMXYtMWwtMi44LTIuMUwyMSA0VjN6Ii8+PC9zdmc+',
                    scaledSize: new google.maps.Size(36, 36)
                }
            });
        }

        // Create current position marker if session is active
        if (this.isActive()) {
            this.currentPositionMarker.set({
                position: lastPosition,
                title   : 'Ubicación actual',
                icon    : {
                    path        : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale       : 8,
                    fillColor   : '#34A853',
                    fillOpacity : 0.8,
                    strokeColor : '#FFFFFF',
                    strokeWeight: 2,
                    rotation: path.length > 1 ? Math.atan2(
                        path[path.length - 1].lat - path[path.length - 2].lat,
                        path[path.length - 1].lng - path[path.length - 2].lng
                    ) * (180 / Math.PI) : 0 // Convert radians to degrees
                }
            });
        }

        // Create GPS point markers
        const gpsMarkerData = [];

        this.gpsData().forEach((point, index) => {
            // Only create markers for selected points if there are too many
            if (this.gpsData().length > 100 && index % Math.ceil(this.gpsData().length / 100) !== 0) {
                return;
            }

            const position = {lat: point.latitude, lng: point.longitude};

            const markerData = {
                position: position,
                title   : `Punto GPS #${ index + 1 }`,
                options : {
                    icon     : {
                        path        : google.maps.SymbolPath.CIRCLE,
                        scale       : 4,
                        fillColor   : '#4285F4',
                        fillOpacity : 0.8,
                        strokeColor : '#FFFFFF',
                        strokeWeight: 1
                    },
                    visible  : true,
                    clickable: true,
                    zIndex   : 999
                },
                point   : point,
                index   : index
            };

            gpsMarkerData.push(markerData);
        });

        this.gpsMarkers.set(gpsMarkerData);

        // Only fit bounds if user is not interacting with the map and it's the first data load
        if (this.mapInstance() && !this.userInteracting() && this.isFirstDataLoad()) {
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            this.mapInstance().fitBounds(bounds);
            this.isFirstDataLoad.set(false);
        } else if (this.mapInstance() && this.mapCenter().lat === 0 && this.mapCenter().lng === 0) {
            // Set initial center if not set yet, but don't change zoom
            this.mapCenter.set(path[path.length - 1]);
            this.mapInstance().setCenter(this.mapCenter());
        }

        // Mark as no longer first data load if it was
        if (this.isFirstDataLoad()) {
            this.isFirstDataLoad.set(false);
        }
    }

    private cleanupMarkers(): void {
        this.gpsMarkers.set([]);
        this.selectedMarker.set(null);
        this.infoWindows().forEach(infoWindow => infoWindow.close());

        // Clean up WebGL layer if it exists
        if (this.webGLPathLayer) {
            try {
                this.webGLPathLayer.setMap(null);
            } catch (error) {
                console.warn('Error cleaning up WebGL layer:', error);
            }
            this.webGLPathLayer = null;
        }
    }

    private createInfoWindowContent(marker: any): string {
        const point = marker.point;
        return `
      <div class="p-2 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
        <p class="text-sm font-medium mb-1 text-gray-800">Punto GPS #${ marker.index + 1 }</p>
        <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <p><strong>Fecha y hora:</strong></p>
          <p>${ this.formatDateTime(point.timestamp) }</p>
          <p><strong>Coordenadas:</strong></p>
          <p>${ point.latitude.toFixed(6) }, ${ point.longitude.toFixed(6) }</p>
          <p><strong>Velocidad:</strong></p>
          <p>${ this.formatSpeed(point.speed) }</p>
          <p><strong>Distancia recorrida:</strong></p>
          <p>${ this.formatDistance(point.totalDistance) }</p>
        </div>
      </div>
    `;
    }

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

    formatSpeed(speed: number | undefined): string {
        if (speed === undefined) {
            return 'N/A';
        }
        return `${ speed.toFixed(1) } km/h`;
    }

    formatDistance(distance: number | undefined): string {
        if (distance === undefined) {
            return 'N/A';
        }
        return `${ distance.toFixed(2) } km`;
    }
}
