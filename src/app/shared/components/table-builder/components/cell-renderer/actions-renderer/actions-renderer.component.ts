import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule }                           from '@angular/material/button';
import { MatIconModule }                             from '@angular/material/icon';
import { MatMenuModule }                             from '@angular/material/menu';
import { MatTooltipModule }                          from '@angular/material/tooltip';
import { NgFor }                                     from '@angular/common';

interface Action {
    icon: string;
    action: string;
    label?: string;
    tooltip?: string;
    color?: string;
}

@Component({
    selector       : 'actions-renderer',
    standalone     : true,
    imports        : [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        NgFor
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <!-- If there's only one action, show it as a button -->
        <ng-container *ngIf="actions && actions.length === 1">
            <button
                mat-icon-button
                [color]="actions[0].color || 'primary'"
                [matTooltip]="actions[0].tooltip || actions[0].label || actions[0].action"
                (click)="onAction(actions[0].action)">
                <mat-icon>{{ actions[0].icon }}</mat-icon>
            </button>
        </ng-container>

        <!-- If there are multiple actions, show them in a menu -->
        <ng-container *ngIf="actions && actions.length > 1">
            <button
                mat-icon-button
                [matMenuTriggerFor]="actionsMenu"
                [matTooltip]="'Actions'">
                <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #actionsMenu="matMenu">
                <button
                    *ngFor="let action of actions"
                    mat-menu-item
                    (click)="onAction(action.action)">
                    <mat-icon [color]="action.color || 'primary'">{{ action.icon }}</mat-icon>
                    <span>{{ action.label || action.action }}</span>
                </button>
            </mat-menu>
        </ng-container>
    `
})
export class ActionsRendererComponent {
    @Input() actions?: Action[];
    @Input() onAction?: (action: string) => void;
}
