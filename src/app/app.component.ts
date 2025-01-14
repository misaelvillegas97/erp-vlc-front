import { Component }          from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs               from '@angular/common/locales/es';
import { RouterOutlet }       from '@angular/router';

import { register } from 'swiper/element/bundle';

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
        register(); // initialize swiper in the project
        registerLocaleData(localeEs);
    }
}
