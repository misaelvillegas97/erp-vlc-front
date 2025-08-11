# Resumen del Módulo de Tracing

## Descripción General

El módulo de tracing es un sistema completo para la gestión de flujos de trabajo (workflows) con capacidades de ejecución, seguimiento, sincronización offline y reportes. Está diseñado con arquitectura modular siguiendo principios SOLID y patrones de diseño limpio.

## Estructura del Módulo

### Controladores (9 controladores, 62 endpoints totales)

#### 1. FieldController (`/tracing/fields`) - 10 endpoints

**Propósito**: Gestión de campos dinámicos y categorías de campos para formularios de flujos.

**Endpoints**:

- `POST /tracing/fields/categories` - Crear nueva categoría de campos
- `GET /tracing/fields/categories/version/:versionId` - Obtener categorías por versión de flujo
- `GET /tracing/fields/categories/:id` - Obtener categoría específica por ID
- `PUT /tracing/fields/categories/:id` - Actualizar categoría (solo versiones DRAFT)
- `DELETE /tracing/fields/categories/:id` - Eliminar categoría (solo versiones DRAFT)
- `POST /tracing/fields/definitions` - Crear nueva definición de campo
- `GET /tracing/fields/definitions/step/:stepId` - Obtener definiciones de campo por paso
- `GET /tracing/fields/definitions/:id` - Obtener definición específica por ID
- `PUT /tracing/fields/definitions/:id` - Actualizar definición (solo versiones DRAFT)
- `DELETE /tracing/fields/definitions/:id` - Eliminar definición (solo versiones DRAFT)

#### 2. FlowExecutionController (`/tracing/execution`) - 7 endpoints

**Propósito**: Gestión del ciclo de vida de instancias de flujo (inicio, monitoreo, cancelación).

**Endpoints**:

- `POST /tracing/execution/instances` - Iniciar nueva instancia de flujo
- `GET /tracing/execution/instances` - Obtener instancias con filtros (templateId, status, startedBy, paginación)
- `GET /tracing/execution/instances/:id` - Obtener instancia específica por ID
- `PUT /tracing/execution/instances/:id/cancel` - Cancelar instancia activa
- `GET /tracing/execution/instances/:id/progress` - Obtener progreso detallado de instancia
- `PUT /tracing/execution/instances/:id/resume` - Reanudar instancia pausada
- `GET /tracing/execution/instances/:id/history` - Obtener historial completo de ejecución

#### 3. FlowStepController (`/tracing/steps`) - 6 endpoints

**Propósito**: Gestión CRUD de pasos dentro de versiones de flujo.

**Endpoints**:

- `POST /tracing/steps` - Crear nuevo paso de flujo
- `GET /tracing/steps/version/:versionId` - Obtener pasos por versión de flujo
- `GET /tracing/steps/:id` - Obtener paso específico por ID
- `PUT /tracing/steps/:id` - Actualizar paso (solo versiones DRAFT)
- `DELETE /tracing/steps/:id` - Eliminar paso (solo versiones DRAFT)
- `POST /tracing/steps/version/:versionId/reorder` - Reordenar pasos dentro de una versión

#### 4. FlowTemplateController (`/tracing/templates`) - 5 endpoints

**Propósito**: Gestión CRUD de plantillas de flujo.

**Endpoints**:

- `POST /tracing/templates` - Crear nueva plantilla de flujo
- `GET /tracing/templates` - Obtener plantillas con filtros (name, isActive)
- `GET /tracing/templates/:id` - Obtener plantilla específica por ID
- `PUT /tracing/templates/:id` - Actualizar plantilla existente
- `DELETE /tracing/templates/:id` - Eliminar plantilla (soft delete)

#### 5. FlowVersionController (`/tracing/versions`) - 7 endpoints

**Propósito**: Gestión de versionado, publicación y archivado de versiones de flujo.

**Endpoints**:

- `POST /tracing/versions` - Crear nueva versión (opcionalmente clonando)
- `GET /tracing/versions/template/:templateId` - Obtener versiones por plantilla
- `GET /tracing/versions/:id` - Obtener versión específica por ID
- `PUT /tracing/versions/:id` - Actualizar versión (solo DRAFT)
- `POST /tracing/versions/:id/publish` - Publicar versión DRAFT
- `POST /tracing/versions/:id/archive` - Archivar versión PUBLISHED
- `DELETE /tracing/versions/:id` - Eliminar versión (solo DRAFT)

#### 6. ReportsController (`/tracing/reports`) - 5 endpoints

