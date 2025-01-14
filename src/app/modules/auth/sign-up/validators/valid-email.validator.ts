import { catchError, debounceTime, distinctUntilChanged, map, Observable } from 'rxjs';
import { AbstractControl, AsyncValidatorFn, ValidationErrors }             from '@angular/forms';
import { AuthService }                                                     from '@core/auth/auth.service';
import AES                                                                 from 'crypto-js/aes';
import { environment }                                                     from '../../../../../environments/environment';

export function emailAsyncValidator(authService: AuthService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        const encryptedEmail = AES.encrypt(control.value, environment.ENCRYPTION_KEY).toString();

        return authService.validateEmail(encryptedEmail).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            map(isValid => (isValid ? null : {invalidEmail: true})),
            catchError(() => null) // Handle errors and return null to indicate no validation error
        );
    };
}
