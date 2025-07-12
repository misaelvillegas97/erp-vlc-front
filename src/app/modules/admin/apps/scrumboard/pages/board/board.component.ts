import { CdkDragDrop, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem, }                    from '@angular/cdk/drag-drop';
import { CdkScrollable }                                                                                      from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup }                                                               from '@angular/forms';
import { MatButtonModule }                                                                                    from '@angular/material/button';
import { MatIconModule }                                                                                      from '@angular/material/icon';
import { MatMenuModule }                                                                                      from '@angular/material/menu';
import { ActivatedRoute, RouterOutlet }                                                                       from '@angular/router';
import { debounceTime, firstValueFrom, Subject }                                                              from 'rxjs';

import { FuseConfirmationService }            from '@fuse/services/confirmation';
import { Card, List, }                        from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService }                  from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { WebsocketService }                   from '@modules/admin/apps/scrumboard/services/websocket.service';
import { ScrumboardBoardAddListComponent }    from './add-list/add-list.component';
import { ScrumboardBoardHeaderComponent }     from './components/board-header/board-header.component';
import { ScrumboardBoardNavigationComponent } from './components/board-navigation/board-navigation.component';
import { ScrumboardBoardListComponent }       from './components/board-list/board-list.component';

@Component({
    selector       : 'scrumboard-board',
    templateUrl    : './board.component.html',
    styleUrls      : [ './board.component.scss' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButtonModule,
        MatIconModule,
        CdkScrollable,
        CdkDropList,
        CdkDropListGroup,
        MatMenuModule,
        ScrumboardBoardAddListComponent,
        ScrumboardBoardHeaderComponent,
        ScrumboardBoardNavigationComponent,
        ScrumboardBoardListComponent,
        RouterOutlet
    ],
})
export class ScrumboardBoardComponent implements OnInit, OnDestroy {
    readonly #boardService = inject(ScrumboardService);

    board = this.#boardService.board;
    listTitleForm: UntypedFormGroup;

    // Computed properties for template
    boardTitle = computed<string>(() => this.board()?.title || '');
    boardLists = computed<List[]>(() => this.board()?.lists || []);

    // Private
    private readonly _positionStep: number = 65536;
    private readonly _maxListCount: number = 200;
    private readonly _maxPosition: number = this._positionStep * 500;

