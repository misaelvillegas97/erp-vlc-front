import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { DeviceService } from '@core/device/device.service';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface TrackedEvent {
    name: string;
    data?: any;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
    private events: TrackedEvent[] = [];
    private enabled = true;

    constructor(private http: HttpClient, private deviceService: DeviceService) {}

    enable(enabled: boolean): void {
        this.enabled = enabled;
    }

    track(name: string, data?: any): void {
        if (!this.enabled) {
            return;
        }
        this.events.push({ name, data, timestamp: Date.now() });
    }

    flush(): Observable<unknown> {
        if (!this.enabled || this.events.length === 0) {
            return of(null);
        }

        const payload = {
            deviceId: this.deviceService.getDeviceId(),
            events: this.events,
        };

        return this.http.post(`${environment.BACKEND_URL}ui-events`, payload).pipe(
            tap(() => (this.events = []))
        );
    }
}
