import { HttpClient }                         from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';

import { firstValueFrom, map, Observable, of, tap, throwError, } from 'rxjs';

import { Board, Card, Label, List } from '@modules/admin/apps/scrumboard/models/scrumboard.models';

@Injectable({providedIn: 'root'})
export class ScrumboardService {
    // Private
    private _board = signal<Board | null>(null);
    private _boards = signal<Board[] | null>(null);
    private _card = signal<Card | null>(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
        // No initialization needed for signals
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for board
     */
    get board(): WritableSignal<Board | null> {
        return this._board;
    }

    /**
     * Getter for boards
     */
    get boards(): WritableSignal<Board[] | null> {
        return this._boards;
    }

    /**
     * Getter for card
     */
    get card(): WritableSignal<Card | null> {
        return this._card;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get boards
     */
    getBoards(): Observable<Board[]> {
        return this._httpClient.get<Board[]>('api/scrumboard/board').pipe(
            map((response) => response.map((item) => new Board(item))),
            tap((boards) => this._boards.set(boards))
        );
    }

    /**
     * Get board
     *
     * @param id
     */
    getBoard(id: string): Observable<Board> {
        return this._httpClient
            .get<Board>('api/scrumboard/board/' + id)
            .pipe(
                map((response) => new Board(response)),
                tap((board) => this._board.set(board))
            );
    }

    /**
     * Create board
     *
     * @param board
     */
    createBoard(board: Board): Observable<Board> {
        const currentBoards = this._boards();

        return this._httpClient
            .post<Board>('api/scrumboard/board', board)
            .pipe(
                map((newBoard) => {
                    // Update the boards with the new board
                    this._boards.set([ newBoard, ...(currentBoards || []) ]);

                    // Return new board from observable
                    return newBoard;
                })
            );
    }

    /**
     * Update the board
     *
     * @param id
     * @param board
     */
    updateBoard(id: string, board: Board): Observable<Board> {
        return this._httpClient
            .patch<Board>('api/scrumboard/board/' + id, board)
            .pipe(tap((updatedBoard) => this._board.set(updatedBoard)));
    }

    /**
     * Delete the board
     *
     * @param id
     */
    deleteBoard(id: string): Observable<boolean> {
        const currentBoards = this._boards();

        return this._httpClient
            .delete('api/scrumboard/board', {params: {id}})
            .pipe(
                map((isDeleted: boolean) => {
                    if (currentBoards) {
                        // Find the index of the deleted board
                        const index = currentBoards.findIndex(
                            (item) => item.id === id
                        );

                        // Create a new array without the deleted board
                        const updatedBoards = [ ...currentBoards ];
                        updatedBoards.splice(index, 1);

                        // Update the boards
                        this._boards.set(updatedBoards);
                    }

                    // Update the board
                    this._board.set(null);

                    // Update the card
                    this._card.set(null);

                    // Return the deleted status
                    return isDeleted;
                })
            );
    }

    /**
     * Create list
     *
     * @param list
     */
    createList(list: List): Observable<List> {
        return this._httpClient
            .post<List>('api/scrumboard/list', list)
            .pipe(
                map((response) => new List(response)),
                tap((newList) => {
                    // Get the board value
                    const board = this._board();

                    if (board) {
                        // Create a new board object with updated lists
                        const updatedBoard = {...board};

                        // Update the board lists with the new list
                        updatedBoard.lists = [ ...board.lists, newList ];

                        // Sort the board lists
                        updatedBoard.lists.sort((a, b) => a.position - b.position);

                        // Update the board
                        this._board.set(updatedBoard);
                    }
                })
            );
    }

    /**
     * Update the list
     *
     * @param list
     */
    updateList(list: List): Observable<List> {
        return this._httpClient
            .patch<List>('api/scrumboard/list/' + list.id, list)
            .pipe(
                map((response) => new List(response)),
                tap((updatedList) => {
                    // Get the board value
                    const board = this._board();

                    if (board) {
                        // Create a new board object
                        const updatedBoard = {...board};

                        // Create a new lists array
                        updatedBoard.lists = [ ...board.lists ];

                        // Find the index of the updated list
                        const index = updatedBoard.lists.findIndex(
                            (item) => item.id === list.id
                        );

                        // Update the list
                        updatedBoard.lists[index] = updatedList;

                        // Sort the board lists
                        updatedBoard.lists.sort((a, b) => a.position - b.position);

                        // Update the board
                        this._board.set(updatedBoard);
                    }
                })
            );
    }

    /**
     * Update the lists
     *
     * @param lists
     */
    updateLists(lists: List[]): Observable<List> {
        return this._httpClient
            .patch<List>('api/scrumboard/list/' + lists[0].id, lists[0])
            .pipe(
                map((response) => new List(response)),
                tap((updatedList) => {
                    // Get the board value
                    const board = this._board();

                    if (board) {
                        // Create a new board object
                        const updatedBoard = {...board};

                        // Create a new lists array
                        updatedBoard.lists = [ ...board.lists ];

                        const index = updatedBoard.lists.findIndex(
                            (item) => item.id === updatedList.id
                        );

                        // Update the list
                        updatedBoard.lists[index] = updatedList;

                        // Sort the board lists
                        updatedBoard.lists.sort((a, b) => a.position - b.position);

                        // Update the board
                        this._board.set(updatedBoard);
                    }
                })
            );
    }

    /**
     * Delete the list
     *
     * @param id
     */
    deleteList(id: string): Observable<boolean> {
        return this._httpClient
            .delete<boolean>(`api/scrumboard/list/${ id }`)
            .pipe(
                tap((isDeleted) => {
                    // Get the board value
                    const board = this._board();

                    if (board) {
                        // Create a new board object
                        const updatedBoard = {...board};

                        // Find the index of the deleted list
                        const index = board.lists.findIndex(
                            (item) => item.id === id
                        );

                        // Create a new lists array without the deleted list
                        updatedBoard.lists = [ ...board.lists ];
                        updatedBoard.lists.splice(index, 1);

                        // Sort the board lists
                        updatedBoard.lists.sort((a, b) => a.position - b.position);

                        // Update the board
                        this._board.set(updatedBoard);
                    }
                })
            );
    }

    /**
     * Get card
     */
    getCard(id: string): Observable<Card> {
        const board = this._board();

        if (!board) {
            return throwError(() => new Error('Board not found!'));
        }

        // Find the list containing the card
        const list = board.lists.find((list) => list.cards.some((item) => item.id === id));

        if (!list) {
            return throwError(() => new Error('Could not find a list containing the card with id of ' + id + '!'));
        }

        // Find the card
        const card = list.cards.find((item) => item.id === id);

        if (!card) {
            return throwError(() => new Error('Could not found the card with id of ' + id + '!'));
        }

        // Update the card
        this._card.set(card);

        // Return the card
        return of(card);
    }

    /**
     * Create card
     *
     * @param card
     */
    createCard(card: Card): Observable<Card> {
        return this._httpClient
            .post<Card>('api/scrumboard/card', card)
            .pipe(
                map((response) => new Card(response)),
                tap((newCard) => {
                    // Get the board value
                    const board = this._board();

                    if (board) {
                        // Create a new board object
                        const updatedBoard = {...board};

                        // Create a new lists array
                        updatedBoard.lists = [ ...board.lists ];

                        // Find the list and push the new card in it
                        updatedBoard.lists.forEach((listItem, index, list) => {
                            if (listItem.id === newCard.listId) {
                                // Create a new cards array for this list
                                list[index] = {...listItem, cards: [ ...listItem.cards, newCard ]};
                            }
                        });

                        // Update the board
                        this._board.set(updatedBoard);
                    }

                    // Update the card
                    this._card.set(newCard);

                    // Return the new card
                    return newCard;
                })
            );
    }

    /**
     * Update the card
     *
     * @param id
     * @param card
     */
    async updateCard(id: string, card: Card): Promise<Card> {
        const clonedCard = {...card};

        if (clonedCard.labels) clonedCard.labels = clonedCard.labels.map((label) => label.id) as any;
        if (clonedCard.assignees) clonedCard.assignees = clonedCard.assignees.map((assignee) => assignee.id) as any;

        const updatedCard = await firstValueFrom(this._httpClient.patch<Card>('api/scrumboard/card/' + id, clonedCard));

        this._board.update((board) => {
            const list = board.lists.find((list) => list.cards.some((item) => item.id === id));

            if (!list) throw new Error('Could not find a list containing the card with id of ' + id + '!');

            const cardIndex = list.cards.findIndex((item) => item.id === id);

            if (cardIndex === -1) throw new Error('Could not find the card with id of ' + id + '!');

            list.cards[cardIndex] = updatedCard;
            list.cards.sort((a, b) => a.position - b.position);

            return board;
        });

        return updatedCard;
    }

    /**
     * Update the cards
     *
     * @param cards
     */
    updateCards(cards: Card[]): Observable<Card[]> {
        return this._httpClient
            .patch<Card[]>('api/scrumboard/card', {cards})
            .pipe(
                map((response) => response.map((item) => new Card(item))),
                tap((updatedCards) => {
                    // Get the board value
                    const board = this._board();

                    // Go through the updated cards
                    updatedCards.forEach((updatedCard) => {
                        // Find the index of the updated card's list
                        const listIndex = board.lists.findIndex(
                            (list) => list.id === updatedCard.listId
                        );

                        // Find the index of the updated card
                        const cardIndex = board.lists[
                            listIndex
                            ].cards.findIndex((item) => item.id === updatedCard.id);

                        // Update the card
                        board.lists[listIndex].cards[cardIndex] = updatedCard;

                        // Sort the cards
                        board.lists[listIndex].cards.sort(
                            (a, b) => a.position - b.position
                        );
                    });

                    // Update the board
                    this._board.set(board);
                })
            );
    }

    /**
     * Delete the card
     *
     * @param id
     */
    deleteCard(id: string): Observable<boolean> {
        return this._httpClient.delete('api/scrumboard/card', {params: {id}}).pipe(
            tap((isDeleted: boolean) => {
                this._board.update((board) => {
                    const list = board.lists.find((list) => list.cards.some((item) => item.id === id));

                    if (!list) throw new Error('Could not find a list containing the card with id of ' + id + '!');

                    const cardIndex = list.cards.findIndex((item) => item.id === id);

                    if (cardIndex === -1) throw new Error('Could not find the card with id of ' + id + '!');

                    list.cards.splice(cardIndex, 1);

                    return board;
                });

                this._card.set(null);
            })
        );
    }

    /**
     * Create label
     *
     * @param label
     */
    createLabel(label: Label): Observable<Label> {
        return this._httpClient.post<Label>('api/scrumboard/label', {label}).pipe(
            tap((newLabel) => {
                this._board.update((board) => {
                    const updatedBoard = {...board};

                    updatedBoard.labels = [ ...board.labels, newLabel ];

                    return updatedBoard;
                });
            })
        );
    }

    /**
     * Update the label
     *
     * @param id
     * @param label
     */
    updateLabel(id: string, label: Label): Observable<Label> {
        return this._httpClient.put<Label>('api/scrumboard/label/' + id, {label}).pipe(
            tap((updatedLabel) => {
                this._board.update((board) => {
                    const updatedBoard = {...board};

                    updatedBoard.labels = [ ...board.labels ];

                    const index = updatedBoard.labels.findIndex((item) => item.id === id);

                    updatedBoard.labels[index] = updatedLabel;
                    return updatedBoard;
                });
            })
        );
    }

    /**
     * Delete the label
     *
     * @param id
     */
    deleteLabel(id: string): Observable<boolean> {
        return this._httpClient.delete<boolean>('api/scrumboard/label/' + id).pipe(
            tap((isDeleted: boolean) => {
                this._board.update((board) => {
                    const updatedBoard = {...board};

                    const index = updatedBoard.labels.findIndex((item) => item.id === id);

                    updatedBoard.labels.splice(index, 1);

                    if (isDeleted) {
                        updatedBoard.lists.forEach((list) => {
                            list.cards.forEach((card) => {
                                const labelIndex = card.labels.findIndex((label) => label.id === id);
                                if (labelIndex > -1) {
                                    card.labels.splice(labelIndex, 1);
                                }
                            });
                        });
                    }

                    return updatedBoard;
                })
            })
        );
    }

    addMember(boardId: string, memberId: string): Observable<Board> {
        return this._httpClient
            .patch<Board>('api/scrumboard/board/' + boardId + '/members', {memberId})
            .pipe(
                map((response) => new Board(response)),
                tap((board) => this._board.set(board))
            );
    }

    removeMember(boardId: string, memberId: string): Observable<Board> {
        return this._httpClient
            .delete<Board>('api/scrumboard/board/' + boardId + '/members/' + memberId)
            .pipe(
                map((response) => new Board(response)),
                tap((board) => this._board.set(board))
            );
    }

    addLabel(boardId: string, label: Label): Observable<Label> {
        return this._httpClient
            .post<Label>('api/scrumboard/board/' + boardId + '/labels', label)
            .pipe(
                tap((label) => {
                    // Get the board value
                    const board = this._board();

                    // Update the board labels with the new label
                    board.labels = [ ...board.labels, label ];

                    // Update the board
                    this._board.set(board);
                })
            );
    }

    removeLabel(boardId: string, labelId: string): Observable<boolean> {
        return this._httpClient
            .delete<boolean>('api/scrumboard/board/' + boardId + '/labels/' + labelId)
            .pipe(
                tap((isDeleted) => {
                    // Get the board value
                    const board = this._board();

                    // Find the index of the deleted label
                    const index = board.labels.findIndex(
                        (item) => item.id === labelId
                    );

                    // Delete the label
                    board.labels.splice(index, 1);

                    // Update the board
                    this._board.set(board);
                })
            );
    }

    /**
     * Search within board cards
     *
     * @param query
     */
    // search(query: string): Observable<Card[] | null> {
    //   // @TODO: Update the board cards based on the search results
    //   return this._httpClient.get<Card[] | null>(
    //     'api/scrumboard/search',
    //     {params: {query}}
    //   );
    // }
}
