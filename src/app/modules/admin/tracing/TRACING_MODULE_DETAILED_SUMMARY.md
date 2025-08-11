# Resumen Detallado del Módulo de Tracing

## Descripción General

El módulo de tracing es un sistema completo para la gestión de flujos de trabajo (workflows) con capacidades de ejecución, seguimiento, sincronización offline y reportes. Está diseñado con arquitectura modular siguiendo principios SOLID y patrones de diseño limpio.

## Enums Completos

### 1. FieldType

**Archivo**: `src/modules/tracing/domain/enums/field-type.enum.ts`
**Descripción**: Tipos de campos dinámicos en formularios

```typescript
export enum FieldType {
    TEXT = 'TEXT',           // Single line text input
    NUMBER = 'NUMBER',       // Numeric input with validation
    DATE = 'DATE',           // Date picker input
    BOOLEAN = 'BOOLEAN',     // Checkbox or toggle
    SELECT = 'SELECT',       // Single selection dropdown
    MULTI_SELECT = 'MULTI_SELECT', // Multiple selection dropdown
    USER = 'USER',           // Single user selector
    MULTI_USER = 'MULTI_USER', // Multiple user selector
    FILE = 'FILE',           // File upload field
    TEXTAREA = 'TEXTAREA',   // Multi-line text input
}
```

### 2. StepExecutionStatus

**Archivo**: `src/modules/tracing/domain/enums/execution-status.enum.ts`
**Descripción**: Estados de ejecución de pasos

```typescript
export enum StepExecutionStatus {
    PENDING = 'PENDING',         // Step is waiting to be started
    IN_PROGRESS = 'IN_PROGRESS', // Step is currently being executed
    DONE = 'DONE',               // Step has been completed successfully
    SKIPPED = 'SKIPPED',         // Step was skipped due to conditions
    FAILED = 'FAILED',           // Step execution failed
    RESTARTED = 'RESTARTED',     // Step was restarted after failure
}
```

### 3. FlowInstanceStatus

**Archivo**: `src/modules/tracing/domain/enums/execution-status.enum.ts`
**Descripción**: Estados de instancias de flujo

```typescript
export enum FlowInstanceStatus {
    ACTIVE = 'ACTIVE',       // Flow instance is currently being executed
    CANCELLED = 'CANCELLED', // Flow instance was cancelled before completion
    FINISHED = 'FINISHED',   // Flow instance completed successfully
}
```

### 4. FlowVersionStatus

**Archivo**: `src/modules/tracing/domain/enums/flow-version-status.enum.ts`
**Descripción**: Estados de versiones de flujo

```typescript
export enum FlowVersionStatus {
    DRAFT = 'DRAFT',         // Version is being edited and can be modified
    PUBLISHED = 'PUBLISHED', // Version is published and immutable, can be used for execution
    ARCHIVED = 'ARCHIVED',   // Version is archived and cannot be used for new executions
}
```

### 5. StepType

**Archivo**: `src/modules/tracing/domain/enums/step-type.enum.ts`
**Descripción**: Tipos de pasos de flujo

```typescript
export enum StepType {
    STANDARD = 'STANDARD', // Regular step with form fields and execution
    GATE = 'GATE',         // Decision point that can route to different paths
    END = 'END',           // Final step that terminates the flow
}
```

### 6. SyncOperation

**Archivo**: `src/modules/tracing/domain/enums/sync-operation.enum.ts`
**Descripción**: Operaciones de sincronización offline

```typescript
export enum SyncOperation {
    CREATE = 'C', // Entity was created locally and needs to be synced to server
    UPDATE = 'U', // Entity was updated locally and needs to be synced to server
    DELETE = 'D', // Entity was deleted locally and needs to be synced to server
}
```

## DTOs Detallados

### DTOs de Creación

#### 1. CreateFieldCategoryDto

**Archivo**: `src/modules/tracing/domain/dto/create-field-category.dto.ts`
**Propósito**: Crear nueva categoría de campos

```typescript
export class CreateFieldCategoryDto {
    flowVersionId: string;    // ID de la versión de flujo (requerido)
    name: string;             // Nombre de la categoría (requerido)
    order?: number;           // Orden en el formulario (opcional, mín: 0)
    description?: string;     // Descripción de la categoría (opcional)
    isActive?: boolean;       // Si está activa (opcional, default: true)
    configJson?: Record<string, any>; // Configuración JSON (opcional)
}
```

