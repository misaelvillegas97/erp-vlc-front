export type Color = 'primary' | 'accent' | 'warn' | 'gray' | 'yellow' | 'blue' | 'green' | 'red';

export interface ColorMapping {
    bgLight: string;
    text: string;
    darkText: string;
    ring: string;
    ringBg: string;
}

export const COLOR_MAP: Record<Color, ColorMapping> = {
    gray  : {
        bgLight : 'bg-gray-50',
        text    : 'text-gray-700',
        darkText: 'dark:text-gray-500',
        ring    : 'ring-gray-600/20',
        ringBg  : 'bg-gray-600/20',
    },
    yellow: {
        bgLight : 'bg-yellow-50',
        text    : 'text-yellow-800',
        darkText: 'dark:text-yellow-500',
        ring    : 'ring-yellow-600/20',
        ringBg  : 'bg-yellow-600/20',
    },
    blue  : {
        bgLight : 'bg-blue-50',
        text    : 'text-blue-700',
        darkText: 'dark:text-blue-500',
        ring    : 'ring-blue-700/10',
        ringBg  : 'bg-blue-600/20',
    },
    green : {
        bgLight : 'bg-green-50',
        text    : 'text-green-700',
        darkText: 'dark:text-green-500',
        ring    : 'ring-green-600/20',
        ringBg  : 'bg-green-600/20',
    },
    red   : {
        bgLight : 'bg-red-50',
        text    : 'text-red-700',
        darkText: 'dark:text-red-500',
        ring    : 'ring-red-600/10',
        ringBg  : 'bg-red-600/20',
    },
    primary: {
        bgLight : 'bg-primary-50',
        text    : 'text-primary-700',
        darkText: 'dark:text-primary-500',
        ring    : 'ring-primary-600/20',
        ringBg  : 'bg-primary-600/20',
    },
    accent : {
        bgLight : 'bg-accent-50',
        text    : 'text-accent-700',
        darkText: 'dark:text-accent-500',
        ring    : 'ring-accent-600/20',
        ringBg  : 'bg-accent-600/20',
    },
    warn   : {
        bgLight : 'bg-warn-50',
        text    : 'text-warn-700',
        darkText: 'dark:text-warn-500',
        ring    : 'ring-warn-600/20',
        ringBg  : 'bg-warn-600/20',
    }
};
