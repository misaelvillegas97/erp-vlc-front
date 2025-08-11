export interface FieldValue {
    id: string;
    stepExecutionId: string;
    fieldDefId: string;
    valueJson: any;
    valid: boolean;
    validationErrors?: string[];
    createdAt: Date;
    updatedAt: Date;
}
