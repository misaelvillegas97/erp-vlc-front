export interface FlowTemplate {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
