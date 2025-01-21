export interface OrderProduct {
    id?: string;
    code: string;
    providerCode: string;
    upcCode: string;
    description: string;
    quantity: number;
    unitaryPrice: number;
    totalPrice: number;
}
