import { RequiredMetadata } from '@modules/admin/maintainers/feature-toggles/domain/model/required-metadata';

export interface FeatureToggleEntity {
    id?: string;
    name: string;
    displayName: string;
    description?: string;
    enabled: boolean;
    category?: string;
    metadata?: Record<string, any>;
    requiredMetadata: RequiredMetadata[];
    parentId?: string;
    parent?: FeatureToggleEntity;
    children?: FeatureToggleEntity[];
    createdAt?: string;
    updatedAt?: string;
}

// Optional mapper class to help with transformations if needed
export class FeatureToggleMapper {
    static toEntity(data: any): FeatureToggleEntity {
        return {
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
            updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : undefined
        };
    }
}
