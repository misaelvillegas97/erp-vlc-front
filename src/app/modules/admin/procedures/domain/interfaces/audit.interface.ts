export interface Audit {
    id: string;
    entity: string;
    entityId: string;
    action: string;         // CREATE|UPDATE|APPROVE|PUBLISH|ACK|CONSENT
    userId: string;
    data?: Record<string, any>;
    createdAt: Date;
}
