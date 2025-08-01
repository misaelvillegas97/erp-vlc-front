import { Directive, HostListener, inject, input } from '@angular/core';
import { HapticFeedbackService, HapticPattern }   from '../services/haptic-feedback.service';

@Directive({
    selector  : '[hapticClick]',
    standalone: true
})
export class HapticClickDirective {
    readonly #hapticService = inject(HapticFeedbackService);

    hapticPattern = input<HapticPattern>('light');

    @HostListener('click', [ '$event' ])
    onClick(event: Event): void {
        this.#hapticService.vibrate(this.hapticPattern());
    }

    @HostListener('touchstart', [ '$event' ])
    onTouchStart(event: TouchEvent): void {
        // Provide immediate feedback on touch for mobile devices
        this.#hapticService.vibrate(this.hapticPattern());
    }
}