**Validaciones**:

- `flowVersionId`: string, no vacío
- `name`: string, no vacío
- `order`: entero, mínimo 0
- `isActive`: booleano
- `configJson`: objeto

#### 2. CreateFieldDefDto

**Archivo**: `src/modules/tracing/domain/dto/create-field-def.dto.ts`
**Propósito**: Crear nueva definición de campo

```typescript
export class CreateFieldDefDto {
    stepId: string;                    // ID del paso (requerido)
    categoryId?: string;               // ID de la categoría (opcional)
    key: string;                       // Clave única del campo (requerido)
    label: string;                     // Etiqueta de visualización (requerido)
    type: FieldType;                   // Tipo de campo (requerido)
    required?: boolean;                // Si es requerido (opcional, default: false)
    configJson?: Record<string, any>;  // Configuración JSON (opcional)
    order?: number;                    // Orden dentro del paso/categoría (opcional, mín: 0)
    description?: string;              // Descripción/texto de ayuda (opcional)
    placeholder?: string;              // Texto placeholder (opcional)
    validationRules?: Record<string, any>; // Reglas de validación (opcional)
    isActive?: boolean;                // Si está activo (opcional, default: true)
}
```

**Validaciones**:

- `stepId`: string, no vacío
- `key`: string, no vacío
- `label`: string, no vacío
- `type`: enum FieldType
- `required`: booleano
- `order`: entero, mínimo 0
- `isActive`: booleano

**Ejemplo de configJson**:

```json
{
    "minLength": 3,
    "maxLength": 50,
    "pattern": "^[A-Z0-9-]+$",
    "options": [
        "Option 1",
        "Option 2"
    ]
}
```

### DTOs de Ejecución

#### 3. CompleteStepDto

**Archivo**: `src/modules/tracing/domain/dto/execution/complete-step.dto.ts`
**Propósito**: Completar ejecución de paso con datos

```typescript
export class CompleteStepDto {
    actorId: string;                    // ID del usuario completando (requerido)
    fieldValues?: FieldValueDto[];      // Valores de campos (opcional)
    wastes?: WasteRecordDto[];          // Registros de desperdicio (opcional)
    links?: OrderLinkDto[];             // Enlaces de orden (opcional)
    completionNotes?: string;           // Notas de completado (opcional)
    executionData?: Record<string, any>; // Datos adicionales de ejecución (opcional)
    forceComplete?: boolean;            // Forzar completado (opcional, default: false)
}
```

#### 3.1. FieldValueDto (Nested)

```typescript
export class FieldValueDto {
    fieldKey: string;                   // Clave del campo (requerido)
    value: any;                         // Valor del campo (requerido)
    rawValue?: string;                  // Valor string crudo (opcional)
    metadata?: Record<string, any>;     // Metadatos adicionales (opcional)
}
```

**Ejemplo de metadata**:

```json
{
    "source": "barcode_scan",
    "confidence": 0.95
}
```

#### 3.2. WasteRecordDto (Nested)

```typescript
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
```

**Ejemplo de metadata**:

```json
{
    "inspector": "user-789",
    "severity": "high"
}
```

#### 3.3. OrderLinkDto (Nested)

```typescript
export class OrderLinkDto {
    orderId?: string;                   // ID de orden existente (opcional)
    mode: 'LINKED' | 'CREATED';        // Modo de asociación (requerido)
    linkMetadata?: Record<string, any>; // Metadatos del enlace (opcional)
    notes?: string;                     // Notas adicionales (opcional)
}
```

**Ejemplo de linkMetadata**:

```json
{
    "orderType": "RESTOCK",
    "priority": "high",
    "requestedBy": "user-123"
}
```

## Controladores y Endpoints Detallados

### 1. FieldController (`/tracing/fields`) - 10 endpoints

#### Categorías de Campos

**POST /tracing/fields/categories**

- **Propósito**: Crear nueva categoría de campos
- **Body**: `CreateFieldCategoryDto`
- **Response**: `FieldCategoryResponseDto`
- **Restricciones**: Solo versiones DRAFT

**GET /tracing/fields/categories/version/:versionId**

- **Propósito**: Obtener todas las categorías de una versión de flujo
- **Parámetros**: `versionId` (string)
- **Response**: `FieldCategoryResponseDto[]`

**GET /tracing/fields/categories/:id**

- **Propósito**: Obtener categoría específica por ID
- **Parámetros**: `id` (string)
- **Response**: `FieldCategoryResponseDto`

