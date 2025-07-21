import { Color } from '@shared/components/badge/domain/model/badge.type';

export enum ChecklistType {
    INSPECTION = 'inspection',
    MAINTENANCE = 'maintenance',
    SAFETY = 'safety',
    QUALITY = 'quality',
    COMPLIANCE = 'compliance',
    OPERATIONAL = 'operational'
}

export const ChecklistTypeConfig: Record<ChecklistType, { label: string; color: Color }> = {
    [ChecklistType.INSPECTION] : {label: 'Inspection', color: 'blue'},
    [ChecklistType.MAINTENANCE]: {label: 'Maintenance', color: 'green'},
    [ChecklistType.SAFETY]     : {label: 'Safety', color: 'yellow'},
    [ChecklistType.QUALITY]    : {label: 'Quality', color: 'purple'},
    [ChecklistType.COMPLIANCE] : {label: 'Compliance', color: 'orange'},
    [ChecklistType.OPERATIONAL]: {label: 'Operational', color: 'gray'}
};
