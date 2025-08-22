import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject, input, OnChanges, OnDestroy, signal, SimpleChanges, untracked, viewChildren } from '@angular/core';
import { CommonModule }                                                                                                                                             from '@angular/common';
import { GoogleMapsModule, MapInfoWindow }                                                                                                                          from '@angular/google-maps';
import { MatButtonModule }                                                                                                                                          from '@angular/material/button';
import { MatIconModule }                                                                                                                                            from '@angular/material/icon';
import { MatSliderModule }                                                                                                                                          from '@angular/material/slider';
import { MatSelectModule }                                                                                                                                          from '@angular/material/select';
import { MatTooltipModule }                                                                                                                                         from '@angular/material/tooltip';
import {
    GpsGeneric,
    VehicleSession
}                                                                                                                                                                   from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { WebGLPathLayer }                                                                                                                                           from '@shared/utils/webgl-path-layer';
import { calculateRotationBetweenPoints, createGpsDataHash, formatDateTime, formatDistance, formatSpeed }                                                           from '@shared/utils/gps.utils';
import { RoadsApiService }                                                                                                                                          from '@shared/services/roads-api.service';

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
    session = input<VehicleSession | null>();
    isActive = input<boolean>(false);
    playbackMode = input<boolean>(false);
    polylineSource = input<'gps' | 'routePolygon'>('gps'); // Default to GPS data for backward compatibility
    highlightedGpsTimestamp = input<number | null>(null); // Timestamp of GPS point to highlight

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
    private playbackZoomLevel = signal<number>(18); // Optimal zoom level for playback viewing
    private isPlaybackZoomActive = signal<boolean>(false); // Whether playback zoom is currently active

    infoWindows = viewChildren(MapInfoWindow);

    // Inject services
    private readonly roadsApiService = inject(RoadsApiService);

    constructor() {
        // Effect to automatically update map when polyline source or data changes
        effect(() => {
            const selectedData = this.selectedPolylineData();
            const mapInitialized = this.mapInitialized();

            // Only trigger update if map is initialized and we have data
            if (mapInitialized && selectedData && selectedData.length > 0) {
                // Use setTimeout to avoid potential circular updates
                setTimeout(() => {
                    this.setupMapData();
                }, 0);
            }
        });

        // Effect to handle marker highlighting when GPS timestamp changes
        effect(() => {
            const highlightedTimestamp = this.highlightedGpsTimestamp();
            // Use untracked to prevent circular updates when updating markers signal
            untracked(() => {
                this.updateMarkerHighlight(highlightedTimestamp);
            });
        });
    }

    // Computed properties for data handling
    effectiveGpsData = computed((): GpsGeneric[] => {
        const sessionData = this.session();

        if (sessionData.filter) {
            return sessionData.filter.map(point => {
                return {
                    latitude   : point.lat,
                    longitude  : point.lng,
                    timestamp  : point.ts,
                    referenceId: undefined
                };
            });
        }

        if (sessionData?.gps && sessionData.gps.length > 0) {
            return sessionData.gps.sort((a, b) => {
                const refA = a.referenceId ? Number(a.referenceId) : a.timestamp;
                const refB = b.referenceId ? Number(b.referenceId) : b.timestamp;
                return refA - refB;
            });
        }
        return this.gpsData() || [];
    });


    routePolygonPath = computed(() => {
        const sessionData = this.session();

        console.log(`Route polygon path it is present: ${ !!sessionData?.routeDetails?.geometry?.coordinates }`);
        if (sessionData?.routeDetails?.geometry?.coordinates) {
            // Convert routePolygon coordinates to LatLngLiteral format
            // routePolygon.geometry.coordinates is number[][] where each inner array is [lng, lat]
            return sessionData.routeDetails.geometry.coordinates.map(coord => ({
                lat: coord[1], // latitude is second element
                lng: coord[0]  // longitude is first element
            }));
        }
        return null;
    });

    // Computed property to determine which polyline data to use based on source selection
    selectedPolylineData = computed(() => {
        const source = this.polylineSource();

        if (source === 'routePolygon') {
            const routePolygon = this.routePolygonPath();
            if (routePolygon && routePolygon.length > 0) {
                return routePolygon;
            }
        }

        // Default to GPS data (either when source is 'gps' or when routePolygon is not available)
        const gpsData = this.effectiveGpsData();
        if (gpsData && gpsData.length > 0) {
            return gpsData
                .map(point => ({
                    lat: point.latitude,
                    lng: point.longitude
                }));
        }

        return [];
    });

    // Computed property for effective playback path - uses selected polyline data
    effectivePlaybackPath = computed(() => {
        return this.selectedPolylineData();
    });

    // Computed property to determine if polyline warning should be shown
    // Only show warning when "Beta" mode (routePolygon) is selected
    shouldShowPolylineWarning = computed(() => {
        const source = this.polylineSource();
        const polyline = this.polylinePath();
        return source === 'routePolygon' && polyline && polyline.length > 0;
    });

    // Utility functions for LatLngLiteral interpolation and rotation
    private interpolateLatLngPoints(
        startPoint: google.maps.LatLngLiteral,
        endPoint: google.maps.LatLngLiteral,
        progress: number
    ): google.maps.LatLngLiteral {
        if (!startPoint || !endPoint ||
            typeof startPoint.lat !== 'number' || typeof startPoint.lng !== 'number' ||
            typeof endPoint.lat !== 'number' || typeof endPoint.lng !== 'number') {
            return {lat: 0, lng: 0};
        }

        return {
            lat: startPoint.lat + (endPoint.lat - startPoint.lat) * progress,
            lng: startPoint.lng + (endPoint.lng - startPoint.lng) * progress
        };
    }

    private calculateRotationBetweenLatLngPoints(
        fromPoint: google.maps.LatLngLiteral,
        toPoint: google.maps.LatLngLiteral
    ): number {
        if (!fromPoint || !toPoint ||
            typeof fromPoint.lat !== 'number' || typeof fromPoint.lng !== 'number' ||
            typeof toPoint.lat !== 'number' || typeof toPoint.lng !== 'number') {
            return 0;
        }

        return Math.atan2(
            toPoint.lat - fromPoint.lat,
            toPoint.lng - fromPoint.lng
        ) * (180 / Math.PI);
    }

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
        mapId        : 'gps-tracking-map', // Unique ID for the map
        renderingType: 'VECTOR' // Enable vector rendering for WebGLOverlayView support
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
        if (this.effectiveGpsData().length > 0 || this.routePolygonPath()) {
            this.setupMapData();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['gpsData'] && !changes['gpsData'].firstChange) ||
            (changes['session'] && !changes['session'].firstChange)) {
            this.updateMapDataIfNeeded();
        }

        // Handle polyline source changes - force full map update when switching sources
        if (changes['polylineSource'] && !changes['polylineSource'].firstChange) {
            // Reset optimization flags to ensure fresh rendering
            this.isFirstDataLoad.set(true);
            this.lastGpsDataLength.set(0);
            this.lastGpsDataHash.set('');

            // Force full map data setup when source changes
            if (this.mapInitialized()) {
                this.setupMapData();
            }
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

        if (this.effectiveGpsData().length > 0 || this.routePolygonPath()) {
            this.setupMapData();
        }
    }

    private updateMapDataIfNeeded(): void {
        const selectedData = this.selectedPolylineData();
        const polylineSource = this.polylineSource();

        if (!selectedData || selectedData.length === 0) {
            return;
        }

        // For route polygon source, always use full setup since data structure is different
        if (polylineSource === 'routePolygon') {
            this.setupMapData();
            return;
        }

        // For GPS data source, use optimized incremental updates when possible
        const currentGpsData = this.effectiveGpsData();
        if (!currentGpsData || currentGpsData.length === 0) {
            return;
        }

        // Create a simple hash of the GPS data to detect changes
        const currentLength = currentGpsData.length;
        const currentHash = createGpsDataHash(currentGpsData);

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

    private incrementalUpdateMapData(): void {
        const currentData = this.effectiveGpsData();
        if (!currentData || currentData.length === 0 || !this.mapInstance()) {
            return;
        }

        const path = currentData
            .sort((a, b) => {
                const refA = a.referenceId ? Number(a.referenceId) : a.timestamp;
                const refB = b.referenceId ? Number(b.referenceId) : b.timestamp;
                return refA - refB;
            })
            .map(point => ({
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
                    rotation: path.length > 1 ? calculateRotationBetweenPoints(
                        {latitude: path[path.length - 2].lat, longitude: path[path.length - 2].lng} as GpsGeneric,
                        {latitude: path[path.length - 1].lat, longitude: path[path.length - 1].lng} as GpsGeneric
                    ) : 0
                }
            });
        }

        // Don't call fitBounds to preserve user's zoom/pan
    }

    // Playback control methods
    startPlayback(): void {
        const playbackPath = this.effectivePlaybackPath();
        if (!this.playbackMode() || !playbackPath || playbackPath.length === 0) {
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
        const playbackPath = this.effectivePlaybackPath();
        if (!playbackPath || playbackPath.length === 0 || position < 0 || position >= playbackPath.length) {
            return;
        }

        // Additional validation to ensure the polyline point at this position exists and has required properties
        const polylinePoint = playbackPath[position];
        if (!polylinePoint || typeof polylinePoint.lat !== 'number' || typeof polylinePoint.lng !== 'number') {
            console.warn(`Invalid polyline data at position ${ position }:`, polylinePoint);
            return;
        }

        // Stop any ongoing interpolation when manually setting position
        this.stopInterpolation();

        this.playbackPosition.set(position);
        this.updatePlaybackProgress();
        this.updatePlaybackMarker();
    }

    private animatePlayback(): void {
        const playbackPath = this.effectivePlaybackPath();
        if (!this.isPlaying() || !playbackPath || playbackPath.length === 0) {
            return;
        }

        const currentPosition = this.playbackPosition();

        if (currentPosition >= playbackPath.length - 1) {
            // Playback finished
            this.stopPlayback();
            return;
        }

        // Start smooth interpolation to next point
        const currentPoint = playbackPath[currentPosition];
        const nextPoint = playbackPath[currentPosition + 1];

        if (currentPoint && nextPoint &&
            typeof currentPoint.lat === 'number' &&
            typeof currentPoint.lng === 'number' &&
            typeof nextPoint.lat === 'number' &&
            typeof nextPoint.lng === 'number') {

            // Calculate segment duration based on playback speed
            // Since polyline points don't have timestamps, use consistent timing
            const segmentDuration = Math.max(100, 500 / this.playbackSpeed()); // Minimum 100ms, default 500ms

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

        // Linear interpolation between start and end points using LatLngLiteral coordinates
        const position = this.interpolateLatLngPoints(startPoint, endPoint, progress);

        // Calculate smooth rotation based on direction of movement using LatLngLiteral coordinates
        const rotation = this.calculateRotationBetweenLatLngPoints(startPoint, endPoint);

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
        const playbackPath = this.effectivePlaybackPath();
        const currentPosition = this.playbackPosition();

        if (!playbackPath || playbackPath.length === 0 || currentPosition < 0 || currentPosition >= playbackPath.length) {
            return;
        }

        const progress = (currentPosition / (playbackPath.length - 1)) * 100;
        this.playbackProgress.set(Math.min(100, Math.max(0, progress)));

        // Update current time display - since polyline points don't have timestamps,
        // try to get timestamp from corresponding GPS data if available
        const gpsData = this.effectiveGpsData();
        if (gpsData && gpsData.length > 0 && currentPosition < gpsData.length) {
            const currentGpsPoint = gpsData[currentPosition];
            if (currentGpsPoint && typeof currentGpsPoint.timestamp === 'number') {
                this.playbackCurrentTime.set(formatDateTime(currentGpsPoint.timestamp));
            } else {
                this.playbackCurrentTime.set(`Punto ${ currentPosition + 1 } de ${ playbackPath.length }`);
            }
        } else {
            this.playbackCurrentTime.set(`Punto ${ currentPosition + 1 } de ${ playbackPath.length }`);
        }
    }

    private updatePlaybackMarker(): void {
        const playbackPath = this.effectivePlaybackPath();
        const currentPosition = this.playbackPosition();

        if (!playbackPath || playbackPath.length === 0 || currentPosition < 0 || currentPosition >= playbackPath.length) {
            return;
        }

        const currentPoint = playbackPath[currentPosition];
        if (!currentPoint || typeof currentPoint.lat !== 'number' || typeof currentPoint.lng !== 'number') {
            console.warn(`Invalid polyline data at position ${ currentPosition }:`, currentPoint);
            return;
        }

        const position = {
            lat: currentPoint.lat,
            lng: currentPoint.lng
        };

        // Calculate rotation based on direction of movement
        let rotation = 0;
        if (currentPosition > 0) {
            const prevPoint = playbackPath[currentPosition - 1];
            if (prevPoint && typeof prevPoint.lat === 'number' && typeof prevPoint.lng === 'number') {
                rotation = this.calculateRotationBetweenLatLngPoints(prevPoint, currentPoint);
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
        const selectedPolylineData = this.selectedPolylineData();
        const currentGpsData = this.effectiveGpsData();
        const polylineSource = this.polylineSource();

        if (!selectedPolylineData || selectedPolylineData.length === 0 || !this.mapInstance()) {
            return;
        }

        this.cleanupMarkers();

        // Use the selected polyline data for rendering
        if (polylineSource === 'routePolygon') {
            // Using routePolygon data - render directly
            this.renderPath(selectedPolylineData);

            // Set map center to the last position
            const lastPosition = selectedPolylineData[selectedPolylineData.length - 1];
            this.mapCenter.set(lastPosition);

            // Create markers using GPS data if available, otherwise use routePolygon endpoints
            if (currentGpsData && currentGpsData.length > 0) {
                const gpsPath = currentGpsData.map(point => ({
                    lat: point.latitude,
                    lng: point.longitude
                }));
                this.createMarkers(gpsPath);
            } else {
                // Create basic start/end markers from routePolygon
                this.createMarkersFromPolygon(selectedPolylineData);
            }
        } else {
            // Using GPS data - apply Roads API if available for smoother visualization
            const lastPosition = selectedPolylineData[selectedPolylineData.length - 1];
            this.mapCenter.set(lastPosition);


            this.renderPath(selectedPolylineData);

            // Create markers using GPS points
            this.createMarkers(selectedPolylineData);
        }
    }

    private renderPath(path: google.maps.LatLngLiteral[]): void {
        // Always set the polyline path first to ensure polylines are visible
        this.polylinePath.set(path);

        // Use WebGL for routes with many points (more than 1000) as an overlay
        if (path.length > 1000) {
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
                        try {
                            this.webGLPathLayer.setMap(this.mapInstance());
                            console.log('WebGL layer set successfully for route with', path.length, 'points');
                            // For now, keep both WebGL and standard polylines visible to ensure polylines are always shown
                            // In the future, we could implement better WebGL success detection
                        } catch (webglError) {
                            console.warn('Failed to set WebGL layer on map:', webglError);
                            // Keep standard polyline visible if WebGL fails
                        }
                    }
                }, 100);

            } catch (error) {
                console.warn('Failed to create WebGL layer, using standard polyline:', error);
                // Keep the standard polyline if WebGL fails
                this.webGLPathLayer = null;
            }
        } else {
            // Make sure no WebGL layer is active for smaller routes
            if (this.webGLPathLayer) {
                this.webGLPathLayer.setMap(null);
                this.webGLPathLayer = null;
            }
        }
    }

    private createMarkers(originalPath: google.maps.LatLngLiteral[]): void {
        const lastPosition = originalPath[originalPath.length - 1];

        // Create start marker
        this.startMarker.set({
            position: originalPath[0],
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
                    rotation: originalPath.length > 1 ? calculateRotationBetweenPoints(
                        {latitude: originalPath[originalPath.length - 2].lat, longitude: originalPath[originalPath.length - 2].lng} as GpsGeneric,
                        {latitude: originalPath[originalPath.length - 1].lat, longitude: originalPath[originalPath.length - 1].lng} as GpsGeneric
                    ) : 0
                }
            });
        }

        // Create GPS point markers
        const gpsMarkerData = [];
        const currentData = this.effectiveGpsData();

        currentData.forEach((point, index) => {
            // Only create markers for selected points if there are too many
            if (currentData.length > 100 && index % Math.ceil(currentData.length / 100) !== 0) {
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
                    zIndex: 500
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
            originalPath.forEach(point => bounds.extend(point));
            this.mapInstance().fitBounds(bounds);
            this.isFirstDataLoad.set(false);
        } else if (this.mapInstance() && this.mapCenter().lat === 0 && this.mapCenter().lng === 0) {
            // Set initial center if not set yet, but don't change zoom
            this.mapCenter.set(originalPath[originalPath.length - 1]);
            this.mapInstance().setCenter(this.mapCenter());
        }

        // Mark as no longer first data load if it was
        if (this.isFirstDataLoad()) {
            this.isFirstDataLoad.set(false);
        }
    }

    private createMarkersFromPolygon(polygonPath: google.maps.LatLngLiteral[]): void {
        if (!polygonPath || polygonPath.length === 0) {
            return;
        }

        const firstPosition = polygonPath[0];
        const lastPosition = polygonPath[polygonPath.length - 1];

        // Create start marker
        this.startMarker.set({
            position: firstPosition,
            title   : 'Inicio',
            icon    : {
                url       : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRDQUY1MCI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN7ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
                scaledSize: new google.maps.Size(36, 36)
            }
        });

        // Create end marker if session is not active
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
                    rotation    : polygonPath.length > 1 ? calculateRotationBetweenPoints(
                        {latitude: polygonPath[polygonPath.length - 2].lat, longitude: polygonPath[polygonPath.length - 2].lng} as GpsGeneric,
                        {latitude: polygonPath[polygonPath.length - 1].lat, longitude: polygonPath[polygonPath.length - 1].lng} as GpsGeneric
                    ) : 0
                }
            });
        }

        // Set empty GPS markers array since we don't have individual GPS points
        this.gpsMarkers.set([]);

        // Only fit bounds if user is not interacting with the map and it's the first data load
        if (this.mapInstance() && !this.userInteracting() && this.isFirstDataLoad()) {
            const bounds = new google.maps.LatLngBounds();
            polygonPath.forEach(point => bounds.extend(point));
            this.mapInstance().fitBounds(bounds);
            this.isFirstDataLoad.set(false);
        } else if (this.mapInstance() && this.mapCenter().lat === 0 && this.mapCenter().lng === 0) {
            // Set initial center if not set yet, but don't change zoom
            this.mapCenter.set(lastPosition);
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

    /**
     * Updates marker highlighting based on GPS timestamp
     * Highlights the marker corresponding to the given timestamp
     */
    private updateMarkerHighlight(highlightedTimestamp: number | null): void {
        const markers = this.gpsMarkers();

        if (!markers || markers.length === 0) {
            return;
        }

        // Create new markers array with updated highlighting
        const updatedMarkers = markers.map(marker => {
            const isHighlighted = highlightedTimestamp !== null &&
                marker.point.timestamp === highlightedTimestamp;

            return {
                ...marker,
                options: {
                    ...marker.options,
                    icon: {
                        path        : google.maps.SymbolPath.CIRCLE,
                        scale       : isHighlighted ? 8 : 4, // Larger scale when highlighted
                        fillColor   : isHighlighted ? '#FF6B35' : '#4285F4', // Orange when highlighted, blue otherwise
                        fillOpacity : 0.8,
                        strokeColor : '#FFFFFF',
                        strokeWeight: isHighlighted ? 2 : 1, // Thicker stroke when highlighted
                        zIndex      : isHighlighted ? 999999 : 500 // Higher z-index when highlighted
                    }
                }
            };
        });

        // Update the markers signal with highlighted markers
        this.gpsMarkers.set(updatedMarkers);
    }

    protected readonly formatDateTime = formatDateTime;
    protected readonly formatSpeed = formatSpeed;
    protected readonly formatDistance = formatDistance;
}
