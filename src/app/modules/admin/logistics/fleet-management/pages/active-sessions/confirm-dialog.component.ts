import { Component, Inject }                              from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule }                                from '@angular/material/button';
import { MatIconModule }                                  from '@angular/material/icon';

export interface ConfirmDialogData {
    title: string;
    message: string;
}

@Component({
    selector  : 'app-confirm-dialog',
    standalone: true,
    imports   : [
        MatDialogModule,
        MatButtonModule,
        MatIconModule
    ],
    template  : `
    <div class="p-6">
      <div class="flex items-center gap-4 mb-4">
        <mat-icon class="text-amber-500 icon-size-8" svgIcon="mat_outline:help"></mat-icon>
        <h2 class="text-xl font-bold">{{ data.title }}</h2>
      </div>
      
      <p class="mb-6">
        {{ data.message }}
      </p>
      
      <div class="flex justify-end gap-2">
        <button mat-stroked-button [mat-dialog-close]="false">
          Cancelar
        </button>
        <button mat-flat-button color="warn" [mat-dialog-close]="true">
          Confirmar
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) {}
}
