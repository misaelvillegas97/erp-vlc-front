import { ResponseType } from '../enums/response-type.enum';

export interface ChecklistQuestion {
    id?: string;
    title: string;
    description?: string;
    weight: number;
    required: boolean;
    responseType: ResponseType;
    options?: string[]; // For multiple choice questions
    numericRange?: {
        min: number;
        max: number;
    };
    order: number;
    categoryId?: string;
}

export interface ChecklistQuestionResponse {
    questionId: string;
    value: any;
    normalizedScore?: number; // 0-1 based on response and question type
    timestamp: Date;
    files?: File[];
}
