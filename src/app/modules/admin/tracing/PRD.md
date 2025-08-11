# PRD – Módulo de Trazabilidad (Backend & Frontend)

> Versión: 1.0 · Fecha: 07-08-2025 · Contexto: ERP NestJS + PostgreSQL + TypeORM (backend) y Angular 20 + Tailwind + Material 3 (frontend)

---

# 1) Executive Summary

Un módulo configurable de **trazabilidad de procesos** que permite modelar flujos versionados (builder tipo **canvas node‑based**) y ejecutar cada paso con **campos dinámicos** y **reglas de finalización**. Soporta **offline‑first** en el front, sincronización bidireccional, **mermas** con impacto en inventario/costos, asociación a **órdenes**, auditoría completa y reportes con KPIs.

**Objetivos clave**

* Modelar flujos con versionado + bloqueo de versiones publicadas
* Construir reglas de finalización y automatizaciones (correo, anulación, crear orden, webhooks, ajustes de inventario)
* Ejecutar formularios dinámicos por paso con evidencias y validación
* Funcionar offline (PWA) con sincronización incremental y resolución de conflictos
* Entregar KPIs diarios/semanales/mensuales (rendimiento, cuellos de botella, mermas)

**Fuera de alcance (v1)**

* Motor BPMN completo, SLA avanzados por paso, simulaciones de capacidad
* Integraciones masivas externas (solo webhook genérico + email SMTP)

---

# 2) Personas & Roles

* **Admin**: define y publica flujos, categorías y campos; configura reglas; ve reportes globales.
* **Operario**: ejecuta pasos, registra mermas, adjunta evidencias (fotos/archivos), opera offline.
* **Supervisor**: monitorea KPIs, cuellos de botella, exporta CSV/PDF y audita ejecuciones.

**RBAC**

* Permisos por rol y por flujo/versión (lectura/edición/ejecución/reportes).

---

# 3) Requisitos Funcionales (resumen)

## 3.1 Modelado de Flujos (Builder)

* Crear **Plantillas de Flujo** con **Versiones** inmutables una vez publicadas.
* Pasos con **campos dinámicos** (texto, número, fecha, booleano, select simple/múltiple, usuario, multi‑usuario, archivos, textarea) agrupados por **categorías**.
* **Acciones de Finalización** configurables por paso y por flujo (condicionales). Ejemplos:

    * `SEND_EMAIL(to[], subject, templateId, payload)`
    * `CANCEL_FLOW(reason)`
    * `CREATE_ORDER(type, payload)`
    * `INVENTORY_ADJUST(adjustmentType, sku, qty, lot)`
    * `CALL_WEBHOOK(url, method, headers, body)`
* Flujos pueden **finalizar en cualquier paso** si la regla lo dicta.

## 3.2 Ejecución

* Formularios dinámicos por paso con validación (requeridos, min/max, rango, regex).
* Registro de **mermas** (cantidad, motivo, adjuntos) con impacto opcional en inventario/costo.
* Asociación a **órdenes** (link o creación directa).
* **Offline‑first**: ejecución offline, cola local y sync.

## 3.3 Reportes & KPIs

* KPIs por período y por flujo: lotes procesados, tiempo por paso, pérdidas totales, eficiencia %, tasa de cumplimiento.
* Exportación a CSV y PDF.

## 3.4 Cumplimiento normativo

* Campos obligatorios configurables (ej. SAG), políticas de retención de datos y auditoría.

---

# 4) Arquitectura General

**Backend (Nest + TypeORM + PostgreSQL)**

* Enfoque **Hexagonal**: dominio (entidades/servicios), aplicación (casos de uso), infraestructura (repos, mailer, webhooks).
* **Event‑driven** interno para ejecutar acciones de finalización.
* Endpoints REST + endpoints de **sync** diferencial.
* Auditoría y trazas (OpenTelemetry), soft‑delete, versionado estricto.

**Frontend (Angular 20 + Tailwind + Material 3)**

