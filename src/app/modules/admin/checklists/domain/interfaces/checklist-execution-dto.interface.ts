import { ApprovalStatus } from '../enums/approval-status.enum';
import { TargetType }     from '../enums/target-type.enum';

export interface ChecklistAnswerDto {
    questionId: string;
    approvalStatus: ApprovalStatus;
    approvalValue: number;
    evidenceFile?: string;
    comment?: string;
}

export interface CreateChecklistExecutionDto {
    templateId?: string;
    groupId?: string;
    executorUserId?: string;
    targetType: TargetType;
    targetId: string;
    executionTimestamp: string;
    answers: ChecklistAnswerDto[];
    notes?: string;
}
