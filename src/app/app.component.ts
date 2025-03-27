import { Component }          from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs               from '@angular/common/locales/es';
import { RouterOutlet }       from '@angular/router';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : [ './app.component.scss' ],
    standalone : true,
    imports    : [ RouterOutlet ],
    providers  : [],
})
export class AppComponent {

    constructor() {
        registerLocaleData(localeEs);
    }
}