**PUT /tracing/fields/categories/:id**

- **Propósito**: Actualizar categoría existente
- **Parámetros**: `id` (string)
- **Body**: `UpdateFieldCategoryDto`
- **Response**: `FieldCategoryResponseDto`
- **Restricciones**: Solo versiones DRAFT

**DELETE /tracing/fields/categories/:id**

- **Propósito**: Eliminar categoría
- **Parámetros**: `id` (string)
- **Response**: 204 No Content
- **Restricciones**: Solo versiones DRAFT

#### Definiciones de Campos

**POST /tracing/fields/definitions**

- **Propósito**: Crear nueva definición de campo
- **Body**: `CreateFieldDefDto`
- **Response**: `FieldDefResponseDto`
- **Restricciones**: Solo versiones DRAFT

**GET /tracing/fields/definitions/step/:stepId**

- **Propósito**: Obtener todas las definiciones de campo de un paso
- **Parámetros**: `stepId` (string)
- **Response**: `FieldDefResponseDto[]`

**GET /tracing/fields/definitions/:id**

- **Propósito**: Obtener definición específica por ID
- **Parámetros**: `id` (string)
- **Response**: `FieldDefResponseDto`

**PUT /tracing/fields/definitions/:id**

- **Propósito**: Actualizar definición existente
- **Parámetros**: `id` (string)
- **Body**: `UpdateFieldDefDto`
- **Response**: `FieldDefResponseDto`
- **Restricciones**: Solo versiones DRAFT

**DELETE /tracing/fields/definitions/:id**

- **Propósito**: Eliminar definición
- **Parámetros**: `id` (string)
- **Response**: 204 No Content
- **Restricciones**: Solo versiones DRAFT

### 2. FlowExecutionController (`/tracing/execution`) - 7 endpoints

**POST /tracing/execution/instances**

- **Propósito**: Iniciar nueva instancia de flujo
- **Body**: `CreateFlowInstanceDto`
- **Response**: `FlowInstanceResponseDto`
- **Restricciones**: Solo versiones PUBLISHED

**GET /tracing/execution/instances**

- **Propósito**: Obtener instancias con filtros opcionales
- **Query Parameters**:
    - `templateId?: string` - Filtrar por ID de plantilla
    - `status?: 'ACTIVE' | 'CANCELLED' | 'FINISHED'` - Filtrar por estado
    - `startedBy?: string` - Filtrar por usuario que inició
    - `page?: number` - Número de página (default: 1)
    - `limit?: number` - Elementos por página (default: 20)
- **Response**:

```typescript
interface FlowInstancesResponse {
    instances: FlowInstanceResponseDto[];
    total: number;
    page: number;
    limit: number;
}
```

**GET /tracing/execution/instances/:id**

- **Propósito**: Obtener instancia específica con información detallada
- **Parámetros**: `id` (string)
- **Response**: `FlowInstanceResponseDto`

**PUT /tracing/execution/instances/:id/cancel**

- **Propósito**: Cancelar instancia activa
- **Parámetros**: `id` (string)
- **Body**:

```typescript
interface CancelInstanceRequest {
    cancelledBy: string;
    reason: string;
}
```

- **Response**: `FlowInstanceResponseDto`

**GET /tracing/execution/instances/:id/progress**

- **Propósito**: Obtener información detallada de progreso
- **Parámetros**: `id` (string)
- **Response**:

```typescript
interface ProgressResponse {
    instanceId: string;
    overallProgress: number;
    currentStep: any;
    completedSteps: any[];
    pendingSteps: any[];
    estimatedCompletion?: string;
}
```

**PUT /tracing/execution/instances/:id/resume**

- **Propósito**: Reanudar instancia pausada o interrumpida
- **Parámetros**: `id` (string)
- **Body**:

```typescript
interface ResumeInstanceRequest {
    resumedBy: string;
    notes?: string;
}
```

- **Response**: `FlowInstanceResponseDto`

**GET /tracing/execution/instances/:id/history**

- **Propósito**: Obtener historial completo de ejecución
- **Parámetros**: `id` (string)
- **Response**:

```typescript
{
    instanceId: string;
    events: any[ ];
    timeline: any[ ];
    statistics: any;
}
```

### 3. StepExecutionController (`/tracing/execution/steps`) - 8 endpoints

**POST /tracing/execution/steps/:instanceId/:stepId/start**

