// Base interfaces and types for procedures module

import { FileDto } from '@modules/admin/maintainers/users/models/file-dto.model';

export type ProcedurePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LegalReference {
    norma: string;
    articulo?: string;
    nota?: string;
}

export interface ProcedureSection {
    title: string;
    body: string;
    attachments: string[];
}

export interface ProcedureFile {
    id: string;
    path: string;
}

export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
