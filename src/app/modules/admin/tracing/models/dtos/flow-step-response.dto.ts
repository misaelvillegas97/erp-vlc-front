import { StepType } from '../enums/step-type.enum';

export class FlowStepResponseDto {
    // Main fields
    id: string;                         // ID único del flow step
    flowVersionId: string;              // ID de la versión del flujo
    key: string;                        // Clave única del step
    name: string;                       // Nombre para mostrar
    type: StepType;                     // Tipo de step
    order: number;                      // Orden en el flujo
    isActive: boolean;                  // Si el step está activo
    createdAt: Date;                    // Timestamp de creación
    updatedAt: Date;                    // Timestamp de última actualización

    // Optional fields
    position?: {                        // Posición en el canvas
        x: number;
        y: number;
    };
    description?: string;               // Descripción del step
    configJson?: Record<string, any>;   // Configuración JSON
    fieldsCount?: number;               // Número de campos definidos
    canEdit?: boolean;                  // Si se puede editar (versión es DRAFT)
    executionsCount?: number;           // Número de ejecuciones del step
}
