import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule }                       from '@angular/material/card';
import { MatButtonModule }                     from '@angular/material/button';
import { MatIconModule }                       from '@angular/material/icon';
import { MatBadgeModule }                      from '@angular/material/badge';
import { RouterModule }                        from '@angular/router';
import { UserService }                         from '@core/user/user.service';
import { User }                                from '@core/user/user.types';
import { RoleEnum }                            from '@core/user/role.type';
import { Observable }                          from 'rxjs';
import { NgComponentOutlet }                   from '@angular/common';
import { trackByFn }                           from '@libs/ui/utils/utils';

// Widget components
// Utility widgets
import { WeatherWidgetComponent }              from './weather-widget/weather-widget.component';
import { FuelPricesComponent }                 from './fuel-prices/fuel-prices.component';
import { IndustryNewsComponent }               from './industry-news/industry-news.component';
import { toSignal }                            from '@angular/core/rxjs-interop';

// Design tokens para colores accesibles (WCAG 2.1 AA)
interface DesignToken {
    primary: string;
    secondary: string;
    hover: string;
    text: string;
    background: string;
    border: string;
}

interface DesignTokensTheme {
    light: Record<string, DesignToken>;
    dark: Record<string, DesignToken>;
}

const DESIGN_TOKENS_THEME: DesignTokensTheme = {
    light: {
        critical: {
            primary   : 'rgb(220, 38, 38)', // red-600
            secondary : 'rgb(254, 226, 226)', // red-100
            hover     : 'rgb(185, 28, 28)', // red-700
            text      : 'rgb(127, 29, 29)', // red-900
            background: 'rgb(255, 245, 245)', // red-50
            border    : 'rgb(252, 165, 165)' // red-300
        },
        warning : {
            primary   : 'rgb(217, 119, 6)', // amber-600
            secondary : 'rgb(254, 243, 199)', // amber-100
            hover     : 'rgb(180, 83, 9)', // amber-700
            text      : 'rgb(146, 64, 14)', // amber-800
            background: 'rgb(255, 251, 235)', // amber-50
            border    : 'rgb(252, 211, 77)' // amber-300
        },
        success : {
            primary   : 'rgb(22, 163, 74)', // green-600
            secondary : 'rgb(220, 252, 231)', // green-100
            hover     : 'rgb(21, 128, 61)', // green-700
            text      : 'rgb(20, 83, 45)', // green-800
            background: 'rgb(240, 253, 244)', // green-50
            border    : 'rgb(134, 239, 172)' // green-300
        },
        primary : {
            primary   : 'rgb(37, 99, 235)', // blue-600
            secondary : 'rgb(219, 234, 254)', // blue-100
            hover     : 'rgb(29, 78, 216)', // blue-700
            text      : 'rgb(30, 64, 175)', // blue-800
            background: 'rgb(239, 246, 255)', // blue-50
            border    : 'rgb(147, 197, 253)' // blue-300
        },
        info    : {
            primary   : 'rgb(99, 102, 241)', // indigo-600
            secondary : 'rgb(224, 231, 255)', // indigo-100
            hover     : 'rgb(79, 70, 229)', // indigo-700
            text      : 'rgb(67, 56, 202)', // indigo-800
            background: 'rgb(238, 242, 255)', // indigo-50
            border    : 'rgb(165, 180, 252)' // indigo-300
        },
        neutral : {
            primary   : 'rgb(75, 85, 99)', // gray-600
            secondary : 'rgb(243, 244, 246)', // gray-100
            hover     : 'rgb(55, 65, 81)', // gray-700
            text      : 'rgb(31, 41, 55)', // gray-800
            background: 'rgb(249, 250, 251)', // gray-50
            border    : 'rgb(209, 213, 219)' // gray-300
        }
    },
    dark : {
        critical: {
            primary   : 'rgb(239, 68, 68)', // red-500
            secondary : 'rgb(127, 29, 29)', // red-900
            hover     : 'rgb(220, 38, 38)', // red-600
            text      : 'rgb(254, 226, 226)', // red-100
            background: 'rgb(69, 10, 10)', // red-950
            border    : 'rgb(153, 27, 27)' // red-800
        },
        warning : {
            primary   : 'rgb(245, 158, 11)', // amber-500
            secondary : 'rgb(146, 64, 14)', // amber-800
            hover     : 'rgb(217, 119, 6)', // amber-600
            text      : 'rgb(254, 243, 199)', // amber-100
            background: 'rgb(69, 26, 3)', // amber-950
            border    : 'rgb(180, 83, 9)' // amber-700
        },
        success : {
            primary   : 'rgb(34, 197, 94)', // green-500
            secondary : 'rgb(20, 83, 45)', // green-800
            hover     : 'rgb(22, 163, 74)', // green-600
            text      : 'rgb(220, 252, 231)', // green-100
            background: 'rgb(5, 46, 22)', // green-950
            border    : 'rgb(21, 128, 61)' // green-700
        },
        primary : {
            primary   : 'rgb(59, 130, 246)', // blue-500
            secondary : 'rgb(30, 64, 175)', // blue-800
            hover     : 'rgb(37, 99, 235)', // blue-600
            text      : 'rgb(219, 234, 254)', // blue-100
            background: 'rgb(23, 37, 84)', // blue-950
            border    : 'rgb(29, 78, 216)' // blue-700
        },
        info    : {
            primary   : 'rgb(129, 140, 248)', // indigo-400
            secondary : 'rgb(67, 56, 202)', // indigo-800
            hover     : 'rgb(99, 102, 241)', // indigo-500
            text      : 'rgb(224, 231, 255)', // indigo-100
            background: 'rgb(30, 27, 75)', // indigo-950
            border    : 'rgb(79, 70, 229)' // indigo-700
        },
        neutral : {
            primary   : 'rgb(156, 163, 175)', // gray-400
            secondary : 'rgb(31, 41, 55)', // gray-800
            hover     : 'rgb(107, 114, 128)', // gray-500
            text      : 'rgb(243, 244, 246)', // gray-100
            background: 'rgb(3, 7, 18)', // gray-950
            border    : 'rgb(55, 65, 81)' // gray-700
        }
    }
};

