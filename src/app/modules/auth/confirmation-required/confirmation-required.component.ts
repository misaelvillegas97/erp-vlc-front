import { Component, ViewEncapsulation }      from '@angular/core';
import { RouterLink }                        from '@angular/router';
import { fuseAnimations }                    from '@fuse/animations';
import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';

@Component({
    selector     : 'auth-confirmation-required',
    templateUrl  : './confirmation-required.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [ RouterLink, TranslocoDirective, TranslocoPipe ],
})
export class AuthConfirmationRequiredComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
