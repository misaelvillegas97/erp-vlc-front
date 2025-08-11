export class CreateFieldCategoryDto {
    flowVersionId: string;              // ID de la versión de flujo (requerido)
    name: string;                       // Nombre de la categoría (requerido)
    order?: number;                     // Orden en el formulario (opcional, mín: 0)
    description?: string;               // Descripción de la categoría (opcional)
    isActive?: boolean;                 // Si está activa (opcional, default: true)
    configJson?: Record<string, any>;   // Configuración JSON (opcional)
}
