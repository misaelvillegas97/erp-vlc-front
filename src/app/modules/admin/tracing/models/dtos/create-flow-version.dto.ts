export class CreateFlowVersionDto {
    templateId: string;                 // ID de la plantilla de flujo (requerido)
    fromVersion?: number;               // Versión base para clonar (opcional)
    note?: string;                      // Nota sobre la nueva versión (opcional)
}