* Standalone Components, Signals, Change Detection OnPush.
* **Node‑based canvas** para builder (opción Rete.js con renderer Angular o ngx‑graph/D3; fallback SVG propio con CDK DragDrop).
* PWA + IndexedDB (Dexie) para almacenamiento offline y **sync service** incremental.
* Formularios dinámicos con Reactive Forms + Zod/Validators; carga de evidencias chunked.

---

# 5) Modelo de Datos (Backend)

## 5.1 Entidades principales

* **FlowTemplate**(id, name, description, createdBy, createdAt)
* **FlowVersion**(id, templateId\*, version, status: DRAFT|PUBLISHED|ARCHIVED, publishedAt, schemaHash)
* **FlowStep**(id, flowVersionId\*, key, name, type: STANDARD|GATE|END, position{x,y}, order)
* **FieldCategory**(id, flowVersionId\*, name, order)
* **FieldDef**(id, stepId\*, categoryId?, key, label, type, required, configJson, order)
* **TerminationRule**(id, flowVersionId\*, scope: STEP|FLOW, when:{event:"onStepEnd|onFlowEnd", stepKey?}, conditionExpr, actionsJson\[])
* **FlowInstance**(id, templateId\*, version, status: ACTIVE|CANCELLED|FINISHED, startedBy, startedAt, finishedAt?)
* **StepExecution**(id, instanceId\*, stepId\*, status: PENDING|IN\_PROGRESS|DONE|SKIPPED, startedAt?, finishedAt?, actorId?)
* **FieldValue**(id, stepExecutionId\*, fieldDefId\*, valueJson, valid\:boolean)
* **WasteRecord**(id, stepExecutionId\*, qty, reason, affectsInventory\:boolean, evidenceUrl?, costImpact?)
* **OrderLink**(id, stepExecutionId\*, orderId, mode: LINKED|CREATED)
* **SyncOutbox**(id, entityName, entityId, op: C|U|D, payload, version, deviceId, createdAt)
* **AuditLog**(id, entity, entityId, action, actorId, before, after, ts)

## 5.2 Índices sugeridos

* (FlowVersion.templateId, FlowVersion.status)
* (FlowStep.flowVersionId, order)
* (StepExecution.instanceId, status)
* (WasteRecord.stepExecutionId)
* (SyncOutbox.createdAt), (AuditLog.ts)

---

# 6) API (Backend)

## 6.1 Builder

* `POST /tracing/templates`
* `GET /tracing/templates` (filtros: name, createdBy, hasPublished)
* `POST /tracing/templates/:id/versions` (clonar/crear)
* `GET /tracing/versions/:id` (incluye steps, fields, categories, rules)
* `PATCH /tracing/versions/:id` (solo DRAFT)
* `POST /tracing/versions/:id/publish`
* `POST /tracing/versions/:id/rules` (CRUD reglas)

## 6.2 Ejecución

* `POST /tracing/instances` ({templateId, version})
* `GET /tracing/instances/:id`
* `POST /tracing/instances/:id/steps/:stepId/start`
* `POST /tracing/instances/:id/steps/:stepId/complete` ({fieldValues\[], wastes\[], links\[]})
* `POST /tracing/instances/:id/cancel`

## 6.3 Sync

* `POST /tracing/sync/pull` ({since, deviceId}) → {changes\[], serverTs}
* `POST /tracing/sync/push` ({changes\[], deviceId, lastKnownServerTs}) → {applied\[], conflicts\[]}

## 6.4 Reportes

* `GET /tracing/reports/kpi` (range, templateId?, version?, groupBy: day|week|month)
* `GET /tracing/reports/bottlenecks` (topN)

---

# 7) Reglas y Automatizaciones

## 7.1 DSL mínima de condiciones

