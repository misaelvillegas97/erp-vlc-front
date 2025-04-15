import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Vehicle }            from './domain/model/vehicle';
import { Observable }         from 'rxjs';

@Injectable({providedIn: 'root'})
export class VehiclesService {
    readonly #http = inject(HttpClient);

    findAll(): Observable<Vehicle[]> {
        return this.#http.get<Vehicle[]>('/api/vehicles');
    }

    create(dto: any): Observable<Vehicle> {
        return this.#http.post<Vehicle>('/api/vehicles', dto);
    }

    update(id: string, dto: any): Observable<Vehicle> {
        return this.#http.put<Vehicle>(`/api/vehicles/${ id }`, dto);
    }

    delete(id: string): Observable<void> {
        return this.#http.delete<void>(`/api/vehicles/${ id }`);
    }

    findById(id: string): Observable<Vehicle> {
        return this.#http.get<Vehicle>(`/api/vehicles/${ id }`);
    }

    uploadDocument(vehicleId: string, documentData: FormData): Observable<any> {
        return this.#http.post<any>(`/api/vehicles/${ vehicleId }/documents`, documentData);
    }
}
