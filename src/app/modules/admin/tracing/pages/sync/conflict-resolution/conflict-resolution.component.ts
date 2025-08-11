import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { RouterModule }                       from '@angular/router';
import { MatButtonModule }                    from '@angular/material/button';
import { MatCardModule }                      from '@angular/material/card';
import { MatIconModule }                      from '@angular/material/icon';
import { MatTableModule }                     from '@angular/material/table';
import { MatChipsModule }                     from '@angular/material/chips';

@Component({
    selector       : 'app-conflict-resolution',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatChipsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="conflict-resolution-container p-6">
      <mat-card>
        <mat-card-header>
          <mat-card-title class="flex items-center space-x-2">
            <mat-icon>merge_type</mat-icon>
            <span>Resolución de Conflictos</span>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content class="p-6">
          <div class="flex items-center space-x-2 mb-4">
            <mat-chip class="bg-blue-100 text-blue-800">
              <mat-icon>info</mat-icon>
              Sin conflictos pendientes
            </mat-chip>
          </div>
          <p>Sistema de resolución de conflictos de sincronización - En desarrollo</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles         : [ `
    .conflict-resolution-container {
      max-width: 1200px;
      margin: 0 auto;
    }
  ` ]
})
export class ConflictResolutionComponent {
}
