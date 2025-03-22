export interface BankTransaction {
    id: number;
    date: Date;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
}

export interface Transfer {
    id: number;
    date: Date;
    fromAccount: string;
    toAccount: string;
    amount: number;
    status: 'scheduled' | 'completed' | 'failed';
}
