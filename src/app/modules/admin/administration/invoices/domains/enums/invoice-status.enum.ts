export enum InvoiceStatusEnum {
    ISSUED = 'ISSUED',
    RECEIVED_WITHOUT_OBSERVATIONS = 'RECEIVED_WITHOUT_OBSERVATIONS',
    RECEIVED_WITH_OBSERVATIONS = 'RECEIVED_WITH_OBSERVATIONS',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
}

export const InvoiceStatusConfig: Record<InvoiceStatusEnum, Record<string, any>> = {
    [InvoiceStatusEnum.ISSUED]                       : {color: 'yellow'},
    [InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS]: {color: 'blue'},
    [InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS]   : {color: 'yellow'},
    [InvoiceStatusEnum.REJECTED]                     : {color: 'red'},
    [InvoiceStatusEnum.PAID]                         : {color: 'green'},
};
