import { DatePipe }         from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIconModule }    from '@angular/material/icon';
import { MatTooltip }       from '@angular/material/tooltip';
import { RouterLink }       from '@angular/router';
import { DateTime }         from 'luxon';
import { Card }             from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { UserAvatarComponent } from '@shared/components/user-avatar';

@Component({
    selector: 'scrumboard-board-card',
    template: `
        <a
            class="bg-white dark:bg-gray-800 mb-3 flex flex-col items-start space-y-3 overflow-hidden rounded-lg p-4 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-600/50 cursor-grab active:cursor-grabbing"
            [routerLink]="['card', card().id]"
        >
            <!-- Cover image -->
            @if (card().coverImage) {
                <div class="-mx-4 -mt-4 mb-2">
                    <img class="w-full h-32 object-cover rounded-t-lg" [src]="card().coverImage"/>
                </div>
            }

            <!-- Card type badge (if available) -->
            @if (card().type) {
                <div class="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-md backdrop-blur-sm"
                     [class.bg-blue-100]="card().type === 'task'"
                     [class.text-blue-800]="card().type === 'task'"
                     [class.bg-red-100]="card().type === 'bug'"
                     [class.text-red-800]="card().type === 'bug'"
                     [class.bg-yellow-100]="card().type === 'note'"
                     [class.text-yellow-800]="card().type === 'note'"
                     [class.bg-green-100]="card().type === 'feature'"
                     [class.text-green-800]="card().type === 'feature'">
                    {{ card().type }}
                </div>
            }

            <!-- Title -->
            <div class="text-lg font-medium leading-5">
                {{ card().title }}
            </div>

            <!-- Activity icons -->
            <div class="flex items-center space-x-2">
                @if (card().checklists?.length) {
                    <div class="flex items-center text-gray-500 dark:text-gray-400"
                         [matTooltip]="getChecklistCompletionText()">
                        <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:check-circle'"></mat-icon>
                        <span class="ml-1 text-xs">{{ getChecklistCompletion() }}</span>
                    </div>
                }

                @if (card().comments?.length) {
                    <div class="flex items-center text-gray-500 dark:text-gray-400"
                         [matTooltip]="card().comments.length + ' comments'">
                        <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:chat-bubble-left-right'"></mat-icon>
                        <span class="ml-1 text-xs">{{ card().comments.length }}</span>
                    </div>
                }

                @if (card().attachments?.length) {
                    <div class="flex items-center text-gray-500 dark:text-gray-400"
                         [matTooltip]="card().attachments.length + ' attachments'">
                        <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:paper-clip'"></mat-icon>
                        <span class="ml-1 text-xs">{{ card().attachments.length }}</span>
                    </div>
                }

                @if (card().dueDate) {
                    <div
                        class="flex items-center text-sm"
                        [class.text-gray-500]="!isOverdue(card().dueDate)"
                        [class.text-red-600]="isOverdue(card().dueDate)"
                        [matTooltip]="'Vencimiento: ' + (card().dueDate | date: 'longDate')"
                    >
                        <mat-icon class="icon-size-4" [svgIcon]="'heroicons_outline:clock'"></mat-icon>
                    </div>
                }
            </div>

            <!-- Labels -->
            @if (card().labels.length) {
                <div class="flex flex-wrap gap-1 mb-2">
                    @for (label of card().labels; track trackByFn($index, label)) {
                        <div
                            class="w-8 h-2 rounded"
                            [style.background-color]="label.color">
                        </div>
                    }
                </div>
            }

            <!-- Assignees avatars -->
            @if (card().assignees.length) {
                <div class="flex items-center -space-x-2">
                    @for (assignee of card().assignees; track trackByFn($index, assignee)) {
                        <user-avatar
                            class="w-6 h-6"
                            [name]="assignee.name"
                            [avatar]="assignee.avatar">
                        </user-avatar>
                    }
                </div>
            }
        </a>
    `,
    imports : [
        MatIconModule,
        MatTooltip,
        RouterLink,
        DatePipe,
        UserAvatarComponent
    ]
})
export class ScrumboardBoardCardComponent {
    // Inputs
    card = input.required<Card>();

    /**
     * Check if the given ISO_8601 date string is overdue
     */
    isOverdue(date: string): boolean {
        return (
            DateTime.fromISO(date).startOf('day') <
            DateTime.now().startOf('day')
        );
    }

    /**
     * Get checklist completion percentage
     */
    getChecklistCompletion(): string {
        const cardData = this.card();
        if (!cardData.checklists || !cardData.checklists.length) {
            return '0/0';
        }

        let completed = 0;
        let total = 0;

        cardData.checklists.forEach(checklist => {
            if (checklist.items && checklist.items.length) {
                total += checklist.items.length;
                completed += checklist.items.filter(item => item.checked).length;
            }
        });

        return `${ completed }/${ total }`;
    }

    /**
     * Get checklist completion text
     */
    getChecklistCompletionText(): string {
        const cardData = this.card();
        if (!cardData.checklists || !cardData.checklists.length) {
            return 'Sin listas de verificación';
        }

        let completed = 0;
        let total = 0;

        cardData.checklists.forEach(checklist => {
            if (checklist.items && checklist.items.length) {
                total += checklist.items.length;
                completed += checklist.items.filter(item => item.checked).length;
            }
        });

        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return `Lista de verificación: ${ completed }/${ total } (${ percentage }% completado)`;
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