- **Propósito**: Iniciar ejecución de un paso específico
- **Parámetros**: `instanceId` (string), `stepId` (string)
- **Body**:

```typescript
{
    actorId: string;
    notes ? : string;
}
```

- **Response**: `StepExecutionResponseDto`

**POST /tracing/execution/steps/:instanceId/:stepId/complete**

- **Propósito**: Completar ejecución de paso con datos completos
- **Parámetros**: `instanceId` (string), `stepId` (string)
- **Body**: `CompleteStepDto`
- **Response**: `StepExecutionResponseDto`

**GET /tracing/execution/steps/:executionId**

- **Propósito**: Obtener información detallada de ejecución de paso
- **Parámetros**: `executionId` (string)
- **Response**: `StepExecutionResponseDto`

**GET /tracing/execution/steps/instance/:instanceId**

- **Propósito**: Obtener todas las ejecuciones de paso de una instancia
- **Parámetros**: `instanceId` (string)
- **Query Parameters**:
    - `status?: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED'` - Filtrar por estado
    - `actorId?: string` - Filtrar por actor que ejecutó
- **Response**: `StepExecutionResponseDto[]`

**PUT /tracing/execution/steps/:instanceId/:stepId/skip**

- **Propósito**: Saltar ejecución de paso con razón
- **Parámetros**: `instanceId` (string), `stepId` (string)
- **Body**:

```typescript
{
    actorId: string;
    reason: string;
    notes ? : string;
}
```

- **Response**: `StepExecutionResponseDto`

**PUT /tracing/execution/steps/:instanceId/:stepId/restart**

- **Propósito**: Reiniciar paso completado o fallido
- **Parámetros**: `instanceId` (string), `stepId` (string)
- **Body**:

```typescript
{
    actorId: string;
    reason: string;
    notes ? : string;
}
```

- **Response**: `StepExecutionResponseDto`

**GET /tracing/execution/steps/:instanceId/:stepId/form**

- **Propósito**: Obtener estructura de formulario y valores actuales
- **Parámetros**: `instanceId` (string), `stepId` (string)
- **Response**:

```typescript
{
    stepId: string;
    stepName: string;
    categories: any[ ];
    fields: any[ ];
    currentValues: Record<string, any>;
    validationRules: Record<string, any>;
}
```

**POST /tracing/execution/steps/:instanceId/:stepId/validate**

- **Propósito**: Validar datos antes de completar paso
- **Parámetros**: `instanceId` (string), `stepId` (string)
- **Body**: `CompleteStepDto`
- **Response**:

```typescript
{
    valid: boolean;
    errors: string[ ];
    warnings: string[ ];
    fieldValidation: Record<string, any>;
}
```

### 4. SyncController (`/tracing/sync`) - 9 endpoints

**POST /tracing/sync/pull**

- **Propósito**: Obtener cambios del servidor para cliente offline
- **Body**: `SyncPullRequestDto`
- **Response**: `SyncPullResponseDto`

**POST /tracing/sync/push**

- **Propósito**: Enviar cambios locales al servidor con detección de conflictos
- **Body**: `SyncPushRequestDto`
- **Response**: `SyncPushResponseDto`

**GET /tracing/sync/status/:deviceId**

- **Propósito**: Obtener estado de sincronización para dispositivo específico
- **Parámetros**: `deviceId` (string)
- **Response**:

```typescript
{
    lastSyncTimestamp: Date | null;
    pendingChanges: number;
    conflictsCount: number;
    syncHealth: 'healthy' | 'warning' | 'error';
}
```

**POST /tracing/sync/conflicts/resolve**

- **Propósito**: Resolver conflictos de sincronización manualmente
- **Body**:

```typescript
{
    deviceId: string;
    resolutions: Array<{
        entityName: string;
        entityId: string;
        resolution: 'client-wins' | 'server-wins' | 'merge';
        mergedData?: any;
    }>;
}
```

- **Response**:

```typescript
{
    resolved: number;
    failed: Array<{
        entityName: string;
        entityId: string;
        error: string;
    }>;
}
```

**GET /tracing/sync/health**

- **Propósito**: Vista general de salud de sincronización
- **Query Parameters**:
    - `hours?: number` - Ventana de tiempo en horas (default: 24)
- **Response**:

```typescript
{
    totalDevices: number;
    healthyDevices: number;
    warningDevices: number;
    errorDevices: number;
    totalPendingChanges: number;
    totalConflicts: number;
    avgSyncLatency: number;
    lastSyncActivity: Date | null;
}
```

