import { Injectable }                                                            from '@angular/core';
import { trigger, state, style, transition, animate, keyframes, query, stagger } from '@angular/animations';

@Injectable({
    providedIn: 'root'
})
export class FleetAnimationsService {

    // Animación para botones de acción
    static buttonPress = trigger('buttonPress', [
        transition(':enter', [
            style({transform: 'scale(0.95)', opacity: 0.8}),
            animate('150ms ease-out', style({transform: 'scale(1)', opacity: 1}))
        ]),
        transition('* => pressed', [
            animate('100ms ease-in', style({transform: 'scale(0.95)'}))
        ]),
        transition('pressed => *', [
            animate('100ms ease-out', style({transform: 'scale(1)'}))
        ])
    ]);

    // Animación para cambios de estado de sesión
    static sessionStateChange = trigger('sessionStateChange', [
        transition('* => active', [
            animate('300ms ease-out', keyframes([
                style({transform: 'scale(1)', backgroundColor: '*', offset: 0}),
                style({transform: 'scale(1.05)', backgroundColor: '#10b981', offset: 0.5}),
                style({transform: 'scale(1)', backgroundColor: '#10b981', offset: 1})
            ]))
        ]),
        transition('* => finished', [
            animate('300ms ease-out', keyframes([
                style({transform: 'scale(1)', backgroundColor: '*', offset: 0}),
                style({transform: 'scale(1.05)', backgroundColor: '#f59e0b', offset: 0.5}),
                style({transform: 'scale(1)', backgroundColor: '#f59e0b', offset: 1})
            ]))
        ])
    ]);

    // Animación para cards de sesiones activas
    static sessionCardHover = trigger('sessionCardHover', [
        state('default', style({transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)'})),
        state('hovered', style({transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'})),
        transition('default <=> hovered', animate('200ms ease-out'))
    ]);

    // Animación para lista de sesiones
    static sessionList = trigger('sessionList', [
        transition('* => *', [
            query(':enter', [
                style({opacity: 0, transform: 'translateY(20px)'}),
                stagger(100, [
                    animate('300ms ease-out', style({opacity: 1, transform: 'translateY(0)'}))
                ])
            ], {optional: true})
        ])
    ]);

    // Animación para indicadores de GPS
    static gpsIndicator = trigger('gpsIndicator', [
        state('active', style({
            transform      : 'scale(1)',
            opacity        : 1,
            backgroundColor: '#10b981'
        })),
        state('inactive', style({
            transform      : 'scale(0.9)',
            opacity        : 0.6,
            backgroundColor: '#6b7280'
        })),
        transition('inactive => active', [
            animate('200ms ease-out', keyframes([
                style({transform: 'scale(0.9)', opacity: 0.6, offset: 0}),
                style({transform: 'scale(1.1)', opacity: 0.8, offset: 0.5}),
                style({transform: 'scale(1)', opacity: 1, offset: 1})
            ]))
        ]),
        transition('active => inactive', [
            animate('200ms ease-in')
        ])
    ]);

    // Animación para botones flotantes
    static floatingButton = trigger('floatingButton', [
        state('default', style({transform: 'scale(1) rotate(0deg)'})),
        state('pressed', style({transform: 'scale(0.95) rotate(2deg)'})),
        transition('default <=> pressed', animate('150ms ease-out'))
    ]);

    // Animación para notificaciones de estado
    static statusNotification = trigger('statusNotification', [
        transition(':enter', [
            style({opacity: 0, transform: 'translateX(100%)'}),
            animate('300ms ease-out', style({opacity: 1, transform: 'translateX(0)'}))
        ]),
        transition(':leave', [
            animate('200ms ease-in', style({opacity: 0, transform: 'translateX(100%)'}))
        ])
    ]);

    // Animación para carga de datos
    static dataLoading = trigger('dataLoading', [
        state('loading', style({opacity: 0.6})),
        state('loaded', style({opacity: 1})),
        transition('loading => loaded', [
            animate('300ms ease-out')
        ])
    ]);

    // Animación para elementos que aparecen/desaparecen
    static fadeInOut = trigger('fadeInOut', [
        transition(':enter', [
            style({opacity: 0}),
            animate('200ms ease-in', style({opacity: 1}))
        ]),
        transition(':leave', [
            animate('200ms ease-out', style({opacity: 0}))
        ])
    ]);

    // Animación para deslizar elementos
    static slideInOut = trigger('slideInOut', [
        transition(':enter', [
            style({transform: 'translateY(-10px)', opacity: 0}),
            animate('250ms ease-out', style({transform: 'translateY(0)', opacity: 1}))
        ]),
        transition(':leave', [
            animate('200ms ease-in', style({transform: 'translateY(-10px)', opacity: 0}))
        ])
    ]);
}
