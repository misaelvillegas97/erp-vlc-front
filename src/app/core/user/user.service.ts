import { HttpClient }         from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { map, Observable, ReplaySubject } from 'rxjs';
import { User }                           from '@core/user/user.types';
import { InfinityPagination }             from '@shared/domain/model/infinity-pagination';

@Injectable({providedIn: 'root'})
export class UserService {
    private _httpClient = inject(HttpClient);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    update(user: User): Observable<any> {
        return this._httpClient.patch<User>('api/common/user', {user}).pipe(
            map((response) => {
                this._user.next(response);
            }),
        );
    }

    findAll(query?: any): Observable<InfinityPagination<User>> {
        return this._httpClient.get<InfinityPagination<User>>('api/v1/users', {params: query});
    }

    findByQuery(query?: string) {
        return this._httpClient.get<User[]>('api/v1/users/query', {params: {query}});
    }

    remove(id: string) {
        return this._httpClient.delete('api/v1/users/' + id);
    }
}
