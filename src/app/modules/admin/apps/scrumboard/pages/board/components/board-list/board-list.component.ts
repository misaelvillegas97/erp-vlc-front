import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, input, output }                         from '@angular/core';
import { MatButtonModule }                                  from '@angular/material/button';
import { MatIconModule }                                    from '@angular/material/icon';
import { MatMenuModule }                                    from '@angular/material/menu';
import { Card, List }                                       from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardBoardAddCardComponent }                  from '../../add-card/add-card.component';
import { ScrumboardBoardCardComponent }                     from '../board-card/board-card.component';

@Component({
    selector: 'scrumboard-board-list',
    template: `
        <div class="w-72 flex-0 rounded-xl p-3 bg-white/95 dark:bg-gray-800/95 shadow-lg border border-white/20 dark:border-gray-600/20 min-h-fit hover:shadow-xl"
             [style.background-color]="list().color ? list().color + '95' : 'rgba(255,255,255,0.95)'"
             cdkDrag
             cdkDragPreviewClass="list-drag-preview">
            <div class="flex items-center justify-between" cdkDragHandle>
                <div
                    class="flex w-full cursor-text items-center rounded-lg border border-transparent px-3 py-2 focus-within:border-blue-500 focus-within:bg-white/95 dark:focus-within:bg-gray-700/95 focus-within:shadow-md transition-all duration-200">
                    @if (list().icon) {
                        <mat-icon class="mr-2 text-current" [svgIcon]="list().icon"></mat-icon>
                    }
                    <input
                        class="w-full bg-transparent font-medium leading-5"
                        [spellcheck]="'false'"
                        [value]="list().title"
                        (focusout)="onUpdateListTitle($event)"
                        (keydown.enter)="listTitleInput.blur()"
                        #listTitleInput
                    />
                </div>
                <div class="ml-4 flex min-w-6 items-center justify-center rounded-full bg-gray-500/20 dark:bg-gray-400/20 text-gray-700 dark:text-gray-300 text-sm font-semibold leading-6 backdrop-blur-sm">
                    {{ list().cards.length }}
                </div>
                <div class="ml-1">
                    <button class="h-8 min-h-8 w-8" mat-icon-button [matMenuTriggerFor]="listMenu">
                        <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:ellipsis-vertical'"></mat-icon>
                    </button>
                    <mat-menu #listMenu="matMenu">
                        <button mat-menu-item (click)="onRenameList(listTitleInput)">
                            <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:pencil-square'"></mat-icon>
                            Renombrar lista
                        </button>
                        <button mat-menu-item (click)="onEditListProperties()">
                            <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:cog'"></mat-icon>
                            Personalizar lista
                        </button>
                        <button mat-menu-item color="warn" (click)="onDeleteList()">
                            <mat-icon class="icon-size-5" [svgIcon]="'heroicons_solid:trash'"></mat-icon>
                            Eliminar lista
                        </button>
                    </mat-menu>
                </div>
            </div>

            <!-- Cards -->
            <div class="mt-3 rounded-lg bg-black/5 border border-white/10">
                <div
                    class="p-3 pb-0 min-h-22 rounded-lg"
                    cdkDropList
                    [id]="list().id"
                    [cdkDropListData]="list().cards"
                    (cdkDropListDropped)="onCardDropped($event)"
                >
                    <!-- Card -->
                    @for (card of list().cards; track trackByFn($index, card)) {
                        <div cdkDrag
                             cdkDragPreviewClass="card-drag-preview"
                             cdkDragPlaceholderClass="card-drag-placeholder">
                            <scrumboard-board-card [card]="card"></scrumboard-board-card>
                        </div>
                    }
                </div>

                <!-- New card -->
                <scrumboard-board-add-card
                    (saved)="onAddCard($event)"
                    [buttonTitle]="list().cards.length ? 'Agregar otra tarjeta' : 'Agregar una tarjeta'"
                >
                </scrumboard-board-add-card>
            </div>
        </div>
    `,
    imports : [
        CdkDrag,
        CdkDragHandle,
        CdkDropList,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        ScrumboardBoardAddCardComponent,
        ScrumboardBoardCardComponent
    ]
})
export class ScrumboardBoardListComponent {
    // Inputs
    list = input.required<List>();

    // Outputs
    updateListTitle = output<{ event: any, list: List }>();
    renameList = output<HTMLElement>();
    editListProperties = output<List>();
    deleteList = output<string>();
    addCard = output<{ list: List, title: string }>();
    cardDropped = output<CdkDragDrop<Card[]>>();

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Event handlers
     */
    onUpdateListTitle(event: any): void {
        this.updateListTitle.emit({event, list: this.list()});
    }

    onRenameList(listTitleInput: HTMLElement): void {
        this.renameList.emit(listTitleInput);
    }

    onEditListProperties(): void {
        this.editListProperties.emit(this.list());
    }

    onDeleteList(): void {
        this.deleteList.emit(this.list().id);
    }

    onAddCard(title: string): void {
        this.addCard.emit({list: this.list(), title});
    }

    onCardDropped(event: CdkDragDrop<Card[]>): void {
        this.cardDropped.emit(event);
    }
}
