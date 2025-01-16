/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Home',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/home'
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
        id: 'maintainers.title',
        type    : 'collapsable',
        icon    : 'heroicons_outline:cog',
        link    : '/admin',
        children: [
            {
                id  : 'maintainers.clients',
                type : 'basic',
                link: '/maintainers/clients',
                icon: 'heroicons_outline:building-storefront'
            },
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
