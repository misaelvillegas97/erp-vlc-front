# Uso del Sistema de Permisos Centralizado en Componentes

Este documento explica cómo utilizar el sistema de permisos centralizado en componentes como `LogisticsComponent` que utilizan el componente `drawer-listing` para mostrar paneles de navegación.

## Problema

Anteriormente, los permisos se definían en múltiples lugares:

1. En los archivos de rutas (usando `rolesGuard` con datos de roles)
2. En la navegación principal (en `data.ts`)
3. En componentes específicos como `LogisticsComponent` (definiendo manualmente los paneles con `requiredRoles`)

Esto causaba duplicación y posibles inconsistencias cuando se modificaban los permisos.

## Solución

La solución implementada centraliza la definición de permisos en archivos específicos por módulo (como `logistics.permissions.ts`) y proporciona métodos para acceder a estos permisos desde cualquier parte de la aplicación.

### 1. Definir Permisos en Archivos de Módulo

Los permisos se definen en archivos específicos por módulo:

```typescript
// src/app/modules/admin/logistics/logistics.permissions.ts
export const logisticsPermissions: RoutePermission[] = [
    {
        path: 'logistics',
        title: 'Logística',
        icon: 'heroicons_outline:truck',
        allowedRoles: [RoleEnum.driver],
        children: [
            {
                path: 'fleet-control',
                title: 'Control de Flota',
                icon: 'heroicons_outline:truck',
                allowedRoles: [RoleEnum.driver, RoleEnum.dispatcher]
            },
            // Más rutas...
        ]
    }
];
```

### 2. Registrar Permisos en app.config.ts

```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
    providers: [
        // Otros proveedores...

        // Registrar permisos de módulos
        provideModulePermissions(logisticsPermissions),
        provideModulePermissions(homePermissions),

        // Más proveedores...
    ]
};
```

### 3. Usar Permisos en Componentes

Para usar los permisos en componentes como `LogisticsComponent`, se ha añadido un método `getModulePanels` al `PermissionsService` que convierte los permisos de un módulo específico al formato requerido por el componente `drawer-listing`:

```typescript
// En PermissionsService
getModulePanels(modulePath
:
string
):
any[ ]
{
    // Buscar el módulo en los permisos registrados
    const modulePermission = this._routePermissions.find(route => route.path === modulePath);

    if (!modulePermission || !modulePermission.children) {
        return [];
    }

    // Transformar los hijos del módulo en paneles
    return modulePermission.children.map(child => ({
        id: child.path,
        title: child.title,
        description: child.description,
        icon: child.icon,
        selectedIcon: child.selectedIcon,
        link: ['/' + modulePath, child.path],
        requiredRoles: child.allowedRoles
    }));
}
```

Luego, en el componente, simplemente se inyecta el servicio y se llama a este método:

```typescript
// src/app/modules/admin/logistics/logistics.component.ts
export class LogisticsComponent {
    readonly #ts = inject(TranslocoService);
    readonly #permissionsService = inject(PermissionsService);

    // Obtener los paneles del módulo de logística desde el servicio de permisos centralizado
    panels: WritableSignal<PanelType[]> = signal(this.#permissionsService.getModulePanels('logistics'));
}
```

## Beneficios

1. **Centralización**: Todas las definiciones de permisos están en un solo lugar por módulo.
2. **Consistencia**: Los mismos permisos se utilizan para rutas, navegación y componentes.
3. **Mantenibilidad**: Cambiar permisos solo requiere modificar el archivo de permisos del módulo.
4. **Escalabilidad**: Fácil de extender para nuevos módulos o funcionalidades.
5. **Reducción de código**: Elimina la duplicación de definiciones de permisos.

## Consideraciones Adicionales

- Si necesitas personalizar los paneles más allá de lo que proporciona el sistema de permisos (por ejemplo, añadir propiedades específicas), puedes modificar el método `getModulePanels` o extender los paneles devueltos:

```typescript
// Personalizar los paneles después de obtenerlos
const basePanels = this.#permissionsService.getModulePanels('logistics');
const customPanels = basePanels.map(panel => ({
    ...panel,
    customProperty: 'valor personalizado'
}));
panels: WritableSignal<PanelType[]> = signal(customPanels);
```

- Para traducciones, puedes procesar los paneles para aplicar traducciones:

```typescript
const basePanels = this.#permissionsService.getModulePanels('logistics');
const translatedPanels = basePanels.map(panel => ({
    ...panel,
    title: this.#ts.translate(panel.title),
    description: panel.description ? this.#ts.translate(panel.description) : undefined
}));
panels: WritableSignal<PanelType[]> = signal(translatedPanels);
```
