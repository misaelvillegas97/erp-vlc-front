import { Component, input, output } from '@angular/core';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatMenuModule }            from '@angular/material/menu';
import { MatTooltip }               from '@angular/material/tooltip';
import { Board }                    from '@modules/admin/apps/scrumboard/models/scrumboard.models';

@Component({
    selector: 'scrumboard-board-header',
    template: `
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-center justify-between p-6 sm:py-4 sm:px-6 border-b bg-card dark:bg-transparent">
            <!-- Board title and description -->
            <div class="flex items-center">
                <div class="flex flex-col">
                    <div class="text-2xl font-semibold">{{ board()?.title }}</div>
                    <div class="text-secondary">{{ board()?.description }}</div>
                </div>
            </div>

            <!-- Board actions -->
            <div class="flex items-center mt-4 sm:mt-0">
                <!-- Board members -->
                <div class="flex items-center -space-x-1.5 mr-4">
                    @for (member of board()?.members; track trackByFn($index, member)) {
                        <img
                            class="w-8 h-8 rounded-full ring-2 ring-bg-card"
                            [src]="member.avatar"
                            [alt]="member.name"
                            [matTooltip]="member.name">
                    }
                </div>

                <!-- Add member button -->
                <button
                    class="ml-2"
                    mat-icon-button
                    [matTooltip]="'Add member'"
                    (click)="onAddMember()">
                    <mat-icon [svgIcon]="'heroicons_outline:user-plus'"></mat-icon>
                </button>

                <!-- Board settings -->
                <button
                    class="ml-2"
                    mat-icon-button
                    [matMenuTriggerFor]="boardMenu">
                    <mat-icon [svgIcon]="'heroicons_outline:cog'"></mat-icon>
                </button>
                <mat-menu #boardMenu="matMenu">
                    <button mat-menu-item (click)="onEditBoard()">
                        <mat-icon [svgIcon]="'heroicons_outline:pencil'"></mat-icon>
                        <span>Edit Board</span>
                    </button>
                    <button mat-menu-item (click)="onChangeBackground()">
                        <mat-icon [svgIcon]="'heroicons_outline:photo'"></mat-icon>
                        <span>Change Background</span>
                    </button>
                    <button mat-menu-item (click)="onArchiveBoard()">
                        <mat-icon [svgIcon]="'heroicons_outline:archive-box'"></mat-icon>
                        <span>Archive Board</span>
                    </button>
                    <button mat-menu-item (click)="onDeleteBoard()">
                        <mat-icon [svgIcon]="'heroicons_outline:trash'"></mat-icon>
                        <span>Delete Board</span>
                    </button>
                </mat-menu>
            </div>
        </div>
    `,
    imports : [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltip
    ]
})
export class ScrumboardBoardHeaderComponent {
    // Inputs
    board = input<Board | null>(null);

    // Outputs
    addMember = output<void>();
    editBoard = output<void>();
    changeBackground = output<void>();
    archiveBoard = output<void>();
    deleteBoard = output<void>();

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Event handlers
     */
    onAddMember(): void {
        this.addMember.emit();
    }

    onEditBoard(): void {
        this.editBoard.emit();
    }

    onChangeBackground(): void {
        this.changeBackground.emit();
    }

    onArchiveBoard(): void {
        this.archiveBoard.emit();
    }

    onDeleteBoard(): void {
        this.deleteBoard.emit();
    }
}
