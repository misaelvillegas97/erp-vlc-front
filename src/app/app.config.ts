import { provideHttpClient }                                                                                                               from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, importProvidersFrom, inject, provideZoneChangeDetection }                       from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS }                                                                                                   from '@angular/material/core';
import { LuxonDateAdapter }                                                                                                                from '@angular/material-luxon-adapter';
import { provideAnimations }                                                                                                               from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, Router, withComponentInputBinding, withInMemoryScrolling, withPreloading, withViewTransitions } from '@angular/router';

import { IonicStorageModule }                                 from '@ionic/storage-angular';
import { provideTransloco, TranslocoService }                 from '@ngneat/transloco';
import { CalendarCommonModule, DateAdapter as DateAdapterAC } from 'angular-calendar';
import { adapterFactory }                                     from 'angular-calendar/date-adapters/date-fns';
import { LightgalleryModule }                                 from 'lightgallery/angular';
import { SocketIoConfig, SocketIoModule }                     from 'ngx-socket-io';
import { firstValueFrom }                                     from 'rxjs';
import * as Sentry                                            from '@sentry/angular';


import { provideAuth }            from '@core/auth/auth.provider';
import { provideIcons }           from '@core/icons/icons.provider';
import { TranslocoHttpLoader }    from '@core/transloco/transloco.http-loader';
import { provideFuse }            from '@fuse';
import { StorageService }         from '@fuse/services/storage';
import { appRoutes }              from 'app/app.routes';
import { mockApiServices }        from 'app/mock-api';
import { DropzoneCdkModule }      from '@ngx-dropzone/cdk';
import { DropzoneMaterialModule } from '@ngx-dropzone/material';

const config: SocketIoConfig = {
    url    : 'localhost:5000/ws/board',
    options: {
        autoConnect: false,
        transports : [ 'websocket' ]
    }
};

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({
            eventCoalescing: true
        }),
        provideAnimations(),
        provideHttpClient(),
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
            CalendarCommonModule.forRoot({
                provide   : DateAdapterAC,
                useFactory: adapterFactory
            }),
            LightgalleryModule,
            DropzoneCdkModule,
            DropzoneMaterialModule
        ),

        // Material Date Adapter
        {
            provide : DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide : MAT_DATE_FORMATS,
            useValue: {
                parse  : {
                    dateInput: 'D',
                },
                display: {
                    dateInput         : 'DDD',
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
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide   : APP_INITIALIZER,
            useFactory: () => {
                const translocoService = inject(TranslocoService);
                const storageService = inject(StorageService);

                return () => storageService.whenReady().then(() => {
                    storageService.get('activeLang').then((defaultLang) => {
                        if (!defaultLang)
                            defaultLang = translocoService.getDefaultLang();

                        translocoService.setActiveLang(defaultLang);
                        return firstValueFrom(translocoService.load(defaultLang));
                    });
                });
            },
            multi     : true,
            deps      : [ TranslocoService, StorageService ],
        },
        // Fuse
        provideAuth(),
        provideIcons(),
        provideFuse({
            mockApi: {
                delay   : 0,
                services: mockApiServices,
            },
            fuse   : {
                layout : 'enterprise',
                scheme : 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme  : 'theme-default',
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