    // Debounced update subjects for performance optimization
    private readonly _cardUpdateSubject = new Subject<{ id: string, card: Card }>();
    private readonly _listUpdateSubject = new Subject<List[]>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _scrumboardService: ScrumboardService,
        private _wsService: WebsocketService,
        private readonly _route: ActivatedRoute
    ) {
        this.subscribeToBoardJoined();

        // Connect to the websocket
        this._wsService.connect();

        // Join the board
        this._wsService.joinBoard(this._route.snapshot.params.boardId);

        // Create an effect to log card updates
        effect(() => {
            const card = this._wsService.cardUpdated();
            if (card) {
                console.log('cardUpdated', card);
            }
        });

        // Setup debounced API calls for better performance
        this._cardUpdateSubject.pipe(
            debounceTime(300) // Wait 300ms after last drag operation
        ).subscribe(async ({id, card}) => {
            try {
                await this._scrumboardService.updateCard(id, card);
            } catch (error) {
                console.error('Error updating card:', error);
            }
        });

        this._listUpdateSubject.pipe(
            debounceTime(300) // Wait 300ms after last drag operation
        ).subscribe((lists) => {
            this._scrumboardService.updateLists(lists).subscribe({
                error: (error) => console.error('Error updating lists:', error)
            });
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Initialize the list title form
        this.listTitleForm = this._formBuilder.group({
            title: [ '' ],
        });

        // Get the board ID from the route
        const boardId = this._route.snapshot.params.boardId;

        // Fetch the board data
        this._scrumboardService.getBoard(boardId).subscribe();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._wsService.disconnect();

        // Clean up subjects to prevent memory leaks
        this._cardUpdateSubject.complete();
        this._listUpdateSubject.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Focus on the given element to start editing the list title
     *
     * @param listTitleInput
     */
    renameList(listTitleInput: HTMLElement): void {
        // Use timeout so it can wait for menu to close
        setTimeout(() => {
            listTitleInput.focus();
        });
    }

    /**
     * Add new list
     *
     * @param title
     */
    addList(title: string): void {
        const currentBoard = this.board();

        if (!currentBoard) {
            return;
        }

        // Limit the max list count
        if (currentBoard.lists.length >= this._maxListCount) {
            return;
        }

        // Create a new list model
        const list = new List({
            boardId : currentBoard.id,
            position: currentBoard.lists.length
                ? currentBoard.lists[currentBoard.lists.length - 1].position +
                this._positionStep
                : this._positionStep,
            title   : title,
        });

        // Save the list
        this._scrumboardService.createList(list).subscribe();
    }

    /**
     * Update the list title
     *
     * @param event
     * @param list
     */
    updateListTitle(event: any, list: List): void {
        // Get the target element
        const element: HTMLInputElement = event.target;

        // Get the new title
        const newTitle = element.value;

        // If the title is empty...
        if (!newTitle || newTitle.trim() === '') {
            // Reset to original title and return
            element.value = list.title;
            return;
        }

        // Update the list title and element value
        list.title = element.value = newTitle.trim();

        // Update the list
        this._scrumboardService.updateList(list).subscribe();
    }

    /**
     * Delete the list
     *
     * @param id
     */
    deleteList(id): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Eliminar lista',
            message:
                '¿Estás seguro de que deseas eliminar esta lista y sus tarjetas? ¡Esta acción no se puede deshacer!',
            actions: {
                confirm: {
                    label: 'Eliminar',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                // Delete the list
                this._scrumboardService.deleteList(id).subscribe();
            }
        });
    }

    /**
     * Add new card
     */
    addCard(list: List, title: string): void {
        const currentBoard = this.board();

        if (!currentBoard) {
            return;
        }

        // Create a new card model
        const card = new Card({
            boardId: currentBoard.id,
            listId  : list.id,
            position: list.cards.length
                ? list.cards[list.cards.length - 1].position +
                this._positionStep
                : this._positionStep,
            title   : title,
        });

        // Save the card
        this._scrumboardService.createCard(card).subscribe();
    }

    /**
     * List dropped
     *
     * @param event
     */
    listDropped(event: CdkDragDrop<List[]>): void {
        // Move the item
        moveItemInArray(
            event.container.data,
            event.previousIndex,
            event.currentIndex
        );

        // Calculate the positions
        const updated = this._calculatePositions(event);

        // Use debounced subject for better performance
        this._listUpdateSubject.next(updated);
    }

    /**
     * Card dropped
     *
     * @param event
     */
    cardDropped(event: CdkDragDrop<Card[]>): void {
        // Move or transfer the item
        if (event.previousContainer === event.container) {
            // Move the item
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        } else {
            // Transfer the item
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );

            // Update the card's list it
            event.container.data[event.currentIndex].listId =
                event.container.id;
        }

        // Calculate the positions
        const updated = this._calculatePositions(event);

        // Use debounced subject for better performance
        this._cardUpdateSubject.next({id: updated[0].id, card: updated[0]});
    }


    /**
     * Edit list properties
     *
     * @param list
     */
    editListProperties(list: List): void {
        // Open dialog to edit list properties (color, icon)
        // This would be implemented with a dialog component
        console.log('Edit list properties', list);
        // For now, we'll just set some default values
        const colors = [
            '#EF4444', // Red
            '#F59E0B', // Amber
            '#10B981', // Emerald
            '#3B82F6', // Blue
            '#8B5CF6', // Violet
            '#EC4899', // Pink
            '#6B7280', // Gray
        ];

        const icons = [
            'heroicons_outline:clipboard-document-list',
            'heroicons_outline:clipboard-document-check',
            'heroicons_outline:bug-ant',
            'heroicons_outline:light-bulb',
            'heroicons_outline:rocket-launch',
            'heroicons_outline:star',
            'heroicons_outline:flag',
        ];

        // Randomly select a color and icon if not already set
        if (!list.color) {
            list.color = colors[Math.floor(Math.random() * colors.length)];
        }

        if (!list.icon) {
            list.icon = icons[Math.floor(Math.random() * icons.length)];
        }

        // Update the list
        void firstValueFrom(this._scrumboardService.updateList(list));
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Subscribe to the board joined event
     */
    subscribeToBoardJoined(): void {
        // Create an effect to log board joined events
        effect(() => {
            const boardId = this._wsService.boardJoined();
            if (boardId) {
                console.log('boardJoined', boardId);
            }
        });
    }

    /**
     * Board header event handlers
     */
    onAddMember(): void {
        // TODO: Implement add member functionality
        console.log('Add member clicked');
    }

    onEditBoard(): void {
        // TODO: Implement edit board functionality
        console.log('Edit board clicked');
    }

    onChangeBackground(): void {
        // TODO: Implement change background functionality
        console.log('Change background clicked');
    }

    onArchiveBoard(): void {
        // TODO: Implement archive board functionality
        console.log('Archive board clicked');
    }

    onDeleteBoard(): void {
        // TODO: Implement delete board functionality
        console.log('Delete board clicked');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Calculate and set item positions
     * from given CdkDragDrop event
     *
     * @param event
     * @private
     */
    private _calculatePositions(event: CdkDragDrop<any[]>): any[] {
        // Get the items
        let items = event.container.data;
        const currentItem = items[event.currentIndex];
        const prevItem = items[event.currentIndex - 1] || null;
        const nextItem = items[event.currentIndex + 1] || null;

        // If the item moved to the top...
        if (!prevItem) {
            // If the item moved to an empty container
            if (!nextItem) {
                currentItem.position = this._positionStep;
            } else {
                currentItem.position = nextItem.position / 2;
            }
        }
        // If the item moved to the bottom...
        else if (!nextItem) {
            currentItem.position = prevItem.position + this._positionStep;
        }
        // If the item moved in between other items...
        else {
            currentItem.position = (prevItem.position + nextItem.position) / 2;
        }

        // Check if all item positions need to be updated
        if (
            !Number.isInteger(currentItem.position) ||
            currentItem.position >= this._maxPosition
        ) {
            // Re-calculate all orders
            items = items.map((value, index) => {
                value.position = (index + 1) * this._positionStep;
                return value;
            });

            // Return items
            return items;
        }

        // Return currentItem
        return [ currentItem ];
    }
}
