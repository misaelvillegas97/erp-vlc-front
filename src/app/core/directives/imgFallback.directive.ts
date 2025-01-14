import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    standalone: true,
    selector  : '[imgFallback]'
})
export class ImgFallbackDirective {
    @Input() imgFallback: string;
    @Input() imgFallbackDefault: string;
    count = 0;

    constructor(private el: ElementRef) {}

    @HostListener('error')
    onError() {
        if (this.count < 3) {
            this.count++;
            this.el.nativeElement.src = this.imgFallback;
            return;
        } else {
            this.el.nativeElement.src = this.imgFallbackDefault || 'https://via.placeholder.com/150';
        }
    }
}
