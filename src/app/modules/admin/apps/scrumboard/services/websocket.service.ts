import { Injectable }  from '@angular/core';
import { Board, Card } from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { BoardSocket } from '@modules/admin/apps/scrumboard/services/board.socket';

@Injectable({providedIn: 'root'})
export class WebsocketService {
    boardJoined = this.socket.fromEvent<string>('joinedBoard');
    // boardUpdated = this.socket.fromEvent<Board>('boardUpdated');
    cardUpdated = this.socket.fromEvent<Card>('cardUpdated');

    constructor(private socket: BoardSocket) {}

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
