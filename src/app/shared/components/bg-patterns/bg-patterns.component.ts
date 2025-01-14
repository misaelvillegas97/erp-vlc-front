import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgPatternType }                             from '../../types/bg-pattern.type';

@Component({
    selector       : 'bg-patterns',
    standalone     : true,
    imports        : [],
    templateUrl    : './bg-patterns.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BgPatternsComponent {
    @Input() pattern: BgPatternType = 'waves';
}
