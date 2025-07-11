import { Injectable, signal, Signal } from '@angular/core';
import { Board, Card }                from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { BoardSocket }                from '@modules/admin/apps/scrumboard/services/board.socket';

@Injectable({providedIn: 'root'})
export class WebsocketService {
    private _boardJoined = signal<string | null>(null);
    private _cardUpdated = signal<Card | null>(null);

    // Expose signals as readonly
    readonly boardJoined: Signal<string | null> = this._boardJoined;
    readonly cardUpdated: Signal<Card | null> = this._cardUpdated;

    constructor(private socket: BoardSocket) {
        // Subscribe to socket events and update signals
        this.socket.fromEvent<string>('joinedBoard').subscribe(
            (boardId) => this._boardJoined.set(boardId)
        );

        this.socket.fromEvent<Card>('cardUpdated').subscribe(
            (card) => this._cardUpdated.set(card)
        );
    }

    connect() {
        this.socket.connect();
    }

    disconnect() {
        this.socket.disconnect();
    }

    joinBoard(boardId: string) {
        console.log('joinBoard', boardId);
        this.socket.emit('joinBoard', boardId);
    }

    leaveBoard(boardId: string) {
        this.socket.emit('leaveBoard', boardId);
    }

    createBoard(board: Board) {
        this.socket.emit('createBoard', board);
    }

    updateBoard(board: Board) {
        this.socket.emit('updateBoard', board);
    }

    updateCard(card: Card) {
        this.socket.emit('updateCard', card);
    }
}
