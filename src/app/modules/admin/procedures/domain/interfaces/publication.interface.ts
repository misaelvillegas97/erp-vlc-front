import { BaseEntity }            from './base.interface';
import { ProcedureVersion }      from './procedure-version.interface';
import { AudienceType, Channel } from '../enums';

export interface Publication extends BaseEntity {
    versionId: string;
    version?: ProcedureVersion;
    audienceType: AudienceType;
    audienceIds: string[]; // roles|groups|users
    channels: Channel[];
    pdfUrl?: string;
    message?: string;
    validFrom?: Date;      // start date
    validUntil?: Date;     // expiry date
    preNoticeStart?: Date; // 30 days before if CT art.156 applies
    postedOnVisibleSites: boolean;    // evidence uploaded
    deliveredToUnionsAndCP: boolean;  // evidence uploaded
}
