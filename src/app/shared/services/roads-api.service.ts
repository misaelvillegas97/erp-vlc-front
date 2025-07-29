import { inject, Injectable }              from '@angular/core';
import { HttpClient }                      from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { GpsGeneric }                      from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { environment }                     from '../../../environments/environment';

export interface SnappedPoint {
    location: {
        latitude: number;
        longitude: number;
    };
    originalIndex?: number;
    placeId?: string;
}

export interface RoadsApiResponse {
    snappedPoints: SnappedPoint[];
}

@Injectable({
    providedIn: 'root'
})
export class RoadsApiService {
    private readonly http = inject(HttpClient);

    // Note: In production, this should be stored securely (environment variables, backend proxy, etc.)
    private readonly GOOGLE_MAPS_API_KEY = environment.GMAPS_API_KEY; // Replace with actual API key
    private readonly ROADS_API_BASE_URL = 'https://roads.googleapis.com/v1';

    /**
     * Snaps GPS points to the most likely roads travelled.
     * The Roads API can handle up to 100 points per request.
     *
     * @param gpsPoints Array of GPS points to snap to roads
     * @param interpolate Whether to interpolate between points (default: true)
     * @returns Observable of snapped points
     */
    snapToRoads(gpsPoints: GpsGeneric[], interpolate: boolean = true): Observable<google.maps.LatLngLiteral[]> {
        if (!gpsPoints || gpsPoints.length === 0) {
            return of([]);
        }

        // Filter out invalid GPS points
        const validPoints = gpsPoints.filter(point =>
            point.latitude && point.longitude &&
            point.latitude >= -90 && point.latitude <= 90 &&
            point.longitude >= -180 && point.longitude <= 180
        );

        if (validPoints.length === 0) {
            return of([]);
        }

        // Split into chunks of 100 points (API limit)
        const chunks = this.chunkArray(validPoints, 100);

        // Process all chunks and combine results
        const requests = chunks.map(chunk => this.snapChunkToRoads(chunk, interpolate));

        // Combine all results
        return new Observable(observer => {
            Promise.all(requests.map(req => req.toPromise()))
                .then(results => {
                    const combinedResults = results.flat().filter(point => point !== null);
                    observer.next(combinedResults);
                    observer.complete();
                })
                .catch(error => {
                    console.warn('Roads API error, falling back to original points:', error);
                    // Fallback to original points if API fails
                    const fallbackPoints = validPoints.map(point => ({
                        lat: point.latitude,
                        lng: point.longitude
                    }));
                    observer.next(fallbackPoints);
                    observer.complete();
                });
        });
    }

    /**
     * Snaps a chunk of GPS points to roads (max 100 points)
     */
    private snapChunkToRoads(gpsPoints: GpsGeneric[], interpolate: boolean): Observable<google.maps.LatLngLiteral[]> {
        // Convert GPS points to the format expected by Roads API
        const path = gpsPoints
            .map(point => `${ point.latitude },${ point.longitude }`)
            .join('|');

        const url = `${ this.ROADS_API_BASE_URL }/snapToRoads`;
        const params = {
            path       : path,
            interpolate: interpolate.toString(),
            key        : this.GOOGLE_MAPS_API_KEY
        };

        return this.http.get<RoadsApiResponse>(url, {params}).pipe(
            map(response => {
                if (response.snappedPoints && response.snappedPoints.length > 0) {
                    return response.snappedPoints.map(point => ({
                        lat: point.location.latitude,
                        lng: point.location.longitude
                    }));
                }
                return [];
            }),
            catchError(error => {
                console.warn('Roads API request failed:', error);
                // Return original points as fallback
                return of(gpsPoints.map(point => ({
                    lat: point.latitude,
                    lng: point.longitude
                })));
            })
        );
    }

    /**
     * Alternative method using Directions API for route optimization
     * This can provide even smoother routes by calculating actual driving directions
     */
    getOptimizedRoute(gpsPoints: GpsGeneric[]): Observable<google.maps.LatLngLiteral[]> {
        if (!gpsPoints || gpsPoints.length < 2) {
            return of([]);
        }

        const origin = gpsPoints[0];
        const destination = gpsPoints[gpsPoints.length - 1];

        // Use intermediate points as waypoints (max 25 waypoints for Directions API)
        const waypoints = gpsPoints.slice(1, -1);
        const maxWaypoints = Math.min(waypoints.length, 25);
        const selectedWaypoints = this.selectRepresentativeWaypoints(waypoints, maxWaypoints);

        const directionsService = new google.maps.DirectionsService();

        return new Observable(observer => {
            directionsService.route({
                origin           : {lat: origin.latitude, lng: origin.longitude},
                destination      : {lat: destination.latitude, lng: destination.longitude},
                waypoints        : selectedWaypoints.map(point => ({
                    location: {lat: point.latitude, lng: point.longitude},
                    stopover: false
                })),
                travelMode       : google.maps.TravelMode.DRIVING,
                optimizeWaypoints: true
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    const route = result.routes[0];
                    const path: google.maps.LatLngLiteral[] = [];

                    route.legs.forEach(leg => {
                        leg.steps.forEach(step => {
                            path.push(...step.path.map(point => ({
                                lat: point.lat(),
                                lng: point.lng()
                            })));
                        });
                    });

                    observer.next(path);
                    observer.complete();
                } else {
                    console.warn('Directions API failed, falling back to original points:', status);
                    // Fallback to original points
                    const fallbackPoints = gpsPoints.map(point => ({
                        lat: point.latitude,
                        lng: point.longitude
                    }));
                    observer.next(fallbackPoints);
                    observer.complete();
                }
            });
        });
    }

    /**
     * Selects representative waypoints from a large set of GPS points
     */
    private selectRepresentativeWaypoints(points: GpsGeneric[], maxCount: number): GpsGeneric[] {
        if (points.length <= maxCount) {
            return points;
        }

        const step = Math.floor(points.length / maxCount);
        const selected: GpsGeneric[] = [];

        for (let i = 0; i < points.length; i += step) {
            if (selected.length < maxCount) {
                selected.push(points[i]);
            }
        }

        return selected;
    }

    /**
     * Utility method to split array into chunks
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Checks if the Roads API is available and properly configured
     */
    isAvailable(): boolean {
        return this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' &&
            this.GOOGLE_MAPS_API_KEY.length > 0;
    }
}
