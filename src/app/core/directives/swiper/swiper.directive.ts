import { Directive, ElementRef, Input } from '@angular/core';
import { SwiperOptions }                from 'swiper/types';

@Directive({
    selector  : '[fmSwiper]',
    standalone: true
})
export class SwiperDirective {

    @Input('config')
    config?: SwiperOptions;
    private readonly swiperElement: HTMLElement;

    constructor(private el: ElementRef<HTMLElement>) {
        this.swiperElement = el.nativeElement;
    }

    ngAfterViewInit() {
        Object.assign(this.el.nativeElement, this.config);

        // @ts-ignore
        this.el.nativeElement.initialize();
    }

}
