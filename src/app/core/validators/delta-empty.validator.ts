import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function deltaEmptyValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const delta = control.value;

        if (!delta || !delta.ops || delta.ops.length === 0) {
            return {deltaEmpty: true};
        }

        for (let i = 0; i < delta.ops.length; i++) {
            if (delta.ops[i].insert && delta.ops[i].insert.trim() !== '') {
                return null; // Es válido
            }
        }

        return {deltaEmpty: true};
    };
}

export function isDeltaEmptyOrWhitespace(delta: any) {
    if (delta.ops.length === 0) {
        return true;
    }
    for (let i = 0; i < delta.ops.length; i++) {
        if (delta.ops[i].insert.trim() !== '') {
            return false;
        }
    }
    return true;
}