// Servicio para detectar el tema del navegador
class ThemeService {
    private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    private _isDarkTheme = signal(this.mediaQuery.matches);

    readonly isDarkTheme = this._isDarkTheme.asReadonly();

    constructor() {
        // Escuchar cambios en la preferencia del tema
        this.mediaQuery.addEventListener('change', (e) => {
            this._isDarkTheme.set(e.matches);
        });
    }
}

// Métricas en tiempo real para badges
interface Metric {
    key: string;
    value: number;
    status: 'normal' | 'warning' | 'critical';
    lastUpdated?: Date;
}

interface Shortcut {
    title: string;
    description: string;
    icon: string;
    route: string;
    roles: RoleEnum[];
    color: keyof (typeof DESIGN_TOKENS_THEME.light);
    priority: number; // Para ordenar por frecuencia de uso
    category: 'operations' | 'commercial' | 'administration';
}

interface RoleWidget {
    title: string;
    description: string;
    icon: string;
    color: keyof (typeof DESIGN_TOKENS_THEME.light);
    component: any;
    data?: any;
    roles: RoleEnum[];
    priority: number;
    category: 'operations' | 'commercial' | 'administration' | 'utility';
    metrics?: Metric[];
}

@Component({
    selector   : 'app-home',
    imports    : [
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatBadgeModule,
        RouterModule,
        NgComponentOutlet,
        WeatherWidgetComponent,
    ],
    templateUrl: './home.component.html'
})
export class HomeComponent {
    private _userService = inject(UserService);
    private _themeService = new ThemeService();

    user = toSignal<User>(this._userService.user$);

    user$: Observable<User>;

    // Signals para tema reactivo
    isDarkTheme = this._themeService.isDarkTheme;

    shortcuts = signal([
        {
            title      : 'Órdenes',
            description: 'Gestionar órdenes de trabajo',
            icon       : 'mat_solid:assignment',
            route      : '/operations/orders',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color      : 'critical' as const,
            priority   : 1,
            category   : 'operations' as const,
        },
        {
            title      : 'Logística',
            description: 'Control de flota y rutas',
            icon       : 'mat_solid:local_shipping',
            route      : '/logistics/fleet-management/fleet-control',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher, RoleEnum.driver ],
            color      : 'primary' as const,
            priority   : 2,
            category   : 'operations' as const,
        },
        {
            title      : 'Inventario',
            description: 'Control de stock y almacén',
            icon       : 'mat_solid:inventory_2',
            route      : '/operations/inventory',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color      : 'warning' as const,
            priority   : 3,
            category   : 'operations' as const
        },

        // Gestión Comercial (segunda prioridad)
        {
            title      : 'Clientes',
            description: 'Gestión de clientes y contactos',
            icon       : 'mat_solid:people',
            route      : '/maintainers/clients',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color      : 'info' as const,
            priority   : 4,
            category   : 'commercial' as const
        },
        {
            title      : 'Productos',
            description: 'Catálogo y precios',
            icon       : 'mat_solid:shopping_bag',
            route      : '/maintainers/products',
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher ],
            color      : 'success' as const,
            priority   : 5,
            category   : 'commercial' as const
        },
        {
            title      : 'Facturas',
            description: 'Facturación y cobros',
            icon       : 'mat_solid:receipt_long',
            route      : '/operations/invoices',
            roles      : [ RoleEnum.admin, RoleEnum.accountant ],
            color      : 'warning' as const,
            priority   : 6,
            category   : 'commercial' as const,
        },

