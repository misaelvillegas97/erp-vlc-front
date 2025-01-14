import { Component, Input }    from '@angular/core';
import { UpperCasePipe }       from '@angular/common';
import { BgPatternsComponent } from '../../../shared/components/bg-patterns/bg-patterns.component';

@Component({
    selector   : 'page-header',
    standalone : true,
    imports    : [
        UpperCasePipe,
        BgPatternsComponent
    ],
    templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {
    @Input() title: string;
    @Input() subtitle: string;
    @Input() description: string;
    @Input() bgImage: string;
}
