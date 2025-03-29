import { Component, inject }                                   from '@angular/core';
import { MatIcon }                                             from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                        from '@angular/material/button';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatTooltip }                                          from '@angular/material/tooltip';
import { RouterLink }                                          from '@angular/router';
import { NotyfService }                                        from '@shared/services/notyf.service';
import { AccountingService }                                   from '@modules/admin/administration/accounting/accounting.service';

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
    readonly #ts = inject(TranslocoService);
    readonly #service = inject(AccountingService);
    readonly #notyf = inject(NotyfService);
}
