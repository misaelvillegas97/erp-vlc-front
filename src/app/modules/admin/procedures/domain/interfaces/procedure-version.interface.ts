import { BaseEntity, LegalReference, ProcedureContent } from './base.interface';
import { Procedure }                                    from './procedure.interface';
import { ProcedureVersionStatus }                       from '../enums';

export interface ProcedureVersion extends BaseEntity {
    procedureId: string;
    procedure?: Procedure;
    number: number;
    content: ProcedureContent;
    changelog?: string;
    status: ProcedureVersionStatus;
    legalReferences: LegalReference[];
    createdBy: string;
    approvedBy?: string;
    approvedAt?: Date;
    publishedAt?: Date;
    diffFromPrevious?: any;
    modifiesInternalRegulations: boolean; // CT arts. 153/156
}
