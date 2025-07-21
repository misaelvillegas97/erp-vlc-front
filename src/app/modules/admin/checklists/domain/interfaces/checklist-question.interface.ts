export interface ChecklistQuestion {
    id?: string;
    title: string;
    description?: string;
    weight: number;
    required: boolean;

    // ✅ NEW: Sistema de aprobación configurable
    hasIntermediateApproval: boolean; // Si permite valor intermedio
    intermediateValue: number; // Valor del punto intermedio (0-1)

    extraFields?: Record<string, any>;
    sortOrder: number;
    isActive: boolean;
    categoryId?: string;
}

export interface ChecklistQuestionResponse {
    questionId: string;
    value: any;
    normalizedScore?: number; // 0-1 based on response and question type
    timestamp: Date;
    files?: File[];
}
