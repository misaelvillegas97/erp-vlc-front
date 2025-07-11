import { RoutePermission } from '@core/permissions/models/route-permission';
import { RoleEnum }        from '@core/user/role.type';

export const ADMINISTRATION_FEATURE_KEY = 'operations';
export const ACCOUNTING_FEATURE_KEY = 'accounting';
export const ORDERS_FEATURE_KEY = 'orders';
export const INVOICES_FEATURE_KEY = 'invoices';

export const administrationPermissions: RoutePermission[] = [
    {
        path        : ADMINISTRATION_FEATURE_KEY,
        title       : 'Operaciones',
        description : 'Gestión de operaciones',
        icon        : 'heroicons_outline:briefcase',
        allowedRoles: [ RoleEnum.admin, RoleEnum.accountant, RoleEnum.dispatcher ],
        children    : [
            {
                path        : ACCOUNTING_FEATURE_KEY,
                title       : 'Contabilidad',
                description : 'Gestión contable',
                icon        : 'heroicons_outline:calculator',
                allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ],
                children    : [
                    {
                        path        : 'dashboard',
                        title       : 'Dashboard',
                        description : 'Panel de control contable',
                        icon        : 'heroicons_outline:chart-pie',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ]
                    },
                    {
                        path        : 'payables',
                        title       : 'Cuentas por Pagar',
                        description : 'Gestión de cuentas por pagar',
                        icon        : 'heroicons_outline:document-text',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ]
                    },
                    {
                        path        : 'receivables',
                        title       : 'Cuentas por Cobrar',
                        description : 'Gestión de cuentas por cobrar',
                        icon        : 'heroicons_outline:document-text',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ]
                    },
                    {
                        path        : 'banking',
                        title       : 'Bancos',
                        description : 'Gestión bancaria',
                        icon        : 'heroicons_outline:banknotes',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ]
                    }
                ]
            },
            {
                path        : ORDERS_FEATURE_KEY,
                title       : 'Órdenes',
                description : 'Gestión de órdenes',
                icon        : 'heroicons_outline:paper-airplane',
                allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ],
                children    : [
                    {
                        path        : 'dashboard',
                        title       : 'Dashboard',
                        description : 'Panel de control de órdenes',
                        icon        : 'heroicons_outline:chart-pie',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    },
                    {
                        path        : 'list',
                        title       : 'Listado de Órdenes',
                        description : 'Ver todas las órdenes',
                        icon        : 'heroicons_outline:document-text',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    },
                    {
                        path        : 'new',
                        title       : 'Registro de Nueva Orden',
                        description : 'Crear una nueva orden',
                        icon        : 'heroicons_outline:plus-circle',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.dispatcher ]
                    }
                ]
            },
            {
                path        : INVOICES_FEATURE_KEY,
                title       : 'Facturas',
                description : 'Gestión de facturas',
                icon        : 'heroicons_outline:banknotes',
                allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ],
                children    : [
                    {
                        path        : 'dashboard',
                        title       : 'Dashboard de Facturas',
                        description : 'Panel de control de facturas',
                        icon        : 'heroicons_outline:chart-pie',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ]
                    },
                    {
                        path        : 'list',
                        title       : 'Listado de Facturas',
                        description : 'Ver todas las facturas',
                        icon        : 'heroicons_outline:document-text',
                        allowedRoles: [ RoleEnum.admin, RoleEnum.accountant ]
                    }
                ]
            }
        ]
    }
];
