import { ChecklistTemplate, ChecklistTemplateScore } from './checklist-template.interface';

export interface ChecklistGroup {
    id?: string;
    name: string;
    description?: string;
    weight: number; // Overall weight of the group (0-1)
    templates: ChecklistTemplate[];
    isActive: boolean;
    performanceThreshold?: number; // Minimum group score to pass (0-100)
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
}

export interface ChecklistGroupMetadata {
    id: string;
    name: string;
    weight: number;
    templateCount: number;
    totalQuestions: number;
    isActive: boolean;
    lastUsed?: Date;
    averageScore?: number;
}

export interface ChecklistGroupScore {
    groupId: string;
    name: string;
    weight: number;
    score: number; // 0-1, calculated from template scores
    passed: boolean;
    templateScores: ChecklistTemplateScore[];
    completedTemplates: number;
    totalTemplates: number;
}

export interface ChecklistGroupValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    totalWeight: number; // Should equal 1.0 for templates within group
}
