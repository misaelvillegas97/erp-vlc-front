import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, NgIf }                            from '@angular/common';
import { RouterLink }                                from '@angular/router';
import { MatIcon }                                   from '@angular/material/icon';
import { MatDivider }               from '@angular/material/divider';
import { MatButton, MatIconButton } from '@angular/material/button';

import { BgPatternType }       from '../../types/bg-pattern.type';
import { BgPatternsComponent } from '../bg-patterns/bg-patterns.component';

@Component({
    selector       : 'page-detail-header',
    standalone     : true,
    imports: [
        RouterLink,
        MatIcon,
        MatDivider,
        DatePipe,
        MatButton,
        NgIf,
        BgPatternsComponent,
        MatIconButton
    ],
    templateUrl    : './page-detail-header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageDetailHeaderComponent {
    @Input() breadcrumbs: { label: string, url: string }[];
    @Input() title: string;
    @Input() subtitle: string;
    @Input() createdBy: any;
    @Input() date: Date;
    @Input() actions: { label: string, icon: string, url: string, color: 'primary' | 'accent' }[];
    @Input() pattern: BgPatternType = 'waves';
    @Input() showBackButton: boolean = false;
    @Input() backRoute: string = './../';
}
