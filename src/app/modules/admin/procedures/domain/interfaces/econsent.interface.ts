import { BaseEntity } from './base.interface';

export interface EConsent extends BaseEntity {
    userId: string;
    consentAt: Date;        // consent for electronic documentation
    policyCode: string;     // e.g., 'policy:e-doc-v1'
    metadata?: Record<string, any>; // evidence: email, IP
}
