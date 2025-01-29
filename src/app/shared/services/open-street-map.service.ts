import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Place }      from '@shared/domain/model/place';

@Injectable({providedIn: 'root'})
export class OpenStreetMapService {
    constructor(private readonly _httpClient: HttpClient) { }

    // Find places using nominatim API from OpenStreetMap
    search(query: string): Observable<Place[]> {
        return this._httpClient.get<Place[]>(`https://nominatim.openstreetmap.org/search?q=${ query }&format=json&addressdetails=1&limit=5&countrycodes=CL`);
    }
}
