import { FlowVersionStatus } from '../enums/flow-version-status.enum';

export interface FlowVersion {
    id: string;
    templateId: string;
    version: number;
    status: FlowVersionStatus;
    publishedAt?: Date;
    schemaHash: string;
    createdAt: Date;
    updatedAt: Date;
    note?: string;
}
