import { Socket }                             from 'ngx-socket-io';
import { AuthService }                        from '@core/auth/auth.service';
import { ApplicationRef, inject, Injectable } from '@angular/core';

@Injectable({providedIn: 'root'})
export class BoardSocket extends Socket {

    constructor() {
        const authService = inject(AuthService);
        const appRef = inject(ApplicationRef);
        
        super({
            url    : 'localhost:5000/ws/board',
            options: {
                autoConnect: false,
                transports: [ 'websocket' ]
            }
        }, appRef);

        // Set authentication token
        this.auth = {token: authService.accessToken};
    }
}
