import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal }                         from '@angular/cdk/portal';
import { TemplateRef, ViewContainerRef }          from '@angular/core';

interface OverlayOptions {
    backdropClass?: string;
    hasBackdrop?: boolean;
    scrollStrategy?: any;
    positionStrategy?: any;
    positions?: Array<ConnectedPosition>;
}

const defaultPositions: Array<ConnectedPosition> = [
    {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
    {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
    {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
    {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom'},
];

export function openOverlay(
    overlay: Overlay,
    container: ViewContainerRef,
    originContainer: any,
    template: TemplateRef<any>,
    options: OverlayOptions = {}
): OverlayRef {
    const overlayRef = overlay.create({
        backdropClass   : options.backdropClass || '',
        hasBackdrop     : options.hasBackdrop !== undefined ? options.hasBackdrop : true,
        scrollStrategy  : options.scrollStrategy || overlay.scrollStrategies.block(),
        positionStrategy: options.positionStrategy || overlay
            .position()
            .flexibleConnectedTo(originContainer)
            .withFlexibleDimensions(true)
            .withViewportMargin(16)
            .withLockedPosition(true)
            .withPositions(options.positions || defaultPositions),
    });

    const templatePortal = new TemplatePortal(template, container);
    overlayRef.attach(templatePortal);

    overlayRef.backdropClick().subscribe(() => {
        overlayRef.detach();
    });

    if (templatePortal && templatePortal.isAttached) {
        templatePortal.detach();
    }

    return overlayRef;
}
