import { DateTime }         from 'luxon';
import { TranslocoService } from '@ngneat/transloco';

export const relativeTime = (date: number) => DateTime.fromMillis(date).toRelative();


/**
 * Filter an array of objects by a given value
 *
 * @param {T[]} array
 * @param {string} value
 * @param {keyof T} field
 *
 * @param predicate
 * @returns {T[]}
 */
export function filterByValue<T>(array: T[], value: string, field: keyof T, predicate?: (item: T) => boolean): T[] {
    return array.filter((item) => item[field].toString().toLowerCase().includes(value.toLowerCase()) && (!predicate || predicate(item)));
}

/**
 * Display With fn for autocomplete, it receives a function that will be used to display the item
 *
 * @param {string} fieldName
 *
 * @returns {(item: any) => string}
 */
export function displayWithFn<T>(fieldName: keyof T): (item: any) => string {
    return (item: any) => {
        console.log(item, item[fieldName]);
        return item ? item[fieldName] : '';
    };
}

export function displayWithTranslationFn<T>(ts: TranslocoService, prefix: string = ''): (item: any) => string {
    return (item: any) => {
        console.log(item, ts.translate(prefix + item));
        return item ? ts.translate(prefix + item) : '';
    };
}

export function formDataFromObject<T>(object: T): FormData {
    const formData = new FormData();

    Object.keys(object).forEach((key) => {
        if (object[key] !== undefined && object[key] !== null) {
            console.log(object[key]);
            if (object[key] instanceof File) {
                formData.append(key, object[key], object[key].name);
            } else if (object[key] instanceof Object) {
                formData.append(key, JSON.stringify(object[key]));
            } else {
                formData.append(key, object[key]);
            }
        }
    });

    return formData;
}
