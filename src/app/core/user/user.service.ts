import { HttpClient }         from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { map, Observable, ReplaySubject } from 'rxjs';
import { ICompany }                       from '@core/domain/interfaces/company.interface';
import { environment }                    from 'environments/environment';
import { User }                           from '@core/user/user.types';

@Injectable({providedIn: 'root'})
export class UserService {
    private _backendUrl = environment.BACKEND_URL;
    private _httpClient = inject(HttpClient);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        return this._httpClient.patch<User>(this._backendUrl + 'api/common/user', {user}).pipe(
            map((response) => {
                this._user.next(response);
            }),
        );
    }
}
