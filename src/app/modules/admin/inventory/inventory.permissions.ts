import { RoutePermission } from '@core/permissions/permissions.service';
import { RoleEnum }        from '@core/user/role.type';

export const INVENTORY_FEATURE_KEY = 'inventory';
export const inventoryPermissions: RoutePermission[] = [
    {
        path        : INVENTORY_FEATURE_KEY,
        title       : 'Inventario',
        description : 'Gestión de inventario y productos',
        icon        : 'heroicons_outline:archive-box',
        navOptions  : {type: 'collapsable'},
        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ],
        children    : [
            {
                path        : 'dashboard',
                title       : 'Dashboard de Inventario',
                description : 'Visualiza el estado general del inventario',
                icon        : 'heroicons_outline:chart-bar',
                selectedIcon: 'heroicons_solid:chart-bar',
                allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
            },
            {
                path        : 'dashboards',
                title       : 'Dashboards',
                description : 'Visualización y reportes de inventario',
                icon        : 'heroicons_outline:chart-bar',
                selectedIcon: 'heroicons_solid:chart-bar',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ],
                children    : [
                    {
                        path        : 'product-stock',
                        title       : 'Stock por Producto',
                        description : 'Consulta el inventario disponible por producto',
                        icon        : 'heroicons_outline:magnifying-glass',
                        selectedIcon: 'heroicons_solid:magnifying-glass',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    },
                    {
                        path        : 'warehouse-stock',
                        title       : 'Stock por Almacén',
                        description : 'Consulta el inventario disponible en cada almacén',
                        icon        : 'heroicons_outline:building-office',
                        selectedIcon: 'heroicons_solid:building-office',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    },
                    {
                        path        : 'low-stock',
                        title       : 'Bajo Stock',
                        description : 'Elementos con nivel de stock bajo',
                        icon        : 'heroicons_outline:exclamation-triangle',
                        selectedIcon: 'heroicons_solid:exclamation-triangle',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    },
                    {
                        path        : 'expiring-items',
                        title       : 'Ítems por Expirar',
                        description : 'Elementos próximos a expirar',
                        icon        : 'heroicons_outline:clock',
                        selectedIcon: 'heroicons_solid:clock',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    },
                    {
                        path        : 'inventory-alerts',
                        title       : 'Alertas de Inventario',
                        description : 'Gestiona las alertas de inventario',
                        icon        : 'heroicons_outline:bell',
                        selectedIcon: 'heroicons_solid:bell',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    },
                    {
                        path        : 'inventory-movement-report',
                        title       : 'Reporte de Movimientos',
                        description : 'Consulta los movimientos de inventario',
                        icon        : 'heroicons_outline:document-chart-bar',
                        selectedIcon: 'heroicons_solid:document-chart-bar',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    }
                ]
            },
            {
                path        : 'inventory',
                title       : 'Inventario',
                description : 'Gestión de elementos de inventario',
                icon        : 'heroicons_outline:cube',
                selectedIcon: 'heroicons_solid:cube',
                navOptions  : {type: 'collapsable'},
                allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ],
                children    : [
                    {
                        path        : 'inventory-items',
                        title       : 'Elementos de Inventario',
                        description : 'Gestiona los elementos de inventario en el sistema',
                        icon        : 'heroicons_outline:cube',
                        selectedIcon: 'heroicons_solid:cube',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    },
                    {
                        path        : 'products',
                        title       : 'Productos',
                        description : 'Gestiona los productos en el sistema',
                        icon        : 'heroicons_outline:tag',
                        selectedIcon: 'heroicons_solid:tag',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    }
                ]
            },

            // Warehouse group
            {
                path        : 'warehouse',
                title       : 'Centro de Almacenamiento',
                description : 'Gestión de almacenes y ubicaciones',
                icon        : 'heroicons_outline:home',
                selectedIcon: 'heroicons_solid:home',
                allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ],
                children    : [
                    {
                        path        : 'list',
                        title       : 'Lista de Almacenes',
                        description : 'Consulta y gestiona los almacenes disponibles',
                        icon        : 'heroicons_outline:building-office',
                        selectedIcon: 'heroicons_solid:building-office',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]
                    }
                ]
            },
        ]
    }
];
