export class FieldValueDto {
    fieldKey: string;                   // Clave del campo (requerido)
    value: any;                         // Valor del campo (requerido)
    rawValue?: string;                  // Valor string crudo (opcional)
    metadata?: Record<string, any>;     // Metadatos adicionales (opcional)
}

export class WasteRecordDto {
    qty: number;                        // Cantidad de desperdicio (requerido, mín: 0)
    reason: string;                     // Razón del desperdicio (requerido)
    affectsInventory?: boolean;         // Si afecta inventario (opcional, default: false)
    evidenceUrl?: string;               // URL de evidencia (opcional)
    costImpact?: number;                // Impacto de costo (opcional, mín: 0)
    sku?: string;                       // SKU del producto (opcional)
    lot?: string;                       // Número de lote (opcional)
    notes?: string;                     // Notas adicionales (opcional)
    metadata?: Record<string, any>;     // Metadatos adicionales (opcional)
}

export class OrderLinkDto {
    orderId?: string;                   // ID de orden existente (opcional)
    mode: 'LINKED' | 'CREATED';        // Modo de asociación (requerido)
    linkMetadata?: Record<string, any>; // Metadatos del enlace (opcional)
    notes?: string;                     // Notas adicionales (opcional)
}

export class CompleteStepDto {
    actorId: string;                    // ID del usuario completando (requerido)
    fieldValues?: FieldValueDto[];      // Valores de campos (opcional)
    wastes?: WasteRecordDto[];          // Registros de desperdicio (opcional)
    links?: OrderLinkDto[];             // Enlaces de orden (opcional)
    completionNotes?: string;           // Notas de completado (opcional)
    executionData?: Record<string, any>; // Datos adicionales de ejecución (opcional)
    forceComplete?: boolean;            // Forzar completado (opcional, default: false)
}
