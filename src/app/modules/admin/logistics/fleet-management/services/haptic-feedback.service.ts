import { Injectable, inject } from '@angular/core';
import { Platform }           from '@angular/cdk/platform';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

@Injectable({
    providedIn: 'root'
})
export class HapticFeedbackService {
    readonly #platform = inject(Platform);

    private readonly patterns: Record<HapticPattern, number | number[]> = {
        light  : 10,
        medium : 20,
        heavy  : 50,
        success: [ 10, 50, 10 ],
        warning: [ 20, 100, 20 ],
        error  : [ 50, 100, 50, 100, 50 ]
    };

    /**
     * Ejecuta vibración háptica si está disponible
     */
    vibrate(pattern: HapticPattern = 'light'): void {
        if (!this.isHapticSupported()) {
            return;
        }

        const vibrationPattern = this.patterns[pattern];

        try {
            if (Array.isArray(vibrationPattern)) {
                navigator.vibrate(vibrationPattern);
            } else {
                navigator.vibrate(vibrationPattern);
            }
        } catch (error) {
            console.warn('Haptic feedback not available:', error);
        }
    }

    /**
     * Verifica si el dispositivo soporta vibración
     */
    isHapticSupported(): boolean {
        return this.#platform.isBrowser &&
            'vibrate' in navigator &&
            typeof navigator.vibrate === 'function';
    }

    /**
     * Feedback específico para acciones de fleet management
     */
    sessionStart(): void {
        this.vibrate('success');
    }

    sessionEnd(): void {
        this.vibrate('warning');
    }

    buttonPress(): void {
        this.vibrate('light');
    }

    errorAction(): void {
        this.vibrate('error');
    }

    locationUpdate(): void {
        this.vibrate('light');
    }
}
