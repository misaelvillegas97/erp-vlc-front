# Lineamientos de Diseño para Páginas - ERP Angular

Este documento establece los estándares y patrones de diseño para la construcción de páginas en el sistema ERP Angular. Se basa en el análisis de componentes existentes y define plantillas estructuradas para diferentes tipos de páginas.

## Índice

1. [Principios Generales](#principios-generales)
2. [Tipos de Páginas](#tipos-de-páginas)
3. [Estructura Base](#estructura-base)
4. [Plantillas por Tipo de Página](#plantillas-por-tipo-de-página)
5. [Componentes Estándar](#componentes-estándar)
6. [Patrones de Estado](#patrones-de-estado)
7. [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
8. [Estructura de Archivos](#estructura-de-archivos)

## Principios Generales

### Responsive Design (Mobile-First)

- **Siempre** diseñar primero para dispositivos móviles
- Usar grids responsivos: `grid-cols-1 md:grid-cols-X lg:grid-cols-Y`
- Implementar breakpoints estándar: `sm:`, `md:`, `lg:`, `xl:`

### Consistencia Visual

- Usar `PageHeaderComponent` para todos los encabezados
- Mantener espaciado consistente con clases Tailwind
- Aplicar esquema de colores uniforme
- Usar iconografía consistente (Heroicons/Material Icons)

### Accesibilidad

- Incluir tooltips descriptivos
- Usar etiquetas semánticas apropiadas
- Mantener contraste adecuado
- Implementar navegación por teclado

## Tipos de Páginas

### 1. Páginas de Creación (Create Pages)

Formularios para crear nuevos registros o entidades.
**Ejemplos:** `items-create`, `vehicle-create`, `user-create`

### 2. Páginas de Lista/Reporte (List/Report Pages)

Visualización de datos tabulares con filtros y búsqueda.
**Ejemplos:** `inventory-movements`, `fleet-reports`, `user-list`

### 3. Páginas de Dashboard

Visualización de métricas, gráficos y KPIs.
**Ejemplos:** `warehouse-stocks`, `active-sessions-dashboard`, `inventory-dashboard`

## Estructura Base

### Layout Container

```html

<div class="flex flex-col min-w-0 w-full [min-h-screen]">
    <!-- PageHeader siempre presente -->
    <page-header/>

    <!-- Contenido principal con contenedor responsivo -->
    <div class="container mx-auto px-4 py-8">
        <!-- Contenido específico del tipo de página -->
    </div>
</div>
```

### PageHeader Estándar

```html

<page-header
    title="Título Descriptivo"
    subtitle="Descripción breve de la funcionalidad"
    icon="heroicons_outline:icon-name"
    [class]="'text-white'">
</page-header>
```

## Plantillas por Tipo de Página

## 1. Plantilla de Página de Creación

### Estructura TypeScript

```typescript
import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {PageHeaderComponent} from '@layout/components/page-header/page-header.component';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
// Importar servicio específico del dominio
// Importar modelo/interfaz específica
// Importar componente de formulario específico
import {NotyfService} from '@shared/services/notyf.service';
import {firstValueFrom} from 'rxjs';

@Component({
    selector: 'app-[module]-[entity]-create',
    standalone: true,
    imports: [
        CommonModule,
        PageHeaderComponent,
        // FormComponent específico
        MatCardModule,
        MatIconModule
    ],
    templateUrl: './[entity]-create.component.html'
})
export class

[Module][ Entity ]
CreateComponent
{
private readonly
    [entity]
    Service = inject([Entity]
    Service
)
    ;
private readonly
    router = inject(Router);
private readonly
    notyf = inject(NotyfService);

    isLoading = signal(false);

    async
    onFormSubmit(data
:
    [Entity]
):
    Promise < void > {
        try {
            this.isLoading.set(true);
            await firstValueFrom(this.[ entity ]Service.create[ Entity ](data)
)
    ;
    this.notyf.success('[Entity] creado correctamente');
    this.router.navigate(['/[module]/[entity]/list']);
} catch
    (error)
    {
        this.notyf.error('Error al crear [entity]');
        console.error('Error creating [entity]:', error);
    }
finally
    {
        this.isLoading.set(false);
    }
}

    onFormCancel()
:
    void {
        this.router.navigate(['/[module]/[entity]/list']);
    }
}
```

### Estructura HTML

```html

<div class="flex flex-col min-w-0 w-full">
    <page-header
        title="Crear [Entity]"
        subtitle="Registrar un nuevo [entity] en el sistema"
        icon="heroicons_outline:[icon-name]">
    </page-header>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 w-full p-6">
        <!-- Formulario principal -->
        <div class="md:col-span-8">
            <app-
            [entity]-form
            [isLoading]="isLoading()"
            (formSubmit)="onFormSubmit($event)"
            (formCancel)="onFormCancel()">
            </app-[entity]-form>
        </div>

        <!-- Panel de información lateral -->
        <div class="md:col-span-4 flex flex-col gap-6">
            <!-- Información general -->
            <mat-card class="rounded-md shadow">
                <mat-card-content>
                    <h2 class="text-xl font-medium mb-4 flex items-center">
                        <mat-icon svgIcon="mat_solid:info"></mat-icon>
                        <span class="ml-2">Información</span>
                    </h2>
                    <div class="text-gray-700 dark:text-gray-300 space-y-3">
                        <p>Descripción de la funcionalidad...</p>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Consejos o información adicional -->
            <mat-card class="rounded-md shadow">
                <mat-card-content>
                    <h2 class="text-xl font-medium mb-4 flex items-center">
                        <mat-icon svgIcon="mat_solid:tips_and_updates"></mat-icon>
                        <span class="ml-2">Consejos</span>
                    </h2>
                    <div class="text-gray-700 dark:text-gray-300 space-y-3">
                        <p><strong>Campo importante:</strong> Descripción del campo.</p>
                    </div>
                </mat-card-content>
            </mat-card>
        </div>
    </div>
</div>
```

## 2. Plantilla de Página de Lista/Reporte

### Estructura TypeScript

```typescript
import {Component, inject, resource, Signal, signal, TemplateRef, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {PageHeaderComponent} from '@layout/components/page-header/page-header.component';
import {TableBuilderComponent} from '@shared/components/table-builder/table-builder.component';
import {ColumnConfig} from '@shared/components/table-builder/column.type';
import {toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, firstValueFrom} from 'rxjs';
import {NotyfService} from '@shared/services/notyf.service';

@Component({
    selector: 'app-[module]-[entity]-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatProgressSpinner,
        PageHeaderComponent,
        TableBuilderComponent
    ],
    templateUrl: './[entity]-list.component.html'
})
export class

[Module][ Entity ]
ListComponent
{
private readonly
    [entity]
    Service = inject([Entity]
    Service
)
    ;
private readonly
    notyf = inject(NotyfService);

    // Controles de filtros
    searchControl = new FormControl('');
    dateFromControl = new FormControl();
    dateToControl = new FormControl();
    statusControl = new FormControl('');

    showAdvancedFilters = signal(false);

    // Señales reactivas para filtros
    searchTerm = toSignal(this.searchControl.valueChanges.pipe(debounceTime(300)), {initialValue: ''});
    dateFrom = toSignal(this.dateFromControl.valueChanges, {initialValue: null});
    dateTo = toSignal(this.dateToControl.valueChanges, {initialValue: null});
    status = toSignal(this.statusControl.valueChanges, {initialValue: ''});

    // Resource para datos
    dataResource = resource({
        request: () => ({
            search: this.searchTerm(),
            dateFrom: this.dateFrom(),
            dateTo: this.dateTo(),
            status: this.status()
        }),
        loader: async ({request}) => {
            try {
                return await firstValueFrom(this.[ entity ]
                Service.get[ Entity ]
                List(request)
            )
                ;
            } catch (error) {
                this.notyf.error('Error al cargar datos');
                return [];
            }
        }
    });

    // Configuración de columnas
    columnsConfig = signal<ColumnConfig[]>([
        {
            key: 'id',
            title: 'ID',
            sortable: true
        },
        {
            key: 'name',
            title: 'Nombre',
            sortable: true
        },
        {
            key: 'status',
            title: 'Estado',
            type: 'badge',
            badge: {
                label: (value) => this.getStatusLabel(value),
                color: (value) => this.getStatusColor(value)
            }
        },
        {
            key: 'actions',
            title: 'Acciones',
            type: 'template',
            template: this.actionsTemplate
        }
    ]);

    ngAfterViewInit()
:
    void {
        // Inicialización si es necesaria
    }

    toggleAdvancedFilters()
:
    void {
        this.showAdvancedFilters.update(value => !value);
    }

    clearFilters()
:
    void {
        this.searchControl.setValue('');
        this.dateFromControl.setValue(null);
        this.dateToControl.setValue(null);
        this.statusControl.setValue('');
    }

    // Helper methods
private
    getStatusLabel(status
:
    string
):
    string
    {
        // Implementar lógica de etiquetas
    }

private
    getStatusColor(status
:
    string
):
    Color
    {
        // Implementar lógica de colores
    }
}
```

### Estructura HTML

```html

<div class="flex flex-col min-w-0 w-full min-h-screen">
    <page-header
        title="Lista de [Entity]"
        subtitle="Consulta y gestión de [entity]"
        icon="heroicons_outline:[icon-name]"
        class="text-white">
    </page-header>

    <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col w-full max-w-7xl mx-auto gap-y-8">
            <!-- Panel de filtros -->
            <div class="w-full bg-card rounded-xl shadow-md p-6 border transition-all duration-300 hover:shadow-lg">
                <h2 class="text-lg font-semibold mb-4 flex items-center">
                    <mat-icon class="mr-2 text-blue-600">filter_list</mat-icon>
                    Filtros
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <mat-form-field class="w-full fuse-mat-dense" [subscriptSizing]="'dynamic'">
                        <input matInput [formControl]="searchControl" placeholder="Buscar...">
                        <mat-icon matSuffix svgIcon="heroicons_outline:magnifying-glass"></mat-icon>
                    </mat-form-field>

                    <!-- Botones de acción -->
                    <div class="flex justify-end items-center gap-3">
                        <button
                            mat-flat-button
                            color="primary"
                            type="button"
                            (click)="toggleAdvancedFilters()"
                            class="rounded-md hover:shadow-md transition-all duration-200">
                            Filtros avanzados
                            <mat-icon class="ml-1">{{ showAdvancedFilters() ? 'expand_less' : 'expand_more' }}</mat-icon>
                        </button>
                        <button
                            mat-flat-button
                            color="warn"
                            type="button"
                            (click)="clearFilters()"
                            class="rounded-md hover:shadow-md transition-all duration-200">
                            <mat-icon class="mr-1">clear</mat-icon>
                            Limpiar filtros
                        </button>
                        <button
                            (click)="dataResource.reload()"
                            [matTooltip]="'Recargar datos'"
                            mat-flat-button
                            color="accent"
                            class="rounded-md hover:shadow-md transition-all duration-200">
                            <mat-icon class="mr-1">refresh</mat-icon>
                            Actualizar
                        </button>
                    </div>
                </div>

                <!-- Filtros avanzados (colapsables) -->
                @if (showAdvancedFilters()) {
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <!-- Filtros adicionales aquí -->
                </div>
                }
            </div>

            <!-- Tabla de datos -->
            <div class="bg-card rounded-xl shadow-md p-6 border w-full">
                <h2 class="text-lg font-semibold mb-4 flex items-center">
                    <mat-icon class="mr-2 text-blue-600">[icon-name]</mat-icon>
                    Registro de [Entity]
                </h2>
                <div class="relative overflow-hidden w-full rounded-lg">
                    @if (columnsConfig()) {
                    <table-builder
                        [columns]="columnsConfig()"
                        [data]="dataResource.value() || []"
                        class="w-full">
                    </table-builder>
                    }

                    <!-- Estado vacío -->
                    @if (dataResource.value() && dataResource.value().length === 0) {
                    <div class="flex flex-col items-center justify-center p-8 text-center">
                        <mat-icon class="text-6xl text-gray-300 mb-4">[icon-name]</mat-icon>
                        <h3 class="text-xl font-medium">No hay [entity]</h3>
                        <p class="mt-2">No se encontraron [entity] con los filtros aplicados</p>
                    </div>
                    }
                </div>
            </div>
        </div>
    </div>

    <!-- Loading overlay -->
    @if (dataResource.isLoading()) {
    <div class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-card p-6 rounded-lg shadow-xl flex flex-col items-center">
            <mat-spinner diameter="48"></mat-spinner>
            <p class="mt-4 font-medium">Cargando datos...</p>
        </div>
    </div>
    }
</div>
```

## 3. Plantilla de Dashboard

### Estructura TypeScript

```typescript
import {Component, computed, inject, resource} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {RouterLink} from '@angular/router';
import {PageHeaderComponent} from '@layout/components/page-header/page-header.component';
import {NotyfService} from '@shared/services/notyf.service';
import {firstValueFrom} from 'rxjs';
import {ApexOptions, NgApexchartsModule} from 'ng-apexcharts';

@Component({
    selector: 'app-[module]-[entity]-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
        PageHeaderComponent,
        NgApexchartsModule
    ],
    templateUrl: './[entity]-dashboard.component.html'
})
export class

[Module][ Entity ]
DashboardComponent
{
private readonly
    [entity]
    Service = inject([Entity]
    Service
)
    ;
private readonly
    notyf = inject(NotyfService);

    // Resource para datos del dashboard
    dashboardResource = resource({
        loader: async () => {
            try {
                return await firstValueFrom(this.[ entity ]
                Service.getDashboardData()
            )
                ;
            } catch (error) {
                this.notyf.error('Error al cargar los datos del dashboard');
                return this.getEmptyDashboardData();
            }
        }
    });

    // Métricas computadas
    metric1 = computed(() => this.dashboardResource.value()?.metric1 || 0);
    metric2 = computed(() => this.dashboardResource.value()?.metric2 || 0);
    metric3 = computed(() => this.dashboardResource.value()?.metric3 || 0);
    metric4 = computed(() => this.dashboardResource.value()?.metric4 || 0);

    // Gráficos computados
    chart1 = computed(() => {
        const data = this.dashboardResource.value()?.chart1Data;
        if (!data) return null;

        return {
            series: [{
                name: 'Serie 1',
                data: data.values
            }],
            chart: {
                type: 'bar',
                height: 350,
                fontFamily: 'inherit',
                foreColor: 'var(--fuse-text-default)',
                zoom: {enabled: false},
                toolbar: {show: false}
            },
            colors: ['#4F46E5'],
            // Configuración adicional del gráfico
        } as ApexOptions;
    });

    reloadData()
:
    void {
        this.dashboardResource.reload();
    }

private
    getEmptyDashboardData()
    {
        return {
            metric1: 0,
            metric2: 0,
            metric3: 0,
            metric4: 0,
            chart1Data: null,
            chart2Data: null
        };
    }
}
```

### Estructura HTML

```html

<div class="flex flex-col min-w-0 w-full">
    <page-header
        title="Dashboard [Entity]"
        subtitle="Métricas y estadísticas de [entity]"
        icon="heroicons_outline:chart-bar">
    </page-header>

    <div class="container mx-auto px-4 py-8">
        <!-- Métricas principales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Métrica 1 -->
            <mat-card class="rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <mat-card-content class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Métrica 1</p>
                            <p class="text-2xl font-bold">{{ metric1() }}</p>
                        </div>
                        <mat-icon class="text-3xl text-blue-600">trending_up</mat-icon>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Repetir para otras métricas -->
        </div>

        <!-- Gráficos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Gráfico 1 -->
            <mat-card class="rounded-lg shadow-md">
                <mat-card-header>
                    <mat-card-title class="flex items-center">
                        <mat-icon class="mr-2">bar_chart</mat-icon>
                        Gráfico 1
                    </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                    @if (chart1()) {
                    <apx-chart
                        [series]="chart1()!.series"
                        [chart]="chart1()!.chart"
                        [colors]="chart1()!.colors"
                        [xaxis]="chart1()!.xaxis"
                        [yaxis]="chart1()!.yaxis">
                    </apx-chart>
                    }
                </mat-card-content>
            </mat-card>
        </div>

        <!-- Botón de actualización -->
        <div class="flex justify-center mt-8">
            <button
                mat-flat-button
                color="primary"
                (click)="reloadData()"
                [disabled]="dashboardResource.isLoading()"
                class="rounded-md">
                <mat-icon class="mr-2">refresh</mat-icon>
                Actualizar Dashboard
            </button>
        </div>
    </div>

    <!-- Loading overlay -->
    @if (dashboardResource.isLoading()) {
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <mat-card class="p-6">
            <div class="flex flex-col items-center">
                <mat-spinner diameter="40"></mat-spinner>
                <p class="mt-4">Cargando dashboard...</p>
            </div>
        </mat-card>
    </div>
    }
</div>
```

## Componentes Estándar

### PageHeaderComponent

**Uso obligatorio en todas las páginas**

```html

<page-header
    title="Título Principal"
    subtitle="Descripción breve"
    icon="heroicons_outline:icon-name"
    [class]="'additional-classes'">
</page-header>
```

### TableBuilderComponent

**Para todas las listas de datos**

```html

<table-builder
    [columns]="columnsConfig()"
    [data]="dataSource()"
    class="w-full">
</table-builder>
```

### Loading States

**Overlay para carga de página completa**

```html
@if (resource.isLoading()) {
<div class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-card p-6 rounded-lg shadow-xl flex flex-col items-center">
        <mat-spinner diameter="48"></mat-spinner>
        <p class="mt-4 font-medium">Cargando datos...</p>
    </div>
</div>
}
```

## Patrones de Estado

### Signals para Estado Local

```typescript
// Estados de UI
isLoading = signal(false);
showAdvancedFilters = signal(false);
selectedItem = signal<Item | null>(null);

// Estados computados
filteredData = computed(() => {
    return this.rawData().filter(item =>
        item.name.includes(this.searchTerm())
    );
});
```

### Resources para Datos del Servidor

```typescript
dataResource = resource({
    request: () => ({search: this.searchTerm()}),
    loader: async ({request}) => {
        try {
            return await firstValueFrom(this.service.getData(request));
        } catch (error) {
            this.notyf.error('Error al cargar datos');
            return [];
        }
    }
});
```

### FormControls con Signals

```typescript
searchControl = new FormControl('');
searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300)),
    {initialValue: ''}
);
```

## Convenciones de Nomenclatura

### Archivos y Carpetas

```
src/app/modules/admin/[module]/pages/[category]/[page-name]/
├── [page-name].component.ts
├── [page-name].component.html
└── [page-name].component.scss (opcional)
```

### Componentes

- **Selector:** `app-[module]-[entity]-[action]`
- **Clase:** `[Module][Entity][Action]Component`
- **Archivos:** `[entity]-[action].component.[ext]`

**Ejemplos:**

- `app-inventory-items-create` → `InventoryItemsCreateComponent`
- `app-logistics-fleet-dashboard` → `LogisticsFleetDashboardComponent`
- `app-admin-users-list` → `AdminUsersListComponent`

### Services

- **Nombre:** `[Entity]Service`
- **Archivo:** `[entity].service.ts`
- **Localización:** `src/app/modules/admin/[module]/services/`

### Models/Interfaces

- **Nombre:** `[Entity]` o `[Entity]Model`
- **Archivo:** `[entity].model.ts`
- **Localización:** `src/app/modules/admin/[module]/domain/models/`

## Estructura de Archivos

### Organización por Módulo

```
src/app/modules/admin/[module]/
├── domain/
│   ├── models/           # Interfaces y tipos
│   └── enums/           # Enumeraciones
├── services/            # Servicios del módulo
├── pages/              # Páginas del módulo
│   ├── [category]/     # Categoría de páginas
│   │   └── [page]/     # Página específica
│   │       ├── [page].component.ts
│   │       ├── [page].component.html
│   │       └── [page].component.scss
├── components/         # Componentes específicos del módulo
├── [module].routes.ts  # Rutas del módulo
├── [module].permissions.ts  # Permisos del módulo
└── [module].component.ts    # Componente raíz del módulo
```

### Categorías de Páginas

- **`/dashboards/`**: Páginas de métricas y visualizaciones
- **`/[entity]/`**: Páginas CRUD de entidades específicas
- **`/reports/`**: Páginas de reportes y consultas
- **`/settings/`**: Páginas de configuración

## Mejores Prácticas

### Performance

1. Usar `OnPush` change detection strategy
2. Implementar `trackBy` en listas largas
3. Lazy loading para módulos grandes
4. Optimizar imágenes con `NgOptimizedImage`

### Accesibilidad

1. Usar `matTooltip` para botones de acción
2. Incluir `aria-labels` apropiados
3. Mantener contraste de colores adecuado
4. Usar iconos semánticamente correctos

### Estado y Datos

1. Preferir `signals` sobre `BehaviorSubject`
2. Usar `resource` para datos del servidor
3. Implementar manejo de errores consistente
4. Mostrar estados de carga apropiados

### Estilos

1. Usar clases Tailwind predefinidas
2. Mantener espaciado consistente
3. Aplicar esquemas de color uniformes
4. Implementar transiciones suaves

## Checklist de Implementación

### Al crear una nueva página:

- [ ] Seguir la estructura de carpetas establecida
- [ ] Usar la plantilla apropiada según el tipo de página
- [ ] Implementar `PageHeaderComponent` con título, subtítulo e icono
- [ ] Configurar responsive design (mobile-first)
- [ ] Incluir manejo de estados de carga y error
- [ ] Implementar navegación apropiada (breadcrumbs, botones de regreso)
- [ ] Añadir tooltips y labels descriptivos
- [ ] Validar accesibilidad básica
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Documentar cualquier patrón nuevo o excepcional

Este documento debe ser consultado para cada nueva página creada en el sistema, asegurando consistencia y calidad en toda la aplicación.
