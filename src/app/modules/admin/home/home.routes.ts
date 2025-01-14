import { Route }         from '@angular/router';
import { HomeComponent } from '@modules/admin/home/home.component';

export default [
    {
        path         : '',
        loadComponent: () => import('./home.component').then(m => m.HomeComponent),
    }
] satisfies Route[];
