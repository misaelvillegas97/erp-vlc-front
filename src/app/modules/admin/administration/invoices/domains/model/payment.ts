import { PaymentMethodEnum } from '@modules/admin/administration/invoices/domains/enums/payment-method.enum';

export class Payment {
    id: string;
    paymentDate: string;
    amount: number;
    method: PaymentMethodEnum;
    reference: string;
    invoice: any;
}
