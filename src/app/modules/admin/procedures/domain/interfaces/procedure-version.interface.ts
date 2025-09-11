import { BaseEntity, LegalReference } from './base.interface';
import { Procedure }                  from './procedure.interface';
import { ProcedureVersionStatus }     from '../enums';
import { FileDto }                    from '@modules/admin/maintainers/users/models/file-dto.model';

export interface ProcedureVersion extends BaseEntity {
    procedureId: string;
    procedure?: Procedure;
    number: number;
    content?: FileDto;
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
