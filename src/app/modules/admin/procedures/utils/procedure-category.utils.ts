import { ProcedureCategory } from '../domain/enums';

export interface ProcedureCategoryOption {
    value: ProcedureCategory;
    label: string;
}

export class ProcedureCategoryUtils {
    private static readonly categoryLabels: Record<ProcedureCategory, string> = {
        [ProcedureCategory.INTERNAL_REGULATION]: 'Reglamento Interno',
        [ProcedureCategory.HEALTH_SAFETY]      : 'Seguridad y Salud',
        [ProcedureCategory.OPERATIONAL]        : 'Operacional',
        [ProcedureCategory.QUALITY]            : 'Calidad'
    };

    /**
     * Get the Spanish label for a procedure category
     */
    static getCategoryLabel(category: ProcedureCategory): string {
        return this.categoryLabels[category] || category;
    }

    /**
     * Get all available procedure categories with their labels
     */
    static getAllCategories(): ProcedureCategoryOption[] {
        return Object.values(ProcedureCategory).map(category => ({
            value: category,
            label: this.getCategoryLabel(category)
        }));
    }

    /**
     * Get procedure category from string value (for backward compatibility)
     */
    static getCategoryFromString(categoryString: string): ProcedureCategory | null {
        const reverseMap: Record<string, ProcedureCategory> = {
            'Reglamento Interno': ProcedureCategory.INTERNAL_REGULATION,
            'SSO'               : ProcedureCategory.HEALTH_SAFETY,
            'Seguridad y Salud' : ProcedureCategory.HEALTH_SAFETY,
            'Operacional'       : ProcedureCategory.OPERATIONAL,
            'Calidad'           : ProcedureCategory.QUALITY
        };

        return reverseMap[categoryString] || null;
    }
}
