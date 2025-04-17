export interface BankAccount {
    id: number;
    bankName: string;
    accountNumber: string;
    accountType: 'checking' | 'savings' | 'investment';
    balance: number;
    description?: string;
}

export class BankAccountMapper {
    static toDto(data: any): BankAccount {
        return {
            id           : data.id,
            bankName     : data.bankName,
            accountNumber: data.accountNumber,
            accountType  : data.accountType,
            balance      : +data.balance,
            description  : data.description
        };
    }
}
