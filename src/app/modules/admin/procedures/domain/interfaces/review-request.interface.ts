import { BaseEntity }       from './base.interface';
import { ProcedureVersion } from './procedure-version.interface';
import { ReviewStatus }     from '../enums';

export interface ReviewRequest extends BaseEntity {
    versionId: string;
    version?: ProcedureVersion;
    requestedToUserId: string; // can be Comité Paritario role
    status: ReviewStatus;
    comment?: string;
    resolvedAt?: Date;
}
