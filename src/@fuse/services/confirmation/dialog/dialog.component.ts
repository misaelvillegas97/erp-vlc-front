import { NgClass }                              from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule }                      from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule }     from '@angular/material/dialog';
import { MatIconModule }                        from '@angular/material/icon';
import { FuseConfirmationConfig }               from '@fuse/services/confirmation/confirmation.types';
import { TranslocoPipe }                        from '@ngneat/transloco';

@Component({
  selector   : 'fuse-confirmation-dialog',
  templateUrl: './dialog.component.html',
  styles     : [
    `
      .fuse-confirmation-dialog-panel {
        @screen md {
          @apply w-128;
        }

        .mat-mdc-dialog-container {
          .mat-mdc-dialog-surface {
            padding: 0 !important;
          }
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  standalone : true,
    imports: [ MatButtonModule, MatDialogModule, MatIconModule, NgClass, TranslocoPipe ],
})
export class FuseConfirmationDialogComponent {
  data: FuseConfirmationConfig = inject(MAT_DIALOG_DATA);
}
