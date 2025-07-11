import { HttpClient }         from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { map, Observable, ReplaySubject } from 'rxjs';
import { User }                           from '@core/user/user.types';
import { InfinityPagination }             from '@shared/domain/model/infinity-pagination';
import { DriverLicenseDto }               from '@modules/admin/maintainers/users/models/driver-license.model';
import { CreateUserDto }                  from '@modules/admin/maintainers/users/models/create-user.dto';
import { toSignal }                       from '@angular/core/rxjs-interop';

@Injectable({providedIn: 'root'})
export class UserService {
    private _httpClient = inject(HttpClient);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    userSignal = toSignal<User>(this._user.asObservable());

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

    findByQuery(query?: any) {
        return this._httpClient.get<User[]>('api/v1/users/query', {params: query});
    }

    remove(id: string) {
        return this._httpClient.delete('api/v1/users/' + id);
    }

    assignDriverLicense(userId: string, driverLicense: DriverLicenseDto): Observable<User> {
        return this._httpClient.post<User>(`api/v1/users/${ userId }/driver-license`, driverLicense);
    }

    create(user: CreateUserDto): Observable<User> {
        return this._httpClient.post<User>('api/v1/auth/email/register', user);
    }

    changePassword(userId: string, newPassword: string): Observable<void> {
        return this._httpClient.post<void>('api/v1/auth/override/password', {
            userId  : userId,
            password: newPassword
        });
    }
}
