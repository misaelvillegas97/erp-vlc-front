import { Component, inject, OnInit }             from '@angular/core';
import { MatCardModule }                         from '@angular/material/card';
import { MatButtonModule }                       from '@angular/material/button';
import { MatIconModule }                         from '@angular/material/icon';
import { RouterModule }                          from '@angular/router';
import { UserService }                           from '@core/user/user.service';
import { User }                                  from '@core/user/user.types';
import { RoleEnum }                              from '@core/user/role.type';
import { Observable }                            from 'rxjs';
import { AsyncPipe, NgClass, NgComponentOutlet } from '@angular/common';
import { trackByFn }                             from '@libs/ui/utils/utils';

// Widget components
// Utility widgets
import { WeatherWidgetComponent }                from './weather-widget/weather-widget.component';
import { FuelPricesComponent }                   from './fuel-prices/fuel-prices.component';
import { IndustryNewsComponent }                 from './industry-news/industry-news.component';

interface Shortcut {
    title: string;
    description: string;
    icon: string;
    route: string;
    roles: RoleEnum[];
    color: string;
}

interface RoleWidget {
    title: string;
    description: string;
    icon: string;
    color: string;
    component: any; // Componente a renderizar
    data?: any;     // Datos opcionales para pasar al componente
    roles: RoleEnum[];
}

@Component({
  selector: 'app-home',
    imports: [
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        RouterModule,
        AsyncPipe,
        NgClass,
        NgComponentOutlet,
        WeatherWidgetComponent,
    ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    private _userService = inject(UserService);

    user$: Observable<User>;
    roleEnum = RoleEnum;


    // Utility widgets that are available to all users
    utilityWidgets: RoleWidget[] = [
        {
            title      : 'Clima',
            description: 'Información meteorológica actual y pronóstico',
            icon       : 'mat_solid:wb_sunny',
            color      : 'blue',
            component  : WeatherWidgetComponent,
            roles      : [ RoleEnum.admin, RoleEnum.driver, RoleEnum.dispatcher, RoleEnum.accountant ]
        },
        {
            title      : 'Precios de Combustible',
            description: 'Precios actuales en gasolineras cercanas',
            icon       : 'mat_solid:local_gas_station',
            color      : 'green',
            component  : FuelPricesComponent,
            roles      : [ RoleEnum.admin, RoleEnum.driver, RoleEnum.dispatcher ]
        },
        {
            title      : 'Noticias del Sector',
            description: 'Últimas noticias relevantes para la industria logística',
            icon       : 'mat_solid:article',
            color      : 'purple',
            component  : IndustryNewsComponent,
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher, RoleEnum.accountant ]
        }
    ];

    // Named getters for utility widgets to avoid using array indices in the template
    get weatherWidget(): RoleWidget {
        return this.utilityWidgets[0];
    }

    get fuelPricesWidget(): RoleWidget {
        return this.utilityWidgets[1];
    }

    get industryNewsWidget(): RoleWidget {
        return this.utilityWidgets[2];
    }

    roleWidgets: RoleWidget[] = [
        // Para conductores
        // {
        //     title: 'Estado del Vehículo',
        //     description: 'Información sobre el estado actual de tu vehículo asignado',
        //     icon: 'mat_solid:speed',
        //     color: 'blue',
        //     component: VehicleStatusComponent,
        //     roles: [RoleEnum.driver]
        // },
        // {
        //     title: 'Mis Rutas',
        //     description: 'Rutas asignadas para hoy',
        //     icon: 'mat_solid:map',
        //     color: 'green',
        //     component: AssignedRoutesComponent,
        //     roles: [RoleEnum.driver]
        // },
        //
        // // Para contadores
        // {
        //     title: 'Resumen Financiero',
        //     description: 'Resumen de ingresos y gastos',
        //     icon: 'mat_solid:bar_chart',
        //     color: 'yellow',
        //     component: FinancialSummaryComponent,
        //     roles: [RoleEnum.accountant]
        // },
        // {
        //     title: 'Facturas Pendientes',
        //     description: 'Facturas que requieren atención',
        //     icon: 'mat_solid:assignment_late',
        //     color: 'red',
        //     component: PendingInvoicesComponent,
        //     roles: [RoleEnum.accountant]
        // },
        //
        // // Para despachadores
        // {
        //     title: 'Órdenes Urgentes',
        //     description: 'Órdenes que requieren atención inmediata',
        //     icon: 'mat_solid:priority_high',
        //     color: 'purple',
        //     component: UrgentOrdersComponent,
        //     roles: [RoleEnum.dispatcher]
        // },
        // {
        //     title: 'Disponibilidad de Flota',
        //     description: 'Vehículos disponibles para asignar',
        //     icon: 'mat_solid:commute',
        //     color: 'teal',
        //     component: FleetAvailabilityComponent,
        //     roles: [RoleEnum.dispatcher]
        // },
        //
        // // Para administradores
        // {
        //     title: 'Vista General',
        //     description: 'Resumen de todos los departamentos',
        //     icon: 'mat_solid:dashboard',
        //     color: 'indigo',
        //     component: DepartmentOverviewComponent,
        //     roles: [RoleEnum.admin]
        // },
        // {
        //     title: 'Alertas Críticas',
        //     description: 'Problemas que requieren atención inmediata',
        //     icon: 'mat_solid:warning',
        //     color: 'orange',
        //     component: CriticalAlertsComponent,
        //     roles: [RoleEnum.admin]
        // }
    ];

    shortcuts: Shortcut[] = [
        {
            title      : 'Órdenes',
            description: 'Gestionar órdenes',
            icon: 'mat_solid:shopping_cart',
            route      : '/operations/orders',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color: 'blue'
        },
        {
            title      : 'Facturas',
            description: 'Ver facturas',
            icon: 'mat_solid:receipt',
            route      : '/operations/invoices',
            roles      : [ RoleEnum.admin, RoleEnum.accountant ],
            color: 'green'
        },
        {
            title      : 'Contabilidad',
            description: 'Gestionar contabilidad',
            icon: 'mat_solid:account_balance',
            route      : '/operations/accounting',
            roles      : [ RoleEnum.admin, RoleEnum.accountant ],
            color: 'yellow'
        },
        {
            title      : 'Logística',
            description: 'Control de flota',
            icon: 'mat_solid:local_shipping',
            route: '/logistics/fleet-management/fleet-control',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher, RoleEnum.driver ],
            color: 'purple'
        },
        {
            title      : 'Clientes',
            description: 'Gestionar clientes',
            icon: 'mat_solid:people',
            route      : '/maintainers/clients',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color: 'pink'
        },
        {
            title      : 'Productos',
            description: 'Gestionar productos',
            icon: 'mat_solid:inventory_2',
            route      : '/maintainers/products',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color: 'indigo'
        },
        {
            title      : 'Vehículos',
            description: 'Gestionar vehículos',
            icon: 'mat_solid:directions_car',
            route      : '/maintainers/vehicles',
            roles: [ RoleEnum.admin ],
            color: 'teal'
        },
        {
            title      : 'Usuarios',
            description: 'Gestionar usuarios',
            icon: 'mat_solid:manage_accounts',
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

    /**
     * Check if the widget should be visible for the user
     * @param widget The widget to check
     * @param user The current user
     * @returns True if the widget should be visible
     */
    isWidgetVisible(widget: RoleWidget, user: User): boolean {
        if (user?.role?.id === RoleEnum.admin) {
            return true;
        }

        return widget.roles.includes(user?.role?.id);
    }

    protected readonly trackByFn = trackByFn;
}
