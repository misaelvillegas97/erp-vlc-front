import { Component, computed, input } from '@angular/core';
import type { ClassValue }            from 'clsx';
import { hlm }                        from '@libs/ui/utils/utils';

@Component({
  selector  : 'skeleton',
  standalone: true,
  template  : '',
  host      : {
    '[class]': '_computedClass()',
  },
})
export class HlmSkeletonComponent {
  public readonly userClass = input<ClassValue>('', {alias: 'class'});
  protected _computedClass = computed(() => hlm('block animate-pulse rounded-md bg-muted', this.userClass()));
}
