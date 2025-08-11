import { StepExecutionStatus } from '../enums/execution-status.enum';

export interface StepExecution {
    id: string;
    instanceId: string;
    stepId: string;
    status: StepExecutionStatus;
    startedAt?: Date;
    finishedAt?: Date;
    actorId?: string;
    skipReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
