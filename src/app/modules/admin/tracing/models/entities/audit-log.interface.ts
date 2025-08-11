export interface AuditLog {
    id: string;
    entity: string;
    entityId: string;
    action: string;
    actorId: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}
