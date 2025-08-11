export class CreateFlowInstanceDto {
    templateId: string;                 // ID de la plantilla de flujo (requerido)
    version: number;                    // Versión de la plantilla (requerido)
    metadata?: Record<string, any>;     // Metadatos adicionales (opcional)
}
