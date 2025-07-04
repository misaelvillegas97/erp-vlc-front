import { AfterViewInit, ChangeDetectionStrategy, Component, computed, input, OnChanges, OnDestroy, signal, SimpleChanges, viewChildren } from '@angular/core';
import { CommonModule }                                                                                                                  from '@angular/common';
import { GoogleMapsModule, MapInfoWindow }                                                                                               from '@angular/google-maps';
import { GpsGeneric }                                                                                                                    from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { WebGLPathLayer }                                                                                                                from '@shared/utils/webgl-path-layer';

@Component({
    selector       : 'app-gps-map',
    standalone     : true,
    imports        : [
        CommonModule,
        GoogleMapsModule
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
        // Register service worker for tile caching
        this.registerTileCacheServiceWorker();

        if (this.gpsData()?.length > 0) {
            this.setupMapData();
        }
    }

    /**
     * Register service worker for caching map tiles
     */
    private registerTileCacheServiceWorker(): void {
        if ('serviceWorker' in navigator) {
            // Register the service worker
            navigator.serviceWorker.register('/tile-cache-sw.js')
                .then(registration => {
                    console.log('Tile cache service worker registered:', registration);

                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New service worker installed, reload to use it
                                    console.log('New service worker installed, reloading...');
                                    window.location.reload();
                                }
                            });
                        }
                    });

                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 5 * 60 * 1000); // Check every 5 minutes
                })
                .catch(error => {
                    console.error('Tile cache service worker registration failed:', error);
                });

            // Listen for service worker messages
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'CACHE_UPDATED') {
                    console.log('Map tiles cache updated');
                }
            });

            // Handle service worker controller changes
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service worker controller changed');
                // Optionally reload the page to ensure consistency
                // window.location.reload();
            });
        }
    }

    /**
     * Create the service worker script for tile caching if it doesn't exist
     */
    private createTileCacheServiceWorker(): void {
        // This method is no longer needed since we have the actual service worker file
        // Just log that the service worker should be available
        console.log('Using tile cache service worker from /tile-cache-sw.js');
    }

    /**
     * Dynamically create the service worker script for tile caching
     * In a real implementation, this would be done during the build process
     */
    private dynamicallyCreateServiceWorker(): void {
        // This method is no longer needed
        console.log('Service worker file should be available at /tile-cache-sw.js');
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['gpsData'] && !changes['gpsData'].firstChange) {
            this.setupMapData();
        }
    }

    ngOnDestroy(): void {
        this.cleanupMarkers();
    }

    onMapInitialized(map: google.maps.Map): void {
        this.mapInstance.set(map);
        if (this.gpsData()?.length > 0) {
            this.setupMapData();
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
        if (!this.isActive) {
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
        if (this.isActive) {
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
                    rotation    : Math.atan2(
                        path[path.length - 1].lat - path[path.length - 2].lat,
                        path[path.length - 1].lng - path[path.length - 2].lng
                    ) * (180 / Math.PI) // Convert radians to degrees
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

        // Fit bounds to show all markers
        if (this.mapInstance()) {
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            this.mapInstance().fitBounds(bounds);
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
