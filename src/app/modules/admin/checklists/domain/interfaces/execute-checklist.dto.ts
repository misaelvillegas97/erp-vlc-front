import { ChecklistQuestionResponse } from './checklist-question.interface';

export interface ExecuteChecklistDto {
    templateId?: string;
    groupId?: string;
    vehicleId: string;
    userId: string;
    categoryResponses: ExecuteChecklistCategoryDto[];
    notes?: string;
    startedAt: Date;
}

export interface ExecuteChecklistCategoryDto {
    categoryId: string;
    responses: ChecklistQuestionResponse[];
}

export interface ExecuteChecklistAnswers {
    [categoryId: string]: {
        [questionId: string]: {
            value: any;
            normalizedScore?: number;
            files?: File[];
            comment?: string;
        };
    };
}
