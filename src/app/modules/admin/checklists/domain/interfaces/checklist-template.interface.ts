import { ChecklistType }     from '../enums/checklist-type.enum';
import { ChecklistCategory } from './checklist-category.interface';

export interface ChecklistTemplate {
    id?: string;
    name: string;
    type: ChecklistType;
    version: string;
    description?: string;
    weight: number; // Weight within a group (0-1)
    categories: ChecklistCategory[];
    vehicleIds: string[];
    roleIds: string[];
    groupId?: string;
    isActive: boolean;
    scoreThreshold?: number; // Minimum score to pass (0-1)
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
}

export interface ChecklistTemplateMetadata {
    id: string;
    name: string;
    type: ChecklistType;
    version: string;
    totalQuestions: number;
    totalCategories: number;
    estimatedDuration?: number; // in minutes
    vehicleCount: number;
    roleCount: number;
    isActive: boolean;
    lastUsed?: Date;
}

export interface ChecklistTemplateScore {
    templateId: string;
    name: string;
    weight: number;
    score: number; // 0-1
    passed: boolean;
    categoryScores: Array<{
        categoryId: string;
        title: string;
        score: number;
        weight: number;
    }>;
}
