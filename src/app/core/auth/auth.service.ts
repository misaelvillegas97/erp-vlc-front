import { HttpClient }                                                                 from '@angular/common/http';
import { inject, Injectable }                                                         from '@angular/core';
import { AuthUtils }                                                                  from 'app/core/auth/auth.utils';
import { UserService }                                                                from 'app/core/user/user.service';
import { catchError, lastValueFrom, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { ICompany }                                                                   from '@core/domain/interfaces/company.interface';
import { CreateUserDto }                                                              from '@core/auth/domain/create-user.dto';
import { User }                                                                       from '@core/user/user.types';

@Injectable({providedIn: 'root'})
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);


    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', {email});
    }

    /**
     * Reset password
     *
     * @param password
     * @param resetToken
     */
    resetPassword(password: string, resetToken: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', {
            password1: password,
            password2: password,
            resetToken,
        });
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { emailOrUsername: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        localStorage.removeItem('accessToken');

        return this._httpClient.post('api/v1/auth/email/login', {
            email: credentials.emailOrUsername,
            password: credentials.password,
        }).pipe(
            switchMap((response: any) => {
                // Store the access token in the local storage
                this.accessToken = response.token;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.user;

                // Return a new observable with the response
                return of(response);
            }),
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        // Sign in using the token
        return this._httpClient.post('api/v1/auth/refresh', {})
            .pipe(
                catchError((err) => {
                    localStorage.removeItem('accessToken');
                    this._authenticated = false;
                    location.reload();
                    return err;
                }),
                switchMap((response: any) => {
                    // Replace the access token with the new one if it's available on
                    // the response object.
                    //
                    // This is an added optional step for better security. Once you sign
                    // in using the token, you should generate a new one on the server
                    // side and attach it to the response object. Then the following
                    // piece of code can replace the token with the refreshed one.
                    if (response.accessToken) {
                        this.accessToken = response.token;
                    }

                    // Set the authenticated flag to true
                    this._authenticated = true;

                    // Store the user on the user service
                    this._userService.user = response.user;

                    // Return true
                    return of(true);
                }),
            );
    }

    /**
     * Sign out
     */
    async signOut() {
        // Remove session from backend and blacklist the token
        await lastValueFrom(this._httpClient.post('api/auth/sign-out', {}));

        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return true;
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: CreateUserDto): Observable<any> {
        const post = {
            ...user,
            password1: user.password,
            password2: user.password,
        };
        return this._httpClient.post<User>('api/auth/sign-up', post);
    }

    validateEmail = (email: string): Observable<boolean> => this._httpClient
        .post<{ isValid: boolean }>(`api/auth/sign-up/validate-email`, {email})
        .pipe(
            map(({isValid}) => isValid),
            catchError(() => of(false))
        );

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            console.log('No access token');
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            console.log('Access token expired');
            return of(false);
        }

        // If the access token exists, and it didn't expire, sign in using it
        return this.signInUsingToken();
    }

    /**
     * Set active company, by saving active company in the localStorage in the following structure:
     * ``` json
     * [
     *  {
     *    userId: 1,
     *    companyId: 'uuid_value'
     *  }
     * ]
     * ```
     *
     * @param companyId
     */
    setActiveCompany(companyId: string): Observable<any> {
        return this._httpClient.post<any>('api/auth/active-company', {companyId})
            .pipe(tap((response) => {
                this.accessToken = response.accessToken;
                this._userService.user = response.user;
            }));
    }

    /**
     * Validate if user is member of the company
     */
    isUserInCompany = (companyId: string): Observable<boolean> =>
        this._httpClient.get<boolean>(`api/company-user/${ companyId }/validate-user`);
}
