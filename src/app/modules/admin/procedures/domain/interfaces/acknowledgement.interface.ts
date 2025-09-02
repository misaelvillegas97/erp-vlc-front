import { BaseEntity }    from './base.interface';
import { Publication }   from './publication.interface';
import { SignatureType } from '../enums';

export interface Acknowledgement extends BaseEntity {
    publicationId: string;
    publication?: Publication;
    userId: string;
    acknowledgedAt: Date;
    signatureType: SignatureType;
    ip?: string;
    device?: Record<string, any>;
    isMandatory: boolean; // for legal procedures
}
