import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, map, Observable, of, switchMap, take, tap, throwError, } from 'rxjs';

import { Board, Card, Label, List } from '@modules/admin/apps/scrumboard/models/scrumboard.models';

@Injectable({providedIn: 'root'})
export class ScrumboardService {
    // Private
    private _board: BehaviorSubject<Board | null>;
    private _boards: BehaviorSubject<Board[] | null>;
    private _card: BehaviorSubject<Card | null>;

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
        // Set the private defaults
        this._board = new BehaviorSubject(null);
        this._boards = new BehaviorSubject(null);
        this._card = new BehaviorSubject(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for board
     */
    get board$(): Observable<Board> {
        return this._board.asObservable();
    }

    /**
     * Getter for boards
     */
    get boards$(): Observable<Board[]> {
        return this._boards.asObservable();
    }

    /**
     * Getter for card
     */
    get card$(): Observable<Card> {
        return this._card.asObservable();
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
            tap((boards) => this._boards.next(boards))
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
                tap((board) => this._board.next(board))
            );
    }

    /**
     * Create board
     *
     * @param board
     */
    createBoard(board: Board): Observable<Board> {
        return this.boards$.pipe(
            take(1),
            switchMap((boards) =>
                this._httpClient
                    .post<Board>('api/scrumboard/board', board)
                    .pipe(
                        map((newBoard) => {
                            // Update the boards with the new board
                            this._boards.next([ newBoard, ...boards ]);

                            // Return new board from observable
                            return newBoard;
                        })
                    )
            )
        );
    }

    /**
     * Update the board
     *
     * @param id
     * @param board
     */
    updateBoard(id: string, board: Board): Observable<Board> {
        return this.boards$.pipe(
            take(1),
            switchMap((boards) =>
                this._httpClient
                    .patch<Board>('api/scrumboard/board/' + id, board)
                    .pipe(tap((updatedBoard) => this._board.next(updatedBoard)))
            )
        );
    }

