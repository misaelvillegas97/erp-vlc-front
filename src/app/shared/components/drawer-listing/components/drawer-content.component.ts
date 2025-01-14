import { Component } from '@angular/core';

@Component({
    selector  : 'drawer-content',
    standalone: true,
    template  : `
    <ng-content></ng-content>`,
})
export class DrawerContentComponent {}
