import { ChecklistType } from '../enums/checklist-type.enum';
import { TargetType }    from '../enums/target-type.enum';
import { RoleEnum }      from '@core/user/role.type';

export class CreateQuestionDto {
    title: string;
    description?: string;
    weight: number;
    required: boolean;
    hasIntermediateApproval: boolean;
    intermediateValue: number;
    extraFields?: Record<string, any>;
    sortOrder?: number;
    isActive?: boolean;
}

export class CreateCategoryDto {
    title: string;
    description?: string;
    sortOrder?: number;
    questions?: CreateQuestionDto[];
}

export class CreateChecklistTemplateDto {
    type: ChecklistType;
    name: string;
    description?: string;
    version?: string;
    targetTypes?: TargetType[];
    userRoles?: RoleEnum[];
    isActive?: boolean;
    performanceThreshold?: number;
    categories?: CreateCategoryDto[];
}

export interface UpdateChecklistTemplateDto extends Partial<CreateChecklistTemplateDto> {
    id: string;
}