```json
{
    "when": {
        "event": "onStepEnd",
        "stepKey": "tratamiento"
    },
    "if": "waste.totalQty > 0 && fields.tratamiento_ok === true",
    "actions": [
        {
            "type": "SEND_EMAIL",
            "to": [
                "qa@empresa.cl"
            ],
            "subject": "Mermas detectadas",
            "templateId": "tpl-mermas",
            "payload": {
                "instanceId": "${instance.id}"
            }
        },
        {
            "type": "INVENTORY_ADJUST",
            "adjustmentType": "DECREASE",
            "sku": "${fields.sku}",
            "qty": "${waste.totalQty}",
            "lot": "${fields.lote}"
        }
    ]
}
```

**Evaluación**: usar `jsonlogic` o un evaluador simple propio (permitir AND/OR, comparadores, acceso a `fields`, `waste`, `context`).

## 7.2 Acciones soportadas (v1)

* `SEND_EMAIL`, `CANCEL_FLOW`, `CREATE_ORDER`, `INVENTORY_ADJUST`, `CALL_WEBHOOK`.
* Reintentos con backoff; bitácora por acción (éxito/falla).

---

# 8) Offline‑First & Sync

**Frontend**

* IndexedDB (Dexie) con stores: `drafts`, `queue`, `shadow` (copia conocida del servidor) y `meta`.
* Estrategia de imágenes/evidencias: carga **chunked**, reintentos y compresión local opcional.

**Conflictos**

* Nivel registro por `updatedAt`, `deviceId` y `version`. Regla v1: **server‑wins** salvo campos marcados como `mergeable` (p.ej. evidencias → unión). Bitácora de conflictos para revisión.

**Backend**

* Endpoints `pull/push` con **deltas** por `serverTs` y **outbox** por entidad.

---

# 9) Seguridad, Auditoría y Observabilidad

* JWT, RBAC por rol y por recurso (template/versión/instancia).
* Auditoría por cada cambio relevante; hash de integridad opcional.
* OpenTelemetry: `traceId` y `spanId` propagados; `requestId` por petición.
* Rate limiting, validación con class‑validator, sanitización.

---

# 10) KPIs & Reportes (v1)

* Lotes procesados, tiempo medio por paso, % pasos re‑trabajados, mermas totales, eficiencia %, cumplimiento.
* Reportes CSV/PDF; dashboards básicos (gráfico series temporales + ranking de cuellos de botella).

---

# 11) Criterios de Aceptación (alto nivel)

* Versionado y publicación con bloqueo operativo.
* Builder permite crear pasos, campos, categorías y reglas de finalización.
* Ejecución completa online y offline con sync fiable.
* Mermas impactan inventario cuando la regla lo indique.
* KPIs y exportación disponibles por período y filtro de flujo/versión.

---

# 12) Plan de Entrega – Tareas Progresivas

## 12.1 Backend · 4 Tareas

**B1 · Dominio & Migraciones**

* Entidades y migraciones (FlowTemplate, FlowVersion, FlowStep, FieldCategory, FieldDef, TerminationRule, FlowInstance, StepExecution, FieldValue, WasteRecord, OrderLink, SyncOutbox, AuditLog).
* Repositorios, validaciones dominio, seeds mínimos.
* **DoD**: pruebas unitarias entidades/repos; Swagger básico de lectura.

**B2 · Builder & Publicación**

* CRUD completo templates/versiones/steps/fields/categorías; publicación y bloqueo.
* Validación de esquema (keys únicos, órdenes, referencias).
* **DoD**: e2e de publicación; no se puede editar PUBLISHED.

**B3 · Motor de Reglas & Automatizaciones**

* DSL condiciones, ejecución atómica de acciones con transacciones/eventos.
* Integraciones: SMTP genérico, webhook genérico, ajuste inventario (dominio inventory) y creación de orden (dominio orders).
* **DoD**: reintentos, bitácora, pruebas simuladas.

**B4 · Ejecución, Sync & KPIs**

* API de ejecución (start/complete/cancel), sync pull/push con deltas y conflictos.
* Consultas KPI + materialized views opcional.
* **DoD**: pruebas carga base (p95 < 2s), documentación Swagger completa.

