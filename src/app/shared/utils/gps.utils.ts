import { GpsGeneric } from '@modules/admin/logistics/domain/model/vehicle-session.model';

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