    /**
     * Delete the board
     *
     * @param id
     */
    deleteBoard(id: string): Observable<boolean> {
        return this.boards$.pipe(
            take(1),
            switchMap((boards) =>
                this._httpClient
                    .delete('api/scrumboard/board', {params: {id}})
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted board
                            const index = boards.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the board
                            boards.splice(index, 1);

                            // Update the boards
                            this._boards.next(boards);

                            // Update the board
                            this._board.next(null);

                            // Update the card
                            this._card.next(null);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
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
                    const board = this._board.value;

                    // Update the board lists with the new list
                    board.lists = [ ...board.lists, newList ];

                    // Sort the board lists
                    board.lists.sort((a, b) => a.position - b.position);

                    // Update the board
                    this._board.next(board);
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
                    const board = this._board.value;

                    // Find the index of the updated list
                    const index = board.lists.findIndex(
                        (item) => item.id === list.id
                    );

                    // Update the list
                    board.lists[index] = updatedList;

                    // Sort the board lists
                    board.lists.sort((a, b) => a.position - b.position);

                    // Update the board
                    this._board.next(board);
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
                    const board = this._board.value;
                    const index = board.lists.findIndex(
                        (item) => item.id === updatedList.id
                    );

                    // Update the list
                    board.lists[index] = updatedList;

                    // Sort the board lists
                    board.lists.sort((a, b) => a.position - b.position);

                    // Update the board
                    this._board.next(board);
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
                    const board = this._board.value;

                    // Find the index of the deleted list
                    const index = board.lists.findIndex(
                        (item) => item.id === id
                    );

                    // Delete the list
                    board.lists.splice(index, 1);

                    // Sort the board lists
                    board.lists.sort((a, b) => a.position - b.position);

                    // Update the board
                    this._board.next(board);
                })
            );
    }

    /**
     * Get card
     */
    getCard(id: string): Observable<Card> {
        return this._board.pipe(
            take(1),
            map((board) => {
                // Find the card
                const card = board.lists
                    .find((list) => list.cards.some((item) => item.id === id))
                    .cards.find((item) => item.id === id);

                // Update the card
                this._card.next(card);

                // Return the card
                return card;
            }),
            switchMap((card) => {
                if (!card) {
                    return throwError(() => new Error('Could not found the card with id of ' + id + '!'));
                }

                return of(card);
            })
        );
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
                    const board = this._board.value;

                    // Find the list and push the new card in it
                    board.lists.forEach((listItem, index, list) => {
                        if (listItem.id === newCard.listId) {
                            list[index].cards.push(newCard);
                        }
                    });

                    // Update the board
                    this._board.next(board);

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
    updateCard(id: string, card: Card): Observable<Card> {
        const clonedCard = {...card};

        if (clonedCard.labels) clonedCard.labels = clonedCard.labels.map((label) => label.id) as any;
        if (clonedCard.assignees) clonedCard.assignees = clonedCard.assignees.map((assignee) => assignee.id) as any;

        return this.board$.pipe(
            take(1),
            switchMap((board) =>
                this._httpClient
                    .patch<Card>('api/scrumboard/card/' + id, clonedCard)
                    .pipe(
                        map((updatedCard) => {
                            // Find the card and update it
                            board.lists.forEach((listItem) => {
                                listItem.cards.forEach(
                                    (cardItem, index, array) => {
                                        if (cardItem.id === id) {
                                            array[index] = updatedCard;
                                        }
                                    }
                                );
                            });

                            // Update the board
                            this._board.next(board);

                            // Update the card
                            this._card.next(updatedCard);

                            // Return the updated card
                            return updatedCard;
                        })
                    )
            )
        );
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
                    const board = this._board.value;

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
                    this._board.next(board);
                })
            );
    }

    /**
     * Delete the card
     *
     * @param id
     */
    deleteCard(id: string): Observable<boolean> {
        return this.board$.pipe(
            take(1),
            switchMap((board) =>
                this._httpClient
                    .delete('api/scrumboard/card', {
                        params: {id},
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the card and delete it
                            board.lists.forEach((listItem) => {
                                listItem.cards.forEach(
                                    (cardItem, index, array) => {
                                        if (cardItem.id === id) {
                                            array.splice(index, 1);
                                        }
                                    }
                                );
                            });

                            // Update the board
                            this._board.next(board);

                            // Update the card
                            this._card.next(null);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }

    /**
     * Create label
     *
     * @param label
     */
    createLabel(label: Label): Observable<Label> {
        return this.board$.pipe(
            take(1),
            switchMap((board) =>
                this._httpClient
                    .post<Label>('api/scrumboard/label', {label})
                    .pipe(
                        map((newLabel) => {
                            // Update the board labels with the new label
                            board.labels = [ ...board.labels, newLabel ];

                            // Update the board
                            this._board.next(board);

                            // Return new label from observable
                            return newLabel;
                        })
                    )
            )
        );
    }

    /**
     * Update the label
     *
     * @param id
     * @param label
     */
    updateLabel(id: string, label: Label): Observable<Label> {
        return this.board$.pipe(
            take(1),
            switchMap((board) =>
                this._httpClient
                    .patch<Label>('api/scrumboard/label', {
                        id,
                        label,
                    })
                    .pipe(
                        map((updatedLabel) => {
                            // Find the index of the updated label
                            const index = board.labels.findIndex(
                                (item) => item.id === id
                            );

                            // Update the label
                            board.labels[index] = updatedLabel;

                            // Update the board
                            this._board.next(board);

                            // Return the updated label
                            return updatedLabel;
                        })
                    )
            )
        );
    }

    /**
     * Delete the label
     *
     * @param id
     */
    deleteLabel(id: string): Observable<boolean> {
        return this.board$.pipe(
            take(1),
            switchMap((board) =>
                this._httpClient
                    .delete('api/scrumboard/label', {
                        params: {id},
                    })
                    .pipe(
                        map((isDeleted: boolean) => {
                            // Find the index of the deleted label
                            const index = board.labels.findIndex(
                                (item) => item.id === id
                            );

                            // Delete the label
                            board.labels.splice(index, 1);

                            // If the label is deleted...
                            if (isDeleted) {
                                // Remove the label from any card that uses it
                                board.lists.forEach((list) => {
                                    list.cards.forEach((card) => {
                                        const labelIndex =
                                            card.labels.findIndex(
                                                (label) => label.id === id
                                            );
                                        if (labelIndex > -1) {
                                            card.labels.splice(labelIndex, 1);
                                        }
                                    });
                                });
                            }

                            // Update the board
                            this._board.next(board);

                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }

    addMember(boardId: string, memberId: string): Observable<Board> {
        return this._httpClient
            .patch<Board>('api/scrumboard/board/' + boardId + '/members', {memberId})
            .pipe(
                map((response) => new Board(response)),
                tap((board) => this._board.next(board))
            );
    }

    removeMember(boardId: string, memberId: string): Observable<Board> {
        return this._httpClient
            .delete<Board>('api/scrumboard/board/' + boardId + '/members/' + memberId)
            .pipe(
                map((response) => new Board(response)),
                tap((board) => this._board.next(board))
            );
    }

    addLabel(boardId: string, label: Label): Observable<Label> {
        return this._httpClient
            .post<Label>('api/scrumboard/board/' + boardId + '/labels', label)
            .pipe(
                tap((label) => {
                    // Get the board value
                    const board = this._board.value;

                    // Update the board labels with the new label
                    board.labels = [ ...board.labels, label ];

                    // Update the board
                    this._board.next(board);
                })
            );
    }

    removeLabel(boardId: string, labelId: string): Observable<boolean> {
        return this._httpClient
            .delete<boolean>('api/scrumboard/board/' + boardId + '/labels/' + labelId)
            .pipe(
                tap((isDeleted) => {
                    // Get the board value
                    const board = this._board.value;

                    // Find the index of the deleted label
                    const index = board.labels.findIndex(
                        (item) => item.id === labelId
                    );

                    // Delete the label
                    board.labels.splice(index, 1);

                    // Update the board
                    this._board.next(board);
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
