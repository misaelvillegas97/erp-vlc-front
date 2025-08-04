export interface ChecklistGroupTemplateDto {
    templateId: string;
    weight: number;
}

export interface CreateChecklistGroupDto {
    name: string;
    description?: string;
    weight: number;
    isActive: boolean;
    templates: ChecklistGroupTemplateDto[];
}

export interface UpdateChecklistGroupDto extends Partial<CreateChecklistGroupDto> {
    id: string;
}
