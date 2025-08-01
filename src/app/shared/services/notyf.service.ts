import { Injectable }           from '@angular/core';
import { INotyfOptions, Notyf } from 'notyf';

@Injectable({providedIn: 'root'})
export class NotyfService {
    private readonly _notyf = new Notyf({
        duration   : 3_000,
        dismissible: true,
        position   : {x: 'right', y: 'top'},
        types      : [
            {
                // Added Info and Warning type
                type      : 'info',
                background: '#06B6D4',
            },
            {
                type      : 'warning',
                background: '#FCAA1D',
            }
        ],
        ripple     : false,
    } as Partial<INotyfOptions>);

    public success(message: string, options?: Partial<INotyfOptions>) {
        this._notyf.success({message, ...options});
    }

    public error(message: string, options?: Partial<INotyfOptions>) {
        this._notyf.error({message, ...options});
    }

    public info(message: string, options?: Partial<INotyfOptions>) {
        this._notyf.open({type: 'info', message, ...options});
    }

    public warning(message: string, options?: Partial<INotyfOptions>) {
        this._notyf.open({type: 'warning', message, ...options});
    }
}
