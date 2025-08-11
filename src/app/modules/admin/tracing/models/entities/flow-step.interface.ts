import { StepType } from '../enums/step-type.enum';

export interface FlowStep {
    id: string;
    flowVersionId: string;
    key: string;
    name: string;
    type: StepType;
    position: {
        x: number;
        y: number;
    };
    order: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
