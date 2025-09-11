import { BaseEntity, ProcedurePriority }                                     from './base.interface';
import { LegalReferenceCategory, ProcedureVersionStatus, ProcedureCategory } from '@modules/admin/procedures/domain/enums';
import { User }                                           from '@core/user/user.types';
import { ProcedureVersion }                               from '@modules/admin/procedures/domain/interfaces/procedure-version.interface';
import { FileDto }                                        from '@modules/admin/maintainers/users/models/file-dto.model';

export interface Procedure extends BaseEntity {
    code: string;           // PROC-###
    title: string;
    description: string;
    category?: ProcedureCategory;
    status: ProcedureVersionStatus;
    priority: ProcedurePriority;
    department: string;
    tags: string[];
    currentVersion: number;
    author: User;
    legalCategories: LegalReferenceCategory[];
    affectsInternalRegulation: boolean;
    requiresQuiz: boolean;
    versions?: ProcedureVersion[];
    active: boolean;

    latestVersionFile?: FileDto;
}
