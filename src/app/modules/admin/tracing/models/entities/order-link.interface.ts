export interface OrderLink {
    id: string;
    stepExecutionId: string;
    orderId: string;
    mode: 'LINKED' | 'CREATED';
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
