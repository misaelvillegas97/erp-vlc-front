import { GpsGeneric } from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';

/**
 * Calculates the distance between a series of GPS points using the Haversine formula.
 *
 * @param points An array of GPS points, each containing latitude and longitude.
 *
 * @returns The total distance in meters between the points in meters.
 */
export const calculateDistance = (points: GpsGeneric[]): number => {
    if (points.length < 2) {
        return 0;
    }

    const R = 6_371_000;

    const toRad = (deg: number): number => deg * Math.PI / 180;

    let totalDistance = 0;

    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];

        const dLat = toRad(curr.latitude - prev.latitude);
        const dLon = toRad(curr.longitude - prev.longitude);

        const lat1 = toRad(prev.latitude);
        const lat2 = toRad(curr.latitude);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;

        totalDistance += distance;
    }

    return +totalDistance.toFixed(2);
};

// ============================================================================
// GPS DATA PROCESSING UTILITIES
// ============================================================================

/**
 * Creates a hash string for GPS data to detect changes efficiently.
 * Uses first point, last point, and length for quick comparison.
 *
 * @param data Array of GPS points
 * @returns Hash string representing the GPS data
 */
export const createGpsDataHash = (data: GpsGeneric[]): string => {
    if (!data || data.length === 0) return '';

    // Create hash based on first point, last point, and length
    // This is efficient and catches most changes
    const first = data[0];
    const last = data[data.length - 1];

    return `${ first.latitude }_${ first.longitude }_${ first.timestamp }_${ last.latitude }_${ last.longitude }_${ last.timestamp }_${ data.length }`;
};

/**
 * Validates if a GPS point has valid latitude and longitude values.
 *
 * @param point GPS point to validate
 * @returns True if the point has valid coordinates
 */
export const isValidGpsPoint = (point: any): point is GpsGeneric => {
    return point &&
        typeof point.latitude === 'number' &&
        typeof point.longitude === 'number' &&
        !isNaN(point.latitude) &&
        !isNaN(point.longitude) &&
        point.latitude >= -90 && point.latitude <= 90 &&
        point.longitude >= -180 && point.longitude <= 180;
};

/**
 * Validates GPS data array and filters out invalid points.
 *
 * @param data Array of GPS points to validate
 * @returns Array of valid GPS points
 */
export const validateGpsData = (data: GpsGeneric[]): GpsGeneric[] => {
    if (!data || !Array.isArray(data)) {
        return [];
    }

    return data.filter(isValidGpsPoint);
};

// ============================================================================
// COORDINATE CALCULATIONS
// ============================================================================

/**
 * Calculates the rotation angle (in degrees) between two GPS points.
 * Used for orienting markers based on movement direction.
 *
 * @param fromPoint Starting GPS point
 * @param toPoint Ending GPS point
 * @returns Rotation angle in degrees
 */
export const calculateRotationBetweenPoints = (fromPoint: GpsGeneric, toPoint: GpsGeneric): number => {
    if (!isValidGpsPoint(fromPoint) || !isValidGpsPoint(toPoint)) {
        return 0;
    }

    return Math.atan2(
        toPoint.latitude - fromPoint.latitude,
        toPoint.longitude - fromPoint.longitude
    ) * (180 / Math.PI);
};

/**
 * Converts GPS points to Google Maps LatLngLiteral format.
 *
 * @param points Array of GPS points
 * @returns Array of Google Maps LatLngLiteral objects
 */
export const gpsPointsToLatLng = (points: GpsGeneric[]): google.maps.LatLngLiteral[] => {
    return validateGpsData(points).map(point => ({
        lat: point.latitude,
        lng: point.longitude
    }));
};

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

/**
 * Linear interpolation between two numbers.
 * Used for smooth animations and transitions.
 *
 * @param start Starting value
 * @param end Ending value
 * @param progress Progress between 0 and 1
 * @returns Interpolated value
 */
export const lerp = (start: number, end: number, progress: number): number => {
    return start + (end - start) * progress;
};

/**
 * Interpolates between two GPS points for smooth animation.
 *
 * @param startPoint Starting GPS point
 * @param endPoint Ending GPS point
 * @param progress Progress between 0 and 1
 * @returns Interpolated GPS coordinates
 */
export const interpolateGpsPoints = (
    startPoint: GpsGeneric,
    endPoint: GpsGeneric,
    progress: number
): google.maps.LatLngLiteral => {
    if (!isValidGpsPoint(startPoint) || !isValidGpsPoint(endPoint)) {
        return {lat: 0, lng: 0};
    }

    return {
        lat: lerp(startPoint.latitude, endPoint.latitude, progress),
        lng: lerp(startPoint.longitude, endPoint.longitude, progress)
    };
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a Unix timestamp to a localized date/time string.
 *
 * @param timestamp Unix timestamp (in seconds)
 * @returns Formatted date/time string
 */
export const formatDateTime = (timestamp: number): string => {
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
};

/**
 * Formats speed value with units.
 *
 * @param speed Speed value in km/h
 * @returns Formatted speed string with units
 */
export const formatSpeed = (speed: number | undefined): string => {
    if (speed === undefined) {
        return 'N/A';
    }
    return `${ speed.toFixed(1) } km/h`;
};

/**
 * Formats distance value with units.
 *
 * @param distance Distance value in kilometers
 * @returns Formatted distance string with units
 */
export const formatDistance = (distance: number | undefined): string => {
    if (distance === undefined) {
        return 'N/A';
    }
    return `${ distance.toFixed(2) } km`;
};

type Coord = { lat: number; lon: number };

export const getStaticMapUrl = (
    coords: Coord[] | Coord,
    zoom: number = 14,
    width: number = 200,
    height: number = 200
): string => {
    const base = 'https://staticmap-production.up.railway.app/map.png';
    const list = Array.isArray(coords) ? coords : [ coords ];

    // Usa el primer punto como centro
    const center = list[0];
    const centerParam = `center=${ center.lat },${ center.lon }`;
    const zoomParam = `zoom=${ zoom }`;
    const sizeParam = `size=${ width }x${ height }`;

    // Marca todos los puntos
    const markers = list
        .map(c => `${ c.lat },${ c.lon }`)
        .join('|');
    const markerParam = `markers=color:red|${ markers }`;

    return `${ base }?${ centerParam }&${ zoomParam }&${ sizeParam }&${ markerParam }`;
};
