import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { BaseService } from '@core/interfaces/base-service.interface';
import { inject }      from '@angular/core';

export abstract class AbstractService<T> implements BaseService<T> {
    protected httpClient: HttpClient = inject(HttpClient);

    protected constructor(protected baseUrl: string) {}

    create(data: T): Observable<T> {
        return this.httpClient.post<T>(this.baseUrl, data);
    }

    update(data: T): Observable<T> {
        return this.httpClient.put<T>(`${ this.baseUrl }/${ (data as any).id }`, data);
    }

    delete(id: string): Observable<void> {
        return this.httpClient.delete<void>(`${ this.baseUrl }/${ id }`);
    }

    findAll(): Observable<T[]> {
        return this.httpClient.get<T[]>(this.baseUrl);
    }

    findOne(id: string): Observable<T> {
        return this.httpClient.get<T>(`${ this.baseUrl }/${ id }`);
    }
}
