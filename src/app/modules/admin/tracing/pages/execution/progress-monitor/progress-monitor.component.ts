import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { RouterModule }                       from '@angular/router';
import { MatButtonModule }                    from '@angular/material/button';
import { MatCardModule }                      from '@angular/material/card';
import { MatIconModule }                      from '@angular/material/icon';
import { MatProgressBarModule }               from '@angular/material/progress-bar';

@Component({
    selector       : 'app-progress-monitor',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressBarModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="progress-monitor-container p-6">
      <mat-card>
        <mat-card-header>
          <mat-card-title class="flex items-center space-x-2">
            <mat-icon>timeline</mat-icon>
            <span>Monitor de Progreso</span>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content class="p-6">
          <p>Monitor de progreso de instancias - En desarrollo</p>
          <mat-progress-bar mode="indeterminate" class="mt-4"></mat-progress-bar>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles         : [ `
    .progress-monitor-container {
      max-width: 1200px;
      margin: 0 auto;
    }
  ` ]
})
export class ProgressMonitorComponent {
}
