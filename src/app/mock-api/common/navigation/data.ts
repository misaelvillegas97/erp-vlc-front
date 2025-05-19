/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';
import { RoleEnum }           from '@core/user/role.type';
import { PermissionsService } from '@core/permissions/permissions.service';

export function getNavigation(permissionsService: PermissionsService): FuseNavigationItem[] {
    // Get the base navigation from the permissions service
    const baseNavigation = permissionsService.getNavigationConfig();

    // Add home item which is always visible
    return [ ...baseNavigation ];
}

// For backward compatibility, keep the static arrays but they should be replaced with the function
export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Home',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link: '/home'
    },
    {
        id      : 'operations.title',
        title   : 'Operaciones',
        type         : 'group',
        icon    : 'heroicons_outline:briefcase',
        requiredRoles: [ RoleEnum.accountant, RoleEnum.dispatcher ],
        children: [
            {
                id           : 'operations.accounting.title',
                type         : 'collapsable',
                icon         : 'heroicons_outline:calculator',
                requiredRoles: [ RoleEnum.accountant ],
                children     : [
                    {
                        id  : 'operations.accounting.dashboard',
                        type: 'basic',
                        link: '/operations/accounting/dashboard',
                        icon: 'heroicons_outline:chart-pie'
                    },
                    {
                        id  : 'operations.accounting.payables',
                        type: 'basic',
                        link: '/operations/accounting/payables/list',
                        icon: 'heroicons_outline:document-text'
                    },
                    {
                        id  : 'operations.accounting.receivables',
                        type: 'basic',
                        link: '/operations/accounting/receivables/list',
                        icon: 'heroicons_outline:document-text'
                    },
                    {
                        id  : 'operations.accounting.bank',
                        type: 'basic',
                        link: '/operations/accounting/bank/list',
                        icon: 'heroicons_outline:banknotes'
                    },
                    {
                        id  : 'operations.accounting.reports',
                        type: 'basic',
                        link: '/operations/accounting/reports',
                        icon: 'heroicons_outline:document-report'
                    },
                ]
            },
            {
                id           : 'operations.orders.title',
                type         : 'collapsable',
                icon         : 'heroicons_outline:paper-airplane',
                requiredRoles: [ RoleEnum.dispatcher ],
                children     : [
                    {
                        id  : 'operations.orders.dashboard',
                        type: 'basic',
                        link: '/operations/orders/dashboard',
                        icon: 'heroicons_outline:chart-pie'
                    },
                    {
                        id  : 'operations.orders.list',
                        type: 'basic',
                        link: '/operations/orders/list',
                        icon: 'heroicons_outline:document-text'
                    },
                    {
                        id  : 'operations.orders.create',
                        type: 'basic',
                        link: '/operations/orders/new',
                        icon: 'heroicons_outline:plus-circle'
                    },
                ]
            },
            {
                id           : 'operations.invoices.title',
                type         : 'collapsable',
                icon         : 'heroicons_outline:banknotes',
                requiredRoles: [ RoleEnum.accountant ],
                children     : [
                    {
                        id  : 'operations.invoices.dashboard',
                        type: 'basic',
                        link: '/operations/invoices/dashboard',
                        icon: 'heroicons_outline:chart-pie'
                    },
                    {
                        id  : 'operations.invoices.list',
                        type: 'basic',
                        link: '/operations/invoices/list',
                        icon: 'heroicons_outline:document-text'
                    },
                ]
            }
        ]
    },
    {
        id           : 'logistics.title',
        type         : 'group',
        icon         : 'heroicons_outline:truck',
        requiredRoles: [ RoleEnum.driver ],
        children     : [
            {
                title   : 'Control de Flota',
                type    : 'collapsable',
                icon    : 'heroicons_outline:truck',
                children: [
                    {
                        id           : 'logistics.fleet-management.fleet-control',
                        title        : 'Control de Flota',
                        type         : 'basic',
                        link         : '/logistics/fleet-management/fleet-control',
                        icon         : 'heroicons_outline:truck',
                        requiredRoles: [ RoleEnum.driver ]
                    },
                    {
                        id  : 'logistics.active-sessions',
                        type: 'basic',
                        link: '/logistics/fleet-management/active-sessions',
                        icon: 'heroicons_outline:user-circle'
                    },
                    {
                        id           : 'logistics.history',
                        type         : 'basic',
                        link         : '/logistics/fleet-management/history',
                        icon         : 'heroicons_outline:clock',
                        requiredRoles: [ RoleEnum.admin ]
                    }
                ]
            },
            {
                title   : 'Gestión de Combustible',
                type    : 'collapsable',
                icon    : 'heroicons_outline:fire',
                children: [
                    {
                        id   : 'logistics.fuel-management.analysis',
                        title: 'Análisis de Consumo',
                        type : 'basic',
                        link : '/logistics/fuel-management/analysis',
                        icon : 'heroicons_outline:chart-bar'
                    },
                    {
                        id   : 'logistics.fuel-management.list',
                        title: 'Listado de Registros',
                        type : 'basic',
                        link : '/logistics/fuel-management/list',
                        icon : 'heroicons_outline:table-cells'
                    },
                    {
                        id   : 'logistics.fuel-management.register',
                        title: 'Registro de Combustible',
                        type : 'basic',
                        link : '/logistics/fuel-management/register',
                        icon : 'heroicons_outline:plus-circle'
                    }
                ]
            }
        ]
    },
    {
        id           : 'maintainers.title',
        type         : 'group',
        icon         : 'heroicons_outline:cog',
        requiredRoles: [ RoleEnum.admin ],
        children     : [
            {
                id  : 'maintainers.clients',
                type: 'basic',
                link: '/maintainers/clients',
                icon: 'heroicons_outline:building-storefront'
            },
            {
                id  : 'maintainers.suppliers',
                type: 'basic',
                link: '/maintainers/suppliers',
                icon: 'heroicons_outline:user-group'
            },
            {
                id  : 'maintainers.products',
                type: 'basic',
                link: '/maintainers/products',
                icon: 'heroicons_outline:shopping-bag'
            },
            {
                id  : 'maintainers.users',
                type: 'basic',
                link: '/maintainers/users',
                icon: 'heroicons_outline:user-group'
            },
            {
                id: 'maintainers.payables.title',
                // icon    : 'mat_outline:attach_money',
                type    : 'group',
                children: [
                    {
                        id  : 'maintainers.payables.expense-type',
                        type: 'basic',
                        link: '/maintainers/expense-types/list',
                        icon: 'mat_outline:label'
                    },
                ]
            },
            {
                id: 'maintainers.logistics.title',
                // icon: 'heroicons_outline:truck',
                type    : 'group',
                children: [
                    {
                        id  : 'maintainers.logistics.vehicles',
                        type: 'basic',
                        link: '/maintainers/vehicles/list',
                        icon: 'heroicons_outline:truck'
                    },
                    {
                        id  : 'maintainers.logistics.drivers',
                        type: 'basic',
                        link: '/maintainers/drivers/list',
                        icon: 'heroicons_outline:user-circle'
                    }
                ]
            },
            {
                id: 'maintainers.settings.title',
                // icon    : 'heroicons_outline:cog',
                type    : 'group',
                children: [
                    {
                        id: 'maintainers.settings.feature-toggles',
                        type: 'basic',
                        link: '/maintainers/feature-toggles/list',
                        icon: 'heroicons_outline:cog'
                    },
                ]
            }
        ]
    }
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Home',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/example'
    }
];
