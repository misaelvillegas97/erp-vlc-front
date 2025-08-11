import { FieldType } from '../enums/field-type.enum';

export interface FieldDef {
    id: string;
    stepId: string;
    categoryId?: string;
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    configJson: Record<string, any>;
    order: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
