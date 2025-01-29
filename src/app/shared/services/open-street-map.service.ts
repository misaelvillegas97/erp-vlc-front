import { Injectable }                 from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Place }                      from '@shared/domain/model/place';

@Injectable({providedIn: 'root'})
export class OpenStreetMapService {
    constructor(private readonly _httpClient: HttpClient) { }

    // Find places using nominatim API from OpenStreetMap
    search(query: string): Observable<Place[]> {
        return this._httpClient.get<Place[]>(`https://nominatim.openstreetmap.org/search?q=${ query }&format=json&addressdetails=1&limit=5&countrycodes=CL`);
    }

    async reverse(lat?: number, lon?: number) {
        if (!lat || !lon) {
            if ('geolocation' in navigator) {
                const position: GeolocationPosition = await this.getCurrentPosition({enableHighAccuracy: true});

                console.log('position', position);
                lat = position.coords.latitude;
                lon = position.coords.longitude;
            }
        }

        return firstValueFrom(this._httpClient.get<Place>(`https://nominatim.openstreetmap.org/reverse?lat=${ lat }&lon=${ lon }&format=json&addressdetails=1`));
    }

    getCurrentPosition(options): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }
}
