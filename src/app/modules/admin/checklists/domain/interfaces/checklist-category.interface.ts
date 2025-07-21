import { ChecklistQuestion, ChecklistQuestionResponse } from './checklist-question.interface';

export interface ChecklistCategory {
    id?: string;
    title: string;
    description?: string;
    // weight: number; // ❌ REMOVED - Categories no longer have weight
    sortOrder: number;
    questions: ChecklistQuestion[];
    templateId?: string;
}

export interface ChecklistCategoryResponse {
    categoryId: string;
    responses: ChecklistQuestionResponse[];
    categoryScore?: number; // Calculated score for this category (0-1)
    completedAt?: Date;
}

export interface ChecklistCategoryScore {
    categoryId: string;
    title: string;
    weight: number;
    score: number; // 0-1
    maxPossibleScore: number;
    questionsCompleted: number;
    totalQuestions: number;
}