**POST /tracing/sync/cleanup**

- **Propósito**: Limpiar datos de sincronización antiguos
- **Query Parameters**:
    - `olderThanDays?: number` - Eliminar entradas más antiguas que días especificados (default: 30)
- **Response**:

```typescript
{
    deletedCount: number;
    message: string;
}
```

**GET /tracing/sync/test/:deviceId**

- **Propósito**: Probar conectividad de sincronización
- **Parámetros**: `deviceId` (string)
- **Response**:

```typescript
{
    deviceId: string;
    connected: boolean;
    latency: number;
    lastSync: Date | null;
    pendingOperations: number;
    testTimestamp: Date;
}
```

**GET /tracing/sync/metrics**

- **Propósito**: Métricas detalladas de sincronización
- **Query Parameters**:
    - `period?: 'hour' | 'day' | 'week' | 'month'` - Período de agregación (default: 'day')
- **Response**:

```typescript
{
    period: string;
    totalSyncOperations: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflictsResolved: number;
    avgSyncTime: number;
    dataTransferred: number;
    activeDevices: number;
    topConflictReasons: Array<{
        reason: string;
        count: number;
    }>;
}
```

### 5. ReportsController (`/tracing/reports`) - 5 endpoints

**GET /tracing/reports/kpi**

- **Propósito**: Obtener métricas KPI para ejecuciones de flujo
- **Query Parameters**:
    - `range: string` - Rango de fechas (ej: '2024-01-01,2024-01-31') (requerido)
    - `templateId?: string` - Filtrar por ID de plantilla
    - `version?: string` - Filtrar por versión de plantilla
    - `groupBy?: 'day' | 'week' | 'month'` - Período de agrupación (default: 'day')
- **Response**: `KpiResponseDto`

**GET /tracing/reports/bottlenecks**

- **Propósito**: Análisis de cuellos de botella
- **Query Parameters**:
    - `topN?: number` - Número de principales cuellos de botella (default: 10)
    - `range?: string` - Rango de fechas para análisis
    - `templateId?: string` - Filtrar por ID de plantilla
- **Response**: Análisis de cuellos de botella

**GET /tracing/reports/export/csv**

- **Propósito**: Exportar datos KPI a CSV
- **Query Parameters**:
    - `range: string` - Rango de fechas (requerido)
    - `templateId?: string` - Filtrar por ID de plantilla
    - `version?: string` - Filtrar por versión
    - `groupBy?: 'day' | 'week' | 'month'` - Período de agrupación
- **Response**: Archivo CSV

**GET /tracing/reports/performance**

- **Propósito**: Métricas detalladas de rendimiento
- **Query Parameters**:
    - `range: string` - Rango de fechas (requerido)
    - `templateId?: string` - Filtrar por ID de plantilla
- **Response**: Métricas de rendimiento

**GET /tracing/reports/waste-analysis**

- **Propósito**: Análisis de patrones de desperdicio
- **Query Parameters**:
    - `range: string` - Rango de fechas (requerido)
    - `templateId?: string` - Filtrar por ID de plantilla
- **Response**: Análisis de desperdicios

## Servicios

### 1. FieldService

**Propósito**: Lógica de negocio para campos dinámicos y categorías
**Métodos principales**:

- `createFieldCategory(dto: CreateFieldCategoryDto)`
- `createFieldDef(dto: CreateFieldDefDto)`
- `findCategoriesByVersion(versionId: string)`
- `findFieldDefsByStep(stepId: string)`
- `updateFieldCategory(id: string, dto: UpdateFieldCategoryDto)`
- `updateFieldDef(id: string, dto: UpdateFieldDefDto)`
- `deleteFieldCategory(id: string)`
- `deleteFieldDef(id: string)`

### 2. FlowExecutionService

**Propósito**: Lógica de ejecución de instancias de flujo
**Métodos principales**:

- `startFlowInstance(dto: CreateFlowInstanceDto)`
- `findFlowInstances(filters, pagination)`
- `findFlowInstanceById(id: string)`
- `cancelFlowInstance(id: string, cancelledBy: string, reason: string)`
- `resumeFlowInstance(id: string, resumedBy: string, notes?: string)`
- `getFlowInstanceProgress(id: string)`
- `getFlowInstanceHistory(id: string)`

### 3. StepExecutionService

**Propósito**: Lógica de ejecución individual de pasos
**Métodos principales**:

