import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
    selector  : '[ImgLoader]',
    standalone: true
})
export class ImgLoaderDirective {
    @Input() skeletonClass: string;

    private image: HTMLImageElement;
    private skeleton: HTMLElement;

    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngOnInit() {
        this.createSkeleton();
    }

    @HostListener('load')
    onLoad() {
        // Remove the skeleton and show the image
        this.renderer.removeChild(this.renderer.parentNode(this.image), this.skeleton);
        this.renderer.setStyle(this.image, 'opacity', '1');
    }

    private createSkeleton() {
        this.image = this.el.nativeElement;

        // Create skeleton element
        this.skeleton = this.renderer.createElement('div');
        this.renderer.addClass(this.skeleton, this.skeletonClass);
        this.renderer.addClass(this.skeleton, 'w-full');
        this.renderer.addClass(this.skeleton, 'h-44');
        this.renderer.addClass(this.skeleton, 'block');
        this.renderer.addClass(this.skeleton, 'animate-pulse');
        this.renderer.addClass(this.skeleton, 'rounded-2xl');
        this.renderer.addClass(this.skeleton, 'bg-card');

        // Insert skeleton before the image
        const parent = this.renderer.parentNode(this.image);
        this.renderer.insertBefore(parent, this.skeleton, this.image);

        // Hide the image initially
        this.renderer.setStyle(this.image, 'opacity', '0');
        this.renderer.setStyle(this.image, 'position', 'relative');
        this.renderer.setStyle(this.image, 'transition', 'opacity 200ms ease-in-out');
    }
}
