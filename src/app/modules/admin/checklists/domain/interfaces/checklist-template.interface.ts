import { ChecklistType }     from '../enums/checklist-type.enum';
import { TargetType } from '../enums/target-type.enum';
import { ChecklistCategory } from './checklist-category.interface';

export interface ChecklistTemplate {
    id?: string;
    type: ChecklistType;
    name: string;
    description?: string;
    version?: string;
    vehicleTypes?: string[]; // Legacy field for backward compatibility
    targetTypes?: TargetType[]; // New field for target types
    userRoles?: string[];
    isActive?: boolean;
    performanceThreshold?: number;
    categories: ChecklistCategory[];
    // Additional fields for internal use
    weight?: number; // Weight within a group (0-1) - for group management
    groupId?: string;
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
