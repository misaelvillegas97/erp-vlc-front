import { Color } from '@shared/components/badge/domain/model/badge.type';

export enum InvoiceStatusEnum {
    ISSUED = 'ISSUED',
    RECEIVED_WITHOUT_OBSERVATIONS = 'RECEIVED_WITHOUT_OBSERVATIONS',
    RECEIVED_WITH_OBSERVATIONS = 'RECEIVED_WITH_OBSERVATIONS',
    REJECTED = 'REJECTED',
    RE_INVOICED = 'RE_INVOICED',
}

export const InvoiceStatusConfig: Record<InvoiceStatusEnum, Record<string, Color>> = {
    [InvoiceStatusEnum.ISSUED]                       : {color: 'blue'},
    [InvoiceStatusEnum.RECEIVED_WITHOUT_OBSERVATIONS]: {color: 'green'},
    [InvoiceStatusEnum.RECEIVED_WITH_OBSERVATIONS]   : {color: 'yellow'},
    [InvoiceStatusEnum.REJECTED]                     : {color: 'red'},
    [InvoiceStatusEnum.RE_INVOICED]                  : {color: 'gray'},
};
