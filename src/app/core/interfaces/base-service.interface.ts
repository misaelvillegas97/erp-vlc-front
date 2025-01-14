import { Observable } from 'rxjs';

export interface BaseService<T> {
    create(data: T): Observable<T>;

    update(data: T): Observable<T>;

    delete(id: string): Observable<void>;

    findAll(): Observable<T[]>;

    findOne(id: string): Observable<T>;
}
