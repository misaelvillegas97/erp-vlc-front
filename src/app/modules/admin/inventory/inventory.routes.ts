import { Routes }     from '@angular/router';
import { rolesGuard } from '@core/guards/roles.guard';
import { RoleEnum }   from '@core/user/role.type';

export default [
    {
        path         : '',
        loadComponent: () =>
            import('./inventory.component').then(m => m.InventoryComponent),
        children     : [
            {
                path         : 'dashboard',
                loadComponent: () =>
                    import('./pages/dashboards/inventory-dashboard/inventory-dashboard.component').then(m => m.InventoryDashboardComponent),
                title        : 'Inventario - Dashboard',
            },
            // Inventory group
            {
                path       : 'inventory',
                children   : [
                    {
                        path    : 'inventory-items',
                        children: [
                            {
                                path         : '',
                                loadComponent: () =>
                                    import('./pages/inventory/items-list/items-list.component').then(m => m.InventoryItemsComponent),
                                title        : 'Inventario - Items',
                            },
                            {
                                path         : 'create',
                                loadComponent: () =>
                                    import('./pages/inventory/items-create/items-create.component').then(m => m.InventoryItemsCreateComponent),
                                title        : 'Inventario - Crear Item',
                            },
                            {
                                path         : ':id',
                                loadComponent: () =>
                                    import('./pages/inventory/items-detail/items-detail.component').then(m => m.InventoryItemsDetailComponent),
                                title        : 'Inventario - Detalle de Item',
                            },
                            {
                                path         : ':id/edit',
                                loadComponent: () =>
                                    import('./pages/inventory/items-edit/items-edit.component').then(m => m.InventoryItemsEditComponent),
                                title        : 'Inventario - Editar Item',
                            }
                        ]
                    },
                    // Products component to be implemented
                    // {
                    //     path: 'products',
                    //     loadComponent: () =>
                    //         import('./pages/inventory/products/products.component').then(m => m.ProductsComponent),
                    //     title: 'Inventario - Productos',
                    // },
                    {
                        path      : '',
                        redirectTo: 'inventory-items',
                        pathMatch : 'full'
                    }
                ],
                canActivate: [ rolesGuard ],
                data       : {roles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]}
            },

            // Warehouse group
            {
                path       : 'warehouse',
                children   : [
                    {
                        path         : 'list',
                        loadComponent: () =>
                            import('./pages/warehouse/list/list.component').then(m => m.WarehouseListComponent),
                        title        : 'Inventario - Almacenes',
                    },
                    {
                        path         : 'create',
                        loadComponent: () =>
                            import('./pages/warehouse/create/create.component').then(m => m.WarehouseCreateComponent),
                        title        : 'Inventario - Crear Almacén',
                    },
                    {
                        path         : 'edit',
                        loadComponent: () =>
                            import('./pages/warehouse/edit/edit.component').then(m => m.WarehouseEditComponent),
                        title        : 'Inventario - Editar Almacén',
                    },
                    {
                        path         : 'detail',
                        loadComponent: () =>
                            import('./pages/warehouse/detail/detail.component').then(m => m.WarehouseDetailComponent),
                        title        : 'Inventario - Detalle de Almacén',
                    },
                    {
                        path      : '',
                        redirectTo: 'list',
                        pathMatch : 'full'
                    }
                ],
                canActivate: [ rolesGuard ],
                data       : {roles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]}
            },

            // Dashboards group
            {
                path       : 'dashboards',
                children   : [
                    {
                        path         : 'product-stock',
                        loadComponent: () =>
                            import('./pages/dashboards/products-stocks/products-stocks.component').then(m => m.ProductsStocksComponent),
                        title        : 'Inventario - Stock por Producto',
                    },
                    {
                        path         : 'warehouse-stock',
                        loadComponent: () =>
                            import('./pages/dashboards/warehouse-stocks/warehouse-stocks.component').then(m => m.WarehouseStocksComponent),
                        title        : 'Inventario - Stock por Almacén',
                    },
                    {
                        path         : 'low-stock',
                        loadComponent: () =>
                            import('./pages/dashboards/low-stock/low-stock.component').then(m => m.LowStockComponent),
                        title        : 'Inventario - Bajo Stock',
                    },
                    {
                        path         : 'expiring-items',
                        loadComponent: () =>
                            import('./pages/dashboards/expiring-items/expiring-items.component').then(m => m.ExpiringItemsComponent),
                        title        : 'Inventario - Ítems por Expirar',
                    },
                    {
                        path         : 'inventory-alerts',
                        loadComponent: () =>
                            import('./pages/dashboards/inventory-alerts/inventory-alerts.component').then(m => m.InventoryAlertsComponent),
                        title        : 'Inventario - Alertas',
                    },
                    {
                        path         : 'inventory-movement-report',
                        loadComponent: () =>
                            import('./pages/dashboards/inventory-movements/inventory-movements.component').then(m => m.InventoryMovementsComponent),
                        title        : 'Inventario - Reporte de Movimientos',
                    },
                    {
                        path      : '',
                        redirectTo: 'inventory-dashboard',
                        pathMatch : 'full'
                    }
                ],
                canActivate: [ rolesGuard ],
                data       : {roles: [ RoleEnum.admin, RoleEnum.inventory_manager, RoleEnum.warehouse_staff ]}
            },

            // Default route
            {
                path      : '',
                redirectTo: 'inventory/inventory-items',
                pathMatch : 'full'
            }
        ]
    }
] satisfies Routes;
