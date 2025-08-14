// suppress-click-on-drag.directive.ts
import {
    Directive,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Renderer2,
} from '@angular/core';

@Directive({
    selector  : '[suppressClickOnDrag]',
    standalone: true,
})
export class SuppressClickOnDragDirective implements OnInit, OnDestroy {
    /** px to consider it a drag */
    @Input() dragThreshold = 4;
    /** ms to suppress clicks after releasing */
    @Input() suppressWindowMs = 150;
    /** enable verbose console logs */
    @Input() debug = false;

    private startX = 0;
    private startY = 0;
    private moved = false;
    private activePointerId?: number;
    private suppressUntil = 0;
    private capturedClickRemover?: () => void;
    private capturedDblClickRemover?: () => void;

    private log(...args: any[]) {
        if (!this.debug) return;
        // compact tag to filter in DevTools
        console.log('[SuppressClickOnDrag]', ...args);
    }

    constructor(private el: ElementRef, private r2: Renderer2) {}

    ngOnInit(): void {
        // Capture-phase listeners to intercept before other handlers
        const clickHandler = (e: Event) => this.onCapturedClick(e as MouseEvent, 'click(capture)');
        const dblHandler = (e: Event) => this.onCapturedClick(e as MouseEvent, 'dblclick(capture)');
        this.capturedClickRemover = this.r2.listen(
            this.el.nativeElement,
            'click',
            clickHandler,
        ) as unknown as () => void;
        // Renderer2 no expone fase capture; añadimos manual con addEventListener
        this.el.nativeElement.addEventListener('click', clickHandler, {capture: true});
        this.el.nativeElement.addEventListener('dblclick', dblHandler, {capture: true});
        // guardamos removers manuales
        this.capturedDblClickRemover = () => {
            this.el.nativeElement.removeEventListener('click', clickHandler, {capture: true} as any);
            this.el.nativeElement.removeEventListener('dblclick', dblHandler, {capture: true} as any);
        };
        this.log('init', {
            threshold: this.dragThreshold,
            windowMs : this.suppressWindowMs,
            host     : this.el.nativeElement.tagName,
        });
    }

    ngOnDestroy(): void {
        try { this.capturedClickRemover?.(); } catch {}
        try { this.capturedDblClickRemover?.(); } catch {}
    }

    // ----- Pointer flow -----
    @HostListener('pointerdown', [ '$event' ])
    onDown(e: PointerEvent) {
        this.activePointerId = e.pointerId;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.moved = false;
        this.log('PD', {id: e.pointerId, x: e.clientX, y: e.clientY});
    }

    @HostListener('document:pointermove', [ '$event' ])
    onMove(e: PointerEvent) {
        if (e.pointerId !== this.activePointerId) return;
        if (!this.moved) {
            const dx = Math.abs(e.clientX - this.startX);
            const dy = Math.abs(e.clientY - this.startY);
            const moved = dx > this.dragThreshold || dy > this.dragThreshold;
            if (moved) {
                this.moved = true;
                this.log('PM -> moved', {dx, dy, threshold: this.dragThreshold});
            }
        }
    }

    @HostListener('document:pointerup', [ '$event' ])
    onUp(e: PointerEvent) {
        if (e.pointerId !== this.activePointerId) return;
        const now = performance.now();
        if (this.moved) {
            this.suppressUntil = now + this.suppressWindowMs;
            this.log('PU drag end', {until: this.suppressUntil, windowMs: this.suppressWindowMs});
        } else {
            this.log('PU no-drag');
        }
        this.activePointerId = undefined;
        this.moved = false;
    }

    @HostListener('document:pointercancel', [ '$event' ])
    onCancel(e: PointerEvent) {
        if (e.pointerId !== this.activePointerId) return;
        this.log('PC cancel');
        this.activePointerId = undefined;
        this.moved = false;
    }

    // ----- Click suppression (capture) -----
    private onCapturedClick(e: MouseEvent, tag: string) {
        const now = performance.now();
        const recentlyDragged = now < this.suppressUntil;
        const shouldBlock = this.moved || recentlyDragged;
        this.log(tag, {
            x            : e.clientX,
            y            : e.clientY,
            moved        : this.moved,
            recentlyDragged,
            suppressUntil: this.suppressUntil,
            block        : shouldBlock,
            target       : (e.target as HTMLElement)?.tagName,
        });
        if (shouldBlock) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }

    // Also handle bubbling phase as a fallback
    @HostListener('click', [ '$event' ])
    onClick(e: MouseEvent) {
        this.onCapturedClick(e, 'click(bubble)');
    }

    @HostListener('dblclick', [ '$event' ])
    onDblClick(e: MouseEvent) {
        this.onCapturedClick(e, 'dblclick(bubble)');
    }
}