## 12.2 Frontend · 4 Tareas

**F1 · Shell PWA & Sync Layer**

* Config PWA, IndexedDB (Dexie), servicios `SyncService`, `AttachmentService` con colas y reintentos.
* Componentes base, layout responsivo (Tailwind + M3), rutas lazy.
* **DoD**: modo offline operativo, diagnóstico de sync.

**F2 · Flow Builder (Canvas Node‑Based)**

* Canvas con nodos (steps) y aristas; toolbox; drag\&drop; zoom/pan; minimap.
* Sidebar para editar campos/categorías/propiedades y **Termination Rules** con editor de condiciones/acciones.
* **DoD**: guardar/cargar versión; validaciones visuales; undo/redo.

**F3 · Runner de Ejecución (Mobile‑first)**

* Formularios dinámicos por paso (Reactive Forms), evidencias, mermas, links de orden.
* Finalización condicional (preview de acciones a ejecutar) y ejecución offline.
* **DoD**: LCP < 2.5s, time‑to‑interact < 2s en móviles de gama media.

**F4 · KPIs & Exportables**

* Dashboards (series, ranking cuellos de botella), filtros por período/flujo/versión.
* Exportación CSV/PDF (html2pdf + optimizaciones).
* **DoD**: accesibilidad AA, pruebas de usabilidad con 3 casos.

---

# 13) Lineamientos Técnicos (Específico)

## 13.1 Backend (Nest CLI & convenciones)

* Estructura por módulo `tracing` con capas `domain`, `application`, `infrastructure`.
* Interceptores: logging, tracing, class‑validator, error mapping.
* Unit tests: servicios dominio y reglas; e2e básicos con Supertest.

## 13.2 Frontend (Angular Optimizations)

* Standalone + Signals; **ChangeDetection.OnPush** en todo; `trackBy` en listas; `*ngFor` con `@for` cuando aplique.
* Rutas **lazy** + prefetch adaptativo; **defer** de imágenes y componentes pesados.
* Formularios: `FormBuilder` + validadores puros; detach/reattach cuando el paso no es visible.
* IndexedDB: batch writes, compresión imágenes antes de subir.

---

# 14) Anexos

## 14.1 Ejemplos de Payloads

**Crear versión**

```json
POST /tracing/templates/123/versions
{
    "fromVersion": 1,
    "note": "v2 agrega tratamiento químico"
}
```

**Completar paso**

```json
POST /tracing/instances/987/steps/55/complete
{
    "fieldValues": [
        {
            "fieldKey": "responsable",
            "value": "user_42"
        },
        {
            "fieldKey": "lote",
            "value": "L-2025-08"
        }
    ],
    "wastes": [
        {
            "qty": 12,
            "reason": "fallo germinación",
            "affectsInventory": true
        }
    ],
    "links": [
        {
            "mode": "CREATED",
            "orderId": "auto"
        }
    ]
}
```

## 14.2 Métricas de Calidad

* Backend p95 < 2s; error rate < 1%; 100% endpoints con Swagger.
* Front: LCP < 2.5s; CLS < 0.1; TTI < 2s; bundle < 250KB inicial (sin fuentes).

---

# 15) PRD Específicos (para repos separados)

## 15.1 PRD – Backend (tracing/PRD.md)

**Secciones**: Executive Summary, Scope, Domain Model, APIs, Sync, Rules Engine, Security, Observability, KPIs, Acceptance, Delivery Plan (B1‑B4), Glossary.

**Objetivo**: Implementar dominio, builder, reglas, ejecución, sync y reportes.

## 15.2 PRD – Frontend (app/modules/tracing/PRD.md)

**Secciones**: Executive Summary, UX Goals, Architecture, Node Canvas, Dynamic Forms Runner, Offline & Sync, Analytics, Accessibility, Performance, Acceptance, Delivery Plan (F1‑F4), Glossary.

**Objetivo**: Construir builder visual, ejecución mobile‑first, sync y dashboards.
