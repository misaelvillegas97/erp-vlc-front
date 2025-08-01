import { Component, input, output } from '@angular/core';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatMenuModule }            from '@angular/material/menu';
import { MatTooltip }               from '@angular/material/tooltip';
import { Board }                    from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { UserAvatarComponent } from '@shared/components/user-avatar';

@Component({
    selector: 'scrumboard-board-header',
    template: `
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 lg:py-4 lg:px-6 border-b bg-card dark:bg-transparent gap-3 sm:gap-0">
            <!-- Board title and description -->
            <div class="flex items-center w-full sm:w-auto">
                <div class="flex flex-col min-w-0 flex-1">
                    <div class="text-lg sm:text-xl lg:text-2xl font-semibold truncate">{{ board()?.title }}</div>
                    <div class="text-secondary text-sm sm:text-base line-clamp-2">{{ board()?.description }}</div>
                </div>
            </div>

            <!-- Board actions -->
            <div class="flex items-center w-full sm:w-auto justify-between sm:justify-end mt-0">
                <!-- Board members -->
                <div class="flex items-center -space-x-1 sm:-space-x-1.5 mr-3 sm:mr-4">
                    @for (member of board()?.members; track member.id) {
                        <user-avatar
                            class="w-7 h-7 sm:w-8 sm:h-8"
                            [name]="member.name"
                            [avatar]="member.avatar">
                        </user-avatar>
                    }
                </div>

                <!-- Add member button -->
                <button
                    class="ml-1 sm:ml-2 !w-10 !h-10 sm:!w-9 sm:!h-9"
                    mat-icon-button
                    [matTooltip]="'Add member'"
                    (click)="onAddMember()">
                    <mat-icon [svgIcon]="'heroicons_outline:user-plus'" class="!text-lg sm:!text-base"></mat-icon>
                </button>

                <!-- Board settings -->
                <button
                    class="ml-1 sm:ml-2 !w-10 !h-10 sm:!w-9 sm:!h-9"
                    mat-icon-button
                    [matMenuTriggerFor]="boardMenu">
                    <mat-icon [svgIcon]="'heroicons_outline:cog'" class="!text-lg sm:!text-base"></mat-icon>
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
        MatTooltip,
        UserAvatarComponent
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
