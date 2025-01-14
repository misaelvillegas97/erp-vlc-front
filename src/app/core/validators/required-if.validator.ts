import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of }                                      from 'rxjs';

/**
 * Required if validator that requires the control to have a value if the given
 * control has a truthy value.
 *
 * @param {string} controlName
 */
export function requiredIfFalse(controlName: string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
        const controlToCheck = control?.parent?.get(controlName);

        if (!controlToCheck)
            return of(null);

        if (!controlToCheck || controlToCheck.value === false) {
            return of({requiredIfFalse: true});
        }
        return of(null);
    };
}
