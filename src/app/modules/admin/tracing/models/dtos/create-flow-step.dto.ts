import { StepType } from '../enums/step-type.enum';

export class CreateFlowStepDto {
    // Required fields
    flowVersionId: string;              // ID de la versión del flujo
    key: string;                        // Clave única del step dentro del flujo
    name: string;                       // Nombre para mostrar del step
    type: StepType;                     // Tipo de step (STANDARD, GATE, END)

    // Optional fields
    position?: {                        // Posición en el canvas
        x: number;
        y: number;
    };
    order?: number;                     // Orden en el flujo (mínimo 0)
    description?: string;               // Descripción del step
    configJson?: Record<string, any>;   // Configuración JSON personalizada
    isActive?: boolean;                 // Si el step está activo (default: true)
}