        // Administración (tercera prioridad)
        {
            title      : 'Contabilidad',
            description: 'Estados financieros y reportes',
            icon       : 'mat_solid:account_balance',
            route      : '/operations/accounting',
            roles      : [ RoleEnum.admin, RoleEnum.accountant ],
            color      : 'neutral' as const,
            priority   : 7,
            category   : 'administration' as const,
        },
        {
            title      : 'Vehículos',
            description: 'Flota y mantenimiento',
            icon       : 'mat_solid:directions_car',
            route      : '/maintainers/vehicles',
            roles      : [ RoleEnum.admin ],
            color      : 'primary' as const,
            priority   : 8,
            category   : 'administration' as const
        },
        {
            title      : 'Usuarios',
            description: 'Gestión de personal',
            icon       : 'mat_solid:manage_accounts',
            route      : '/maintainers/users',
            roles      : [ RoleEnum.admin ],
            color      : 'neutral' as const,
            priority   : 9,
            category   : 'administration' as const
        }
    ]);

    designTokens = computed(() => {
        return this.isDarkTheme() ? DESIGN_TOKENS_THEME.dark : DESIGN_TOKENS_THEME.light;
    });

    // Utility widgets optimizados con métricas
    utilityWidgets = computed(() => [
        {
            title      : 'Precios de Combustible',
            description: 'Precios actuales en gasolineras cercanas',
            icon       : 'mat_solid:local_gas_station',
            color      : 'success' as const,
            component  : FuelPricesComponent,
            roles      : [ RoleEnum.admin, RoleEnum.driver, RoleEnum.dispatcher ],
            priority   : 2,
            category   : 'utility' as const
        },
        {
            title      : 'Noticias del Sector',
            description: 'Últimas noticias relevantes para la industria logística',
            icon       : 'mat_solid:article',
            color      : 'info' as const,
            component  : IndustryNewsComponent,
            roles      : [ RoleEnum.admin, RoleEnum.dispatcher, RoleEnum.accountant ],
            priority   : 3,
            category   : 'utility' as const
        }
    ]);

    utilityWidgetsVisibles = computed(() => {
        return this.utilityWidgets().filter(widget => this.isWidgetVisible(widget, this.user()));
    });

    // Computed signals para organización optimizada
    operationsShortcuts = computed(() =>
        this.shortcuts()
            .filter(s => s.category === 'operations')
            .filter(s => this.isShortcutVisible(s, this.user()))
            .sort((a, b) => a.priority - b.priority)
    );

    commercialShortcuts = computed(() =>
        this.shortcuts()
            .filter(s => s.category === 'commercial')
            .filter(s => this.isShortcutVisible(s, this.user()))
            .sort((a, b) => a.priority - b.priority)
    );

    administrationShortcuts = computed(() =>
        this.shortcuts()
            .filter(s => s.category === 'administration')
            .filter(s => this.isShortcutVisible(s, this.user()))
            .sort((a, b) => a.priority - b.priority)
    );

    /**
     * Obtiene el token de diseño para un color específico de forma reactiva
     */
    getDesignToken(color: keyof (typeof DESIGN_TOKENS_THEME.light)): DesignToken {
        const tokens = this.designTokens();
        return tokens[color] || tokens.neutral;
    }

    /**
     * Check if the shortcut should be visible for the user
     */
    isShortcutVisible(shortcut: Shortcut, user: User): boolean {
        if (user?.role?.id === RoleEnum.admin) {
            return true;
        }
        return shortcut.roles.includes(user?.role?.id);
    }

    /**
     * Check if the widget should be visible for the user
     */
    isWidgetVisible(widget: RoleWidget, user: User): boolean {
        if (!widget || !user?.role?.id) {
            return false;
        }

        if (user.role.id === RoleEnum.admin) {
            return true;
        }

        return widget.roles.includes(user.role.id);
    }

    /**
     * Track by function for performance
     */
    trackByFn = trackByFn;
}
