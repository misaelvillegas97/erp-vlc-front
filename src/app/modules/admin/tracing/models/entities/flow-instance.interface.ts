export interface FlowInstance {
    id: string;
    templateId: string;
    version: number;
    status: 'ACTIVE' | 'CANCELLED' | 'FINISHED';
    startedBy: string;
    startedAt: Date;
    finishedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
