import { Component, inject }                                   from '@angular/core';
import { MatIcon }                                             from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                        from '@angular/material/button';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatTooltip }                                          from '@angular/material/tooltip';
import { RouterLink }                                          from '@angular/router';

@Component({
    selector   : 'app-list',
    imports: [
        MatIcon,
        MatIconAnchor,
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIconButton,
        TranslocoPipe
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly;
    readonly #ts = inject(TranslocoService);
}
