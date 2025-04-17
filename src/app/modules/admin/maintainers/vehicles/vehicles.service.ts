import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Vehicle }            from './domain/model/vehicle';
import { Observable }         from 'rxjs';
import { FindCount }          from '@shared/domain/model/find-count';

@Injectable({providedIn: 'root'})
export class VehiclesService {
    readonly #http = inject(HttpClient);

    findAll(): Observable<FindCount<Vehicle>> {
        return this.#http.get<FindCount<Vehicle>>('/api/v1/logistics/vehicles');
    }

    create(dto: any): Observable<Vehicle> {
        return this.#http.post<Vehicle>('/api/v1/logistics/vehicles', dto);
    }

    update(id: string, dto: any): Observable<Vehicle> {
        return this.#http.put<Vehicle>(`/api/v1/logistics/vehicles/${ id }`, dto);
    }

    delete(id: string): Observable<void> {
        return this.#http.delete<void>(`/api/v1/logistics/vehicles/${ id }`);
    }

    findById(id: string): Observable<Vehicle> {
        return this.#http.get<Vehicle>(`/api/v1/logistics/vehicles/${ id }`);
    }

    uploadDocument(vehicleId: string, documentData: FormData): Observable<any> {
        return this.#http.post<any>(`/api/v1/logistics/vehicles/${ vehicleId }/documents`, documentData);
    }
}