**Propósito**: Generación de reportes, métricas KPI y análisis de rendimiento.

**Endpoints**:

- `GET /tracing/reports/kpi` - Obtener métricas KPI con filtros de rango, template, versión y agrupación
- `GET /tracing/reports/bottlenecks` - Análisis de cuellos de botella
- `GET /tracing/reports/export/csv` - Exportar datos KPI a CSV
- `GET /tracing/reports/performance` - Métricas detalladas de rendimiento
- `GET /tracing/reports/waste-analysis` - Análisis de patrones de desperdicio

#### 7. StepExecutionController (`/tracing/execution/steps`) - 8 endpoints

**Propósito**: Gestión individual de ejecución de pasos dentro de instancias de flujo.

**Endpoints**:

- `POST /tracing/execution/steps/:instanceId/:stepId/start` - Iniciar ejecución de paso
- `POST /tracing/execution/steps/:instanceId/:stepId/complete` - Completar paso con datos
- `GET /tracing/execution/steps/:executionId` - Obtener ejecución de paso por ID
- `GET /tracing/execution/steps/instance/:instanceId` - Obtener ejecuciones por instancia
- `PUT /tracing/execution/steps/:instanceId/:stepId/skip` - Saltar paso con razón
- `PUT /tracing/execution/steps/:instanceId/:stepId/restart` - Reiniciar paso completado/fallido
- `GET /tracing/execution/steps/:instanceId/:stepId/form` - Obtener estructura de formulario
- `POST /tracing/execution/steps/:instanceId/:stepId/validate` - Validar datos antes de completar

#### 8. SyncController (`/tracing/sync`) - 9 endpoints

**Propósito**: Sincronización offline con detección de conflictos y métricas de salud.

**Endpoints**:

- `POST /tracing/sync/pull` - Obtener cambios del servidor para cliente offline
- `POST /tracing/sync/push` - Enviar cambios locales al servidor con detección de conflictos
- `GET /tracing/sync/status/:deviceId` - Estado de sincronización por dispositivo
- `POST /tracing/sync/conflicts/resolve` - Resolver conflictos de sincronización manualmente
- `GET /tracing/sync/health` - Vista general de salud de sincronización
- `POST /tracing/sync/cleanup` - Limpiar datos de sincronización antiguos
- `GET /tracing/sync/test/:deviceId` - Probar conectividad de sincronización
- `GET /tracing/sync/metrics` - Métricas detalladas de sincronización

#### 9. TerminationRuleController (`/tracing/rules`) - 7 endpoints

**Propósito**: Gestión de reglas de terminación y automatizaciones de flujo.

**Endpoints**:

- `POST /tracing/rules` - Crear nueva regla de terminación
- `GET /tracing/rules/version/:versionId` - Obtener reglas por versión de flujo
- `GET /tracing/rules/:id` - Obtener regla específica por ID
- `PUT /tracing/rules/:id` - Actualizar regla (solo versiones DRAFT)
- `DELETE /tracing/rules/:id` - Eliminar regla (solo versiones DRAFT)
- `POST /tracing/rules/:id/test` - Probar condición de regla con datos de muestra
- `GET /tracing/rules/actions/types` - Obtener tipos de acciones disponibles

## DTOs (Data Transfer Objects) - 32 DTOs totales

### DTOs de Entrada (Create/Update)

- **CreateFieldCategoryDto** - Crear categorías de campos
- **CreateFieldDefDto** - Crear definiciones de campos
- **CreateFlowStepDto** - Crear pasos de flujo
- **CreateFlowTemplateDto** - Crear plantillas de flujo
- **CreateFlowVersionDto** - Crear versiones de flujo
- **CreateTerminationRuleDto** - Crear reglas de terminación
- **UpdateFieldCategoryDto** - Actualizar categorías de campos
- **UpdateFieldDefDto** - Actualizar definiciones de campos
- **UpdateFlowStepDto** - Actualizar pasos de flujo
- **UpdateTerminationRuleDto** - Actualizar reglas de terminación

### DTOs de Respuesta (Response)

- **FieldCategoryResponseDto** - Respuesta de categorías de campos
- **FieldDefResponseDto** - Respuesta de definiciones de campos
- **FlowStepResponseDto** - Respuesta de pasos de flujo
- **FlowTemplateResponseDto** - Respuesta de plantillas de flujo
- **FlowVersionResponseDto** - Respuesta de versiones de flujo
- **TerminationRuleResponseDto** - Respuesta de reglas de terminación

### DTOs de Ejecución

