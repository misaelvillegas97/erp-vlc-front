import { FieldType } from '../enums/field-type.enum';

export class CreateFieldDefDto {
    stepId: string;                       // ID del paso (requerido)
    categoryId?: string;                  // ID de la categoría (opcional)
    key: string;                          // Clave única del campo (requerido)
    label: string;                        // Etiqueta de visualización (requerido)
    type: FieldType;                      // Tipo de campo (requerido)
    required?: boolean;                   // Si es requerido (opcional, default: false)
    configJson?: Record<string, any>;     // Configuración JSON (opcional)
    order?: number;                       // Orden dentro del paso/categoría (opcional, mín: 0)
    description?: string;                 // Descripción/texto de ayuda (opcional)
    placeholder?: string;                 // Texto placeholder (opcional)
    validationRules?: Record<string, any>; // Reglas de validación (opcional)
    isActive?: boolean;                   // Si está activo (opcional, default: true)
}
