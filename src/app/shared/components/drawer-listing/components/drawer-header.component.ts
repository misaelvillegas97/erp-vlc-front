import { Component } from '@angular/core';

@Component({
    selector  : 'drawer-header',
    standalone: true,
    template  : `
    <ng-content></ng-content>`,
})
export class DrawerHeaderComponent {}
