import { BaseEntity } from './base.interface';

export interface Procedure extends BaseEntity {
    code: string;           // PROC-###
    title: string;
    category?: string;      // e.g., "Reglamento Interno", "SSO"
    tags: string[];
    ownerUserId: string;
    active: boolean;
}
