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
        id   : 'dashboards',
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
        id      : 'dashboards.title',
        title   : 'Dashboards',
        type    : 'collapsable',
        icon    : 'heroicons_outline:chart-bar-square',
        children: [
            {
                id   : 'dashboards.analytics',
                title: 'All News',
                type : 'basic',
                link : '/news/all',
                icon : 'heroicons_outline:globe-asia-australia'
            },
            {
                id   : 'dashboards.projects',
                title: 'All News',
                type : 'basic',
                link : '/news/all',
                icon : 'heroicons_outline:queue-list'
            },
        ]
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
                link : '/news/all',
                icon : 'heroicons_outline:newspaper'
            },
            {
                id   : 'newsByCategory',
                title: 'News By Category',
                type : 'basic',
                link : '/news/category',
                icon : 'heroicons_outline:document-text'
            },
            {
                id   : 'bio-bio',
                title: 'Radio Bío Bío',
                type : 'basic',
                link : '/news/bio-bio',
                icon : 'heroicons_outline:microphone'
            },
        ]
    },
    {
        id      : 'apps.title',
        title   : 'Applications',
        type    : 'collapsable',
        icon    : 'heroicons_outline:squares-2x2',
        link    : '/apps',
        children: [
            {
                id   : 'apps.gallery',
                title: 'Gallery',
                type : 'basic',
                link : '/apps/albums',
                icon : 'heroicons_outline:photo'
            },
            {
                id   : 'apps.contacts',
                title: 'Contacts',
                type : 'basic',
                link : '/apps/contacts',
                icon : 'heroicons_outline:user-group'
            },
            {
                id   : 'apps.scrumboards',
                title: 'Scrum boards',
                type : 'basic',
                link : '/apps/scrumboards',
                icon : 'heroicons_outline:queue-list'
            },
            {
                id   : 'apps.files-library',
                title: 'Files Library',
                type : 'basic',
                link : '/apps/files-library',
                icon : 'heroicons_outline:folder'
            },
            {
                id   : 'apps.benefits',
                title: 'Benefits',
                type : 'basic',
                link : '/apps/benefits',
                icon : 'heroicons_outline:gift'
            }
        ]
    },
    // admin panel
    {
        id      : 'admin.title',
        title   : 'Admin Panel',
        type    : 'collapsable',
        icon    : 'heroicons_outline:cog',
        link    : '/admin',
        children: [
            {
                id   : 'admin.news',
                title: 'News',
                type : 'basic',
                link : '/admin/news',
                icon : 'heroicons_outline:newspaper'
            },
            {
                id   : 'admin.users',
                title: 'Users',
                type : 'basic',
                link : '/admin/users',
                icon : 'heroicons_outline:user-group'
            },
            {
                id   : 'admin.events',
                title: 'Events',
                type : 'basic',
                link : '/admin/events',
                icon : 'heroicons_outline:calendar'
            },
            {
                id   : 'admin.albums',
                title: 'Albums',
                type : 'basic',
                link : '/admin/albums',
                icon : 'heroicons_outline:photo'
            },
            {
                id   : 'admin.benefits',
                title: 'Benefits',
                type : 'basic',
                link : '/admin/benefits',
                icon : 'heroicons_outline:gift'
            },
            {
                id   : 'admin.roles',
                title: 'Roles',
                type : 'basic',
                link : '/admin/roles',
                icon : 'heroicons_outline:key'
            },
            {
                id   : 'admin.permissions',
                title: 'Permissions',
                type : 'basic',
                link : '/admin/permissions',
                icon : 'heroicons_outline:shield-check'
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
