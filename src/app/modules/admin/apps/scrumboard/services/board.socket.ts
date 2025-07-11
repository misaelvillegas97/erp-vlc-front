import { Socket as NgSocket, Socket } from 'ngx-socket-io';
import { AuthService }                from '@core/auth/auth.service';
import { Injectable }                 from '@angular/core';

@Injectable({providedIn: 'root'})
export class BoardSocket extends Socket {
    constructor(
        public socket: NgSocket,
        private authService: AuthService
    ) {
        super({
            url    : 'localhost:5000/ws/board',
            options: {
                autoConnect: false,
                transports : [ 'websocket' ],
                auth       : {token: authService.accessToken}
            }
        });
    }
}
