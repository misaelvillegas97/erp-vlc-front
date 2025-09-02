// Base interfaces and types for procedures module

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

export interface ProcedureContent {
    sections: ProcedureSection[];
    meta: Record<string, any>;
}

export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
