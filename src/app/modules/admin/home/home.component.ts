import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule }             from '@angular/material/card';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { RouterModule }              from '@angular/router';
import { UserService }               from '@core/user/user.service';
import { User }                      from '@core/user/user.types';
import { RoleEnum }                  from '@core/user/role.type';
import { Observable }                from 'rxjs';
import { AsyncPipe, NgClass }        from '@angular/common';
import { trackByFn }                 from '@libs/ui/utils/utils';

interface Shortcut {
    title: string;
    description: string;
    icon: string;
    route: string;
    roles: RoleEnum[];
    color: string;
}

@Component({
  selector: 'app-home',
    imports: [
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        RouterModule,
        AsyncPipe,
        NgClass
    ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    private _userService = inject(UserService);

    user$: Observable<User>;
    roleEnum = RoleEnum;

    shortcuts: Shortcut[] = [
        {
            title      : 'Órdenes',
            description: 'Gestionar órdenes',
            icon       : 'shopping_cart',
            route      : '/operations/orders',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color: 'blue'
        },
        {
            title      : 'Facturas',
            description: 'Ver facturas',
            icon       : 'receipt',
            route      : '/operations/invoices',
            roles      : [ RoleEnum.admin, RoleEnum.accountant ],
            color: 'green'
        },
        {
            title      : 'Contabilidad',
            description: 'Gestionar contabilidad',
            icon       : 'account_balance',
            route      : '/operations/accounting',
            roles      : [ RoleEnum.admin, RoleEnum.accountant ],
            color: 'yellow'
        },
        {
            title      : 'Logística',
            description: 'Control de flota',
            icon       : 'local_shipping',
            route: '/logistics/fleet-management/fleet-control',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher, RoleEnum.driver ],
            color: 'purple'
        },
        {
            title      : 'Clientes',
            description: 'Gestionar clientes',
            icon       : 'people',
            route      : '/maintainers/clients',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color: 'pink'
        },
        {
            title      : 'Productos',
            description: 'Gestionar productos',
            icon       : 'inventory_2',
            route      : '/maintainers/products',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color: 'indigo'
        },
        {
            title      : 'Vehículos',
            description: 'Gestionar vehículos',
            icon       : 'directions_car',
            route      : '/maintainers/vehicles',
            roles: [ RoleEnum.admin ],
            color: 'teal'
        },
        {
            title      : 'Usuarios',
            description: 'Gestionar usuarios',
            icon       : 'manage_accounts',
            route      : '/maintainers/users',
            roles      : [ RoleEnum.admin ],
            color: 'orange'
        }
    ];

    ngOnInit(): void {
        this.user$ = this._userService.user$;
    }

    /**
     * Check if the shortcut should be visible for the user
     * @param shortcut The shortcut to check
     * @param user The current user
     * @returns True if the shortcut should be visible
     */
    isShortcutVisible(shortcut: Shortcut, user: User): boolean {
        if (user?.role?.id === RoleEnum.admin) {
            return true;
        }

        return shortcut.roles.includes(user?.role?.id);
    }

    protected readonly trackByFn = trackByFn;
}
