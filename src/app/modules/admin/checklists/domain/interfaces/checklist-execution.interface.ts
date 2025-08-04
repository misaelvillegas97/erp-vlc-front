import { ChecklistCategoryResponse, ChecklistCategoryScore } from './checklist-category.interface';
import { ChecklistTemplateScore }                            from './checklist-template.interface';
import { ChecklistGroupScore }                               from './checklist-group.interface';

export enum ExecutionStatus {
    DRAFT = 'draft',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface ChecklistExecution {
    id?: string;
    templateId?: string;
    groupId?: string;
    vehicleId: string;
    userId: string;
    status: ExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    categoryResponses: ChecklistCategoryResponse[];
    templateScore?: ChecklistTemplateScore;
    groupScore?: ChecklistGroupScore;
    overallScore: number; // 0-1
    passed: boolean;
    notes?: string;
    attachments?: string[]; // File URLs
}

export interface ChecklistExecutionMetadata {
    id: string;
    templateName?: string;
    groupName?: string;
    vehiclePlate: string;
    userName: string;
    status: ExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    overallScore: number;
    passed: boolean;
    duration?: number; // in minutes
}

export interface ChecklistExecutionReport {
    execution: ChecklistExecution;
    templateDetails?: {
        name: string;
        type: string;
        version: string;
    };
    groupDetails?: {
        name: string;
        weight: number;
    };
    vehicleDetails: {
        plate: string;
        model?: string;
        year?: number;
    };
    userDetails: {
        name: string;
        role?: string;
    };
    categoryScores: ChecklistCategoryScore[];
    recommendations?: string[];
    exportFormats: {
        pdf?: string;
        csv?: string;
    };
}

export interface ChecklistExecutionSummary {
    totalExecutions: number;
    completedExecutions: number;
    averageScore: number;
    passRate: number;
    averageDuration: number;
    executionsByStatus: Record<ExecutionStatus, number>;
    executionsByTemplate: Array<{
        templateId: string;
        templateName: string;
        count: number;
        averageScore: number;
    }>;
}

// New interfaces to match the provided JSON model
export interface ChecklistAnswer {
    id: string;
    questionId: string;
    approvalStatus: string;
    approvalValue: number;
    evidenceFile: string | null;
    comment: string | null;
    answerScore: number;
    maxScore: number;
    isSkipped: boolean;
    answeredAt: string;
}

export interface ChecklistQuestionWithAnswer {
    id: string;
    title: string;
    description: string;
    weight: number;
    required: boolean;
    hasIntermediateApproval: boolean;
    intermediateValue: number;
    sortOrder: number;
    answer: ChecklistAnswer;
}

export interface ChecklistCategoryWithQuestions {
    id: string;
    title: string;
    description: string;
    sortOrder: number;
    categoryScore: number;
    questions: ChecklistQuestionWithAnswer[];
}

export interface NewChecklistExecutionReport {
    id: string;
    templateId: string;
    templateName: string;
    executorUserId: string;
    executorUserName: string;
    targetType: string;
    targetId: string;
    status: string;
    completedAt: string;
    totalScore: number;
    maxPossibleScore: number;
    percentageScore: number;
    notes: string;
    categories: ChecklistCategoryWithQuestions[];
}
