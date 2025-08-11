import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { RouterModule }                       from '@angular/router';
import { MatButtonModule }                    from '@angular/material/button';
import { MatCardModule }                      from '@angular/material/card';
import { MatIconModule }                      from '@angular/material/icon';
import { MatChipsModule }                     from '@angular/material/chips';

@Component({
    selector       : 'app-sync-status',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatChipsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="sync-status-container p-6">
      <mat-card>
        <mat-card-header>
          <mat-card-title class="flex items-center space-x-2">
            <mat-icon>sync</mat-icon>
            <span>Estado de Sincronización</span>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content class="p-6">
          <div class="flex items-center space-x-2 mb-4">
            <mat-chip class="bg-green-100 text-green-800">
              <mat-icon>check_circle</mat-icon>
              Sincronizado
            </mat-chip>
          </div>
          <p>Estado de sincronización del sistema - En desarrollo</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles         : [ `
    .sync-status-container {
      max-width: 1200px;
      margin: 0 auto;
    }
  ` ]
})
export class SyncStatusComponent {
}
