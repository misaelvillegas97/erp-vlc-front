import { provideHttpClient }                                                                                                            from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, inject, LOCALE_ID, provideAppInitializer, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE }                                                                               from '@angular/material/core';
import { LuxonDateAdapter }                                                                                                             from '@angular/material-luxon-adapter';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withInMemoryScrolling, withPreloading, withViewTransitions }      from '@angular/router';
import { provideServiceWorker }                                                                                                         from '@angular/service-worker';
import { environment }                                                                                                                  from '../environments/environment';
import { provideModulePermissions }                                                                                                     from '@core/permissions/permissions.providers';
import { homePermissions }                                                                                                              from '@modules/admin/home/home.permissions';
import { administrationPermissions }                                                                                                    from '@modules/admin/administration/administration.permissions';
import { dashboardsPermissions }                                                                                                        from '@modules/admin/dashboards/dashboards.permissions';
import { maintainersPermissions }                                                                                                       from '@modules/admin/maintainers/maintainers.permissions';

import { IonicStorageModule }                 from '@ionic/storage-angular';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { SocketIoConfig, SocketIoModule }     from 'ngx-socket-io';
import { firstValueFrom }                     from 'rxjs';


import { provideAuth }            from '@core/auth/auth.provider';
import { provideIcons }           from '@core/icons/icons.provider';
import { TranslocoHttpLoader }    from '@core/transloco/transloco.http-loader';
import { provideFuse }            from '@fuse';
import { StorageService }         from '@fuse/services/storage';
import { appRoutes }              from 'app/app.routes';
import { mockApiServices }        from 'app/mock-api';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { logisticsPermissions }   from '@modules/admin/logistics/logistics.permissions';
import { inventoryPermissions }   from '@modules/admin/inventory/inventory.permissions';
import { appsPermissions } from '@modules/admin/apps/apps.permissions';

const config: SocketIoConfig = {
    url    : 'localhost:5000/ws/board',
    options: {
        autoConnect: false,
        transports : [ 'websocket' ]
    }
};

export const appConfig: ApplicationConfig = {
    providers: [
        // provideZoneChangeDetection({eventCoalescing: true}),
        provideExperimentalZonelessChangeDetection(),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideServiceWorker('ngsw-worker.js', {
            enabled: environment.production,
            registrationStrategy: 'registerWhenStable:30000',
        }),
        provideRouter(appRoutes,
            withComponentInputBinding(),
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({scrollPositionRestoration: 'disabled'}),
            withViewTransitions()
        ),
        importProvidersFrom(
            SocketIoModule.forRoot(config),
            IonicStorageModule.forRoot({
                name: 'erpDB'
            }),
            // CalendarCommonModule.forRoot({
            //     provide   : DateAdapterAC,
            //     useFactory: adapterFactory
            // }),
        ),

        {
            provide : LOCALE_ID,
            useValue: 'es-CL'
        },

        // Material Date Adapter
        {
            provide : DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide : MAT_DATE_LOCALE,
            useValue: 'es-CL',
        },
        {
            provide : MAT_DATE_FORMATS,
            useValue: {
                parse  : {
                    dateInput: 'D',
                },
                display: {
                    dateInput: 'D', // dd-MM-yyyy | DDD for complete date label
                    monthYearLabel    : 'LLL yyyy',
                    dateA11yLabel     : 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        // Transloco Config
        provideTransloco({
            config: {
                availableLangs      : [
                    {
                        id   : 'en',
                        label: 'English',
                    },
                    {
                        id   : 'es',
                        label: 'Spanish',
                    },
                ],
                defaultLang         : 'es',
                fallbackLang        : 'es',
                reRenderOnLangChange: true,
                prodMode            : true,
            },
            loader: TranslocoHttpLoader,
        }),
        provideAppInitializer(async () => {
            const translocoService = inject(TranslocoService);
            const storageService = inject(StorageService);

            await storageService.whenReady();
            storageService.get('activeLang').then((defaultLang) => {
                if (!defaultLang)
                    defaultLang = translocoService.getDefaultLang();

                translocoService.setActiveLang(defaultLang);
                return firstValueFrom(translocoService.load(defaultLang));
            });
        }),
        // Register module permissions
        provideModulePermissions(homePermissions),
        // Administration
        provideModulePermissions(administrationPermissions),
        // Dashboards
        // provideModulePermissions(dashboardsPermissions),
        // Logistics
        provideModulePermissions(logisticsPermissions),
        // Inventory
        provideModulePermissions(inventoryPermissions),
        // Apps
        provideModulePermissions(appsPermissions),
        // Maintainers
        provideModulePermissions(maintainersPermissions),

        // Fuse
        provideAuth(),
        provideIcons(),
        provideFuse({
            mockApi: {
                delay   : 0,
                services: mockApiServices,
            },
            fuse   : {
                layout: 'dense',
                scheme: 'auto',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-amber',
                themes : [
                    {
                        id  : 'theme-default',
                        name: 'Default',
                    },
                    {
                        id  : 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id  : 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id  : 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id  : 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id  : 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
    ],
};
