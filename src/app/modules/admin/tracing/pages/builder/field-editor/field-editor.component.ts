import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { RouterModule }                       from '@angular/router';
import { MatButtonModule }                    from '@angular/material/button';
import { MatCardModule }                      from '@angular/material/card';
import { MatIconModule }                      from '@angular/material/icon';

@Component({
    selector       : 'app-field-editor',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="field-editor-container p-6">
      <mat-card>
        <mat-card-header>
          <mat-card-title class="flex items-center space-x-2">
            <mat-icon>edit</mat-icon>
            <span>Editor de Campos</span>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content class="p-6">
          <p>Editor de campos - En desarrollo</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles         : [ `
    .field-editor-container {
      max-width: 1200px;
      margin: 0 auto;
    }
  ` ]
})
export class FieldEditorComponent {
}
