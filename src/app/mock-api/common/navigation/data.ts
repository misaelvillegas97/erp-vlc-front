/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Home',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link: '/home'
    },
    {
        id: 'dashboards.title',
        title: 'Dashboards',
        type : 'collapsable',
        icon : 'heroicons_outline:chart-pie',
        children: [
            {
                id   : 'dashboards.analytics',
                title: 'All News',
                type : 'basic',
                link : '/dashboards/analytics',
                icon : 'heroicons_outline:globe-asia-australia'
            },
            {
                id   : 'dashboards.projects',
                title: 'All News',
                type : 'basic',
                link : '/dashboards/project',
                icon : 'heroicons_outline:queue-list'
            },
            {
                id   : 'dashboards.finance',
                title: 'All News',
                type : 'basic',
                link : '/dashboards/finance',
                icon : 'heroicons_outline:currency-dollar'
            },
            {
                id   : 'dashboards.crypto',
                title: 'All News',
                type : 'basic',
                link : '/dashboards/crypto',
                icon : 'heroicons_outline:currency-dollar'
            }
        ]
    },
    {
        id      : 'operations.title',
        title   : 'Operations',
        type    : 'collapsable',
        icon    : 'heroicons_outline:briefcase',
        children: [
            {
                id      : 'operations.accounting.title',
                type: 'collapsable',
                children: [
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
                id      : 'operations.orders.title',
                type: 'collapsable',
                children: [
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
                id      : 'operations.invoices.title',
                type: 'collapsable',
                children: [
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
        id      : 'logistics.title',
        type    : 'collapsable',
        icon    : 'heroicons_outline:truck',
        children: [
            {
                id  : 'logistics.fleet-control',
                type: 'basic',
                link: '/logistics/fleet-control',
                icon: 'heroicons_outline:truck'
            },
            {
                id  : 'logistics.active-sessions',
                type: 'basic',
                link: '/logistics/active-sessions',
                icon: 'heroicons_outline:user-circle'
            },
            {
                id  : 'logistics.history',
                type: 'basic',
                link: '/logistics/history',
                icon: 'heroicons_outline:clock'
            }
        ]
    },
    {
        id: 'maintainers.title',
        type    : 'collapsable',
        icon    : 'heroicons_outline:cog',
        children: [
            {
                id  : 'maintainers.clients',
                type : 'basic',
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
                id      : 'maintainers.payables.title',
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
                        id  : 'maintainers.settings.list.title',
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
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Home',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Home',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/home'
    },
    // news
    {
        id      : 'news',
        title   : 'News',
        type    : 'collapsable',
        icon    : 'heroicons_outline:newspaper',
        link    : '/news',
        children: [
            {
                id   : 'allNews',
                title: 'All News',
                type : 'basic',
                link : '/news/all'
            },
            {
                id   : 'newsByCategory',
                title: 'News By Category',
                type : 'basic',
                link : '/news/category'
            },
        ]
    },
    // Multimedia (gallery and videos)
    {
        id      : 'multimedia',
        title   : 'Multimedia',
        type    : 'collapsable',
        icon    : 'heroicons_outline:photo',
        link    : '/multimedia',
        children: [
            {
                id   : 'gallery',
                title: 'Gallery',
                type : 'basic',
                link : '/multimedia/gallery'
            },
            {
                id   : 'videos',
                title: 'Videos',
                type : 'basic',
                link : '/multimedia/videos'
            },
        ]
    },
];
