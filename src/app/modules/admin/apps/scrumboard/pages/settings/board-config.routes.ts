import { Routes }      from '@angular/router';
import { inject }      from '@angular/core';
import { UserService } from '@core/user/user.service';

export default [
    {
        path         : '',
        loadComponent: () => import('./pages/information/information.component').then(m => m.InformationComponent)
    },
    {
        path         : 'members',
        loadComponent: () => import('./pages/members/members.component').then(m => m.MembersComponent),
        resolve      : {
            companyMembers: () => inject(UserService).findAll()
        }
    },
    {
        path         : 'labels',
        loadComponent: () => import('./pages/labels/labels.component').then(m => m.LabelsComponent)
    }
] satisfies Routes;
