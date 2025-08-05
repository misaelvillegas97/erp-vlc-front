import { Injectable } from '@angular/core';

const STORAGE_KEY = 'deviceId';

@Injectable({ providedIn: 'root' })
export class DeviceService {
    getDeviceId(): string {
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    }
}