- **CompleteStepDto** - Completar paso con valores de campos, desperdicios y enlaces
- **CreateFlowInstanceDto** - Crear instancia de flujo
- **CreateWasteRecordDto** - Crear registro de desperdicio
- **FlowInstanceResponseDto** - Respuesta de instancia de flujo
- **StepExecutionResponseDto** - Respuesta de ejecución de paso
- **WasteRecordResponseDto** - Respuesta de registro de desperdicio
- **WasteSummaryDto** - Resumen de desperdicios

### DTOs de Reportes

- **KpiRequestDto** - Solicitud de métricas KPI
- **KpiResponseDto** - Respuesta de métricas KPI
- **ReportExportDto** - Exportación de reportes

### DTOs de Sincronización

- **SyncChangeDto** - Cambio de sincronización
- **SyncPullDto** - Solicitud/respuesta de pull
- **SyncPushDto** - Solicitud/respuesta de push

## Servicios (10 servicios)

- **FieldService** - Lógica de negocio para campos y categorías
- **FlowExecutionService** - Lógica de ejecución de flujos
- **FlowStepService** - Lógica de gestión de pasos
- **FlowTemplateService** - Lógica de plantillas
- **FlowVersionService** - Lógica de versionado
- **KpiService** - Lógica de métricas y reportes
- **StepExecutionService** - Lógica de ejecución de pasos
- **SyncService** - Lógica de sincronización offline
- **TerminationRuleService** - Lógica de reglas de terminación
- **WasteManagementService** - Lógica de gestión de desperdicios

## Entidades (13 entidades)

- **AuditLogEntity** - Registro de auditoría
- **FieldCategoryEntity** - Categorías de campos
- **FieldDefEntity** - Definiciones de campos
- **FieldValueEntity** - Valores de campos
- **FlowInstanceEntity** - Instancias de flujo
- **FlowStepEntity** - Pasos de flujo
- **FlowTemplateEntity** - Plantillas de flujo
- **FlowVersionEntity** - Versiones de flujo
- **OrderLinkEntity** - Enlaces de orden
- **StepExecutionEntity** - Ejecuciones de pasos
- **SyncOutboxEntity** - Cola de sincronización
- **TerminationRuleEntity** - Reglas de terminación
- **WasteRecordEntity** - Registros de desperdicio

## Enums (5 enums)

- **ExecutionStatusEnum** - Estados de ejecución
- **FieldTypeEnum** - Tipos de campos
- **FlowVersionStatusEnum** - Estados de versión de flujo
- **StepTypeEnum** - Tipos de pasos
- **SyncOperationEnum** - Operaciones de sincronización

## Características Principales

### 1. Gestión de Flujos de Trabajo

- Creación y gestión de plantillas de flujo reutilizables
- Sistema de versionado con estados DRAFT/PUBLISHED/ARCHIVED
- Definición de pasos secuenciales con campos dinámicos
- Reglas de terminación automática

### 2. Ejecución de Flujos

- Instanciación de flujos a partir de plantillas publicadas
- Seguimiento de progreso en tiempo real
- Gestión de estados (ACTIVE/CANCELLED/FINISHED)
- Capacidad de pausa y reanudación

### 3. Campos Dinámicos

- Sistema flexible de campos personalizables
- Categorización de campos para mejor organización
- Validación de datos integrada
- Soporte para múltiples tipos de campo

### 4. Sincronización Offline

- Capacidades offline-first con sincronización bidireccional
- Detección y resolución de conflictos
- Métricas de salud de sincronización
- Limpieza automática de datos antiguos

### 5. Reportes y Análisis

- Métricas KPI configurables
- Análisis de cuellos de botella
- Reportes de desperdicios y eficiencia
- Exportación a CSV

### 6. Gestión de Desperdicios

- Registro detallado de desperdicios por paso
- Análisis de patrones y tendencias
- Cálculo de impacto económico
- Categorización por razones

### 7. Auditoría y Trazabilidad

- Registro completo de todas las acciones
- Historial de cambios por entidad
- Trazabilidad de usuarios y timestamps
- Soporte para auditorías de cumplimiento

## Seguridad

- Autenticación JWT en todos los endpoints
- Guards de autorización implementados
- Validación de datos con class-validator
- Manejo centralizado de errores

## Arquitectura

- Patrón de capas (Controller → Service → Repository)
- Inyección de dependencias con NestJS
- TypeORM para persistencia de datos
- Swagger/OpenAPI para documentación automática
- Principios SOLID y Clean Architecture
