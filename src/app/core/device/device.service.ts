import { Injectable } from '@angular/core';

const DEVICE_KEY = 'deviceId';
const SESSION_KEY = 'sessionId';

@Injectable({ providedIn: 'root' })
export class DeviceService {
    getDeviceId(): string {
        let id = localStorage.getItem(DEVICE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    }

    getSessionId(): string {
        let id = sessionStorage.getItem(SESSION_KEY);
        if (!id) {
            id = crypto.randomUUID();
            sessionStorage.setItem(SESSION_KEY, id);
        }
        return id;
    }
}
