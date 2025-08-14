import { StepType } from '../enums/step-type.enum';

export class UpdateFlowStepDto {
    // All fields are optional for updates
    key?: string;                       // Clave única del step
    name?: string;                      // Nombre para mostrar
    type?: StepType;                    // Tipo de step
    position?: {                        // Posición en el canvas
        x: number;
        y: number;
    };
    order?: number;                     // Orden en el flujo (mínimo 0)
    description?: string;               // Descripción del step
    configJson?: Record<string, any>;   // Configuración JSON
    isActive?: boolean;                 // Si el step está activo
}
