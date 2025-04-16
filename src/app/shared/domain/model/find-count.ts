export interface FindCount<T> {
    items: T[];
    total: number;
}

export class FindCount<T> {
    constructor(items: T[], total: number) {
        this.items = items;
        this.total = total;
    }

    items: T[];
    total: number;
}