- `startStepExecution(instanceId: string, stepId: string, actorId: string, notes?: string)`
- `completeStepExecution(instanceId: string, stepId: string, dto: CompleteStepDto)`
- `skipStepExecution(instanceId: string, stepId: string, actorId: string, reason: string, notes?: string)`
- `restartStepExecution(instanceId: string, stepId: string, actorId: string, reason: string, notes?: string)`
- `findStepExecutionById(executionId: string)`
- `findStepExecutionsByInstance(instanceId: string, filters)`
- `getStepFormData(instanceId: string, stepId: string)`
- `validateStepData(instanceId: string, stepId: string, data: CompleteStepDto)`

### 4. SyncService

**Propósito**: Lógica de sincronización offline
**Métodos principales**:

- `pullChanges(request: SyncPullRequestDto)`
- `pushChanges(request: SyncPushRequestDto)`
- `getSyncStatus(deviceId: string)`
- `resolveConflicts(deviceId: string, resolutions)`
- `cleanupOutbox(olderThanDays: number)`

### 5. WasteManagementService

**Propósito**: Lógica de gestión de desperdicios
**Métodos principales**:

- `createWasteRecord(dto: CreateWasteRecordDto)`
- `findWasteRecordsByInstance(instanceId: string, filters)`
- `getWasteSummaryByInstance(instanceId: string)`

## Características de Implementación Frontend

### 1. Autenticación

- Todos los endpoints requieren JWT Bearer token
- Header: `Authorization: Bearer <token>`

### 2. Validación de Datos

- Usar las validaciones definidas en los DTOs
- Implementar validación client-side basada en `validationRules`
- Manejar errores de validación del servidor (400 Bad Request)

### 3. Estados de UI

- Implementar estados basados en los enums definidos
- Manejar transiciones de estado según las reglas de negocio
- Mostrar indicadores de progreso para operaciones largas

### 4. Formularios Dinámicos

- Renderizar campos basados en `FieldType` enum
- Aplicar validaciones según `configJson` y `validationRules`
- Manejar campos anidados y categorías

### 5. Sincronización Offline

- Implementar cola local de cambios
- Manejar conflictos de sincronización
- Mostrar estado de conectividad y sincronización

### 6. Manejo de Errores

- 400: Bad Request (validación)
- 401: Unauthorized (token inválido)
- 403: Forbidden (permisos insuficientes)
- 404: Not Found (recurso no encontrado)
- 409: Conflict (conflicto de datos)
- 500: Internal Server Error

### 7. Paginación

- Usar parámetros `page` y `limit`
- Manejar respuestas con `total`, `page`, `limit`
- Implementar navegación de páginas

### 8. Filtros y Búsqueda

- Implementar filtros según query parameters disponibles
- Manejar múltiples filtros simultáneos
- Persistir filtros en estado de aplicación

## Ejemplos de Uso

### Crear Categoría de Campo

```typescript
const categoryDto: CreateFieldCategoryDto = {
    flowVersionId: "version-123",
    name: "Product Information",
    order: 1,
    description: "Fields related to product identification",
    isActive: true,
    configJson: {
        collapsible: true,
        expanded: false
    }
};

const response = await fetch('/tracing/fields/categories', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryDto)
});
```

### Completar Paso

```typescript
const completeDto: CompleteStepDto = {
    actorId: "user-123",
    fieldValues: [
        {
            fieldKey: "product_sku",
            value: "PROD-12345",
            metadata: {source: "barcode_scan"}
        }
    ],
    wastes: [
        {
            qty: 2.5,
            reason: "Product damaged",
            affectsInventory: true,
            costImpact: 15.75,
            sku: "PROD-12345"
        }
    ],
    completionNotes: "Quality check completed"
};

const response = await fetch('/tracing/execution/steps/instance-123/step-456/complete', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(completeDto)
});
```

### Obtener Progreso de Instancia

```typescript
const response = await fetch('/tracing/execution/instances/instance-123/progress', {
    headers: {
        'Authorization': 'Bearer <token>'
    }
});

const progress = await response.json();
// progress.overallProgress: number (0-100)
// progress.currentStep: objeto del paso actual
// progress.completedSteps: array de pasos completados
```

Este documento proporciona toda la información detallada necesaria para implementar el frontend del módulo de tracing, incluyendo estructuras completas de DTOs, valores de enums, endpoints con parámetros y respuestas, y ejemplos de uso.
