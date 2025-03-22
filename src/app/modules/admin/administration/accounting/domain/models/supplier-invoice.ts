export interface SupplierInvoice {
    id: number;
    number: string;
    date: Date;
    dueDate: Date;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    customer?: string; // Para facturas de CxC
    supplier?: string; // Para facturas de CxP
    details?: string;
}
