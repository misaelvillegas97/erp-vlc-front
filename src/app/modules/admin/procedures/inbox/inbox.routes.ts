import { Routes } from '@angular/router';

export default [
    {
        path         : '',
        loadComponent: () => import('./pages/worker-inbox/worker-inbox.component')
            .then(c => c.WorkerInboxComponent),
        title        : 'Procedure Inbox'
    },
    {
        path         : 'publication/:id',
        loadComponent: () => import('./pages/publication-viewer/publication-viewer.component')
            .then(c => c.PublicationViewerComponent),
        title        : 'View Publication'
    }
] satisfies Routes;
