// column-config.model.ts
import { TemplateRef }            from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateTime }               from 'luxon';
import { Color }                  from '@shared/components/badge/domain/model/badge.type';

export type ColumnType = 'text' | 'date' | 'currency' | 'number' | 'badge' | 'actions' | 'custom' | 'icon' | 'button' | 'progress' | 'toggle' | 'checkbox' | 'link' | 'image';

interface BaseFilterConfig {
    placeholder?: string;
    controlClasses?: string;
}

export interface TextFilterConfig extends BaseFilterConfig {
    type: 'text';
    control: FormControl<string>;
    pattern?: string;
}

export interface DateFilterConfig extends BaseFilterConfig {
    type: 'date';
    control: FormControl<DateTime>;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: string;
}

export interface DateRangeFilterConfig extends BaseFilterConfig {
    type: 'date-range';
    group: FormGroup<{ from: FormControl<DateTime>; to: FormControl<DateTime> }>;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: string;
}

export interface NumberFilterConfig extends BaseFilterConfig {
    type: 'number';
    control: FormControl<number>;
    min?: number;
    max?: number;
    step?: number;
}

export interface NumberRangeFilterConfig extends BaseFilterConfig {
    type: 'number-range';
    group: FormGroup<{ from: FormControl<number>; to: FormControl<number> }>;
    min?: number;
    max?: number;
    step?: number;
}

export interface AutocompleteFilterConfig extends BaseFilterConfig {
    type: 'autocomplete';
    control: FormControl;
    options: { value: any; viewValue: string }[];
    displayWith?: (value: any) => string;
}

export interface SelectFilterConfig extends BaseFilterConfig {
    type: 'select';
    control: FormControl;
    options: { value: any; viewValue: string }[];
    multiple: boolean;
}

export interface VehicleFilterConfig extends BaseFilterConfig {
    type: 'vehicle';
    control: FormControl<string>;
    hideLabel?: boolean;
    // vehicles: { id: string; name: string }[];
    // displayWith?: (value: any) => string;
}

export type ColumnFilterConfig =
    | TextFilterConfig
    | DateFilterConfig
    | DateRangeFilterConfig
    | NumberFilterConfig
    | NumberRangeFilterConfig
    | AutocompleteFilterConfig
    | SelectFilterConfig
    | VehicleFilterConfig;

export interface ColumnDisplayConfig<T> {
    type?: ColumnType;
    classes?: string | ((row: T) => string);
    containerClasses?: string | ((row: T) => string);
    label?: (value: any, row?: T) => string;
    customTemplate?: TemplateRef<any>;
    pipeOptions?: any; // TODO: Define available types
    onClick?: (row: T) => void;

    color?: (value: any, row?: T) => Color;

    // For actions column
    actions?: { icon: string; action: string; label?: string; tooltip?: string; color?: string; show?: (row: T) => boolean }[];
    action?: (action: string, row: T) => void;

    // For icon column
    icon?: string | ((value: any, row?: T) => string);
    iconColor?: string | ((value: any, row?: T) => string);
    iconSize?: string;

    // For tooltip
    tooltip?: string | ((value: any, row?: T) => string);

    // For button column
    buttonLabel?: string | ((value: any, row?: T) => string);
    buttonIcon?: string | ((value: any, row?: T) => string);
    buttonColor?: 'primary' | 'accent' | 'warn' | ((value: any, row?: T) => 'primary' | 'accent' | 'warn');
    buttonType?: 'basic' | 'raised' | 'stroked' | 'flat' | 'icon' | 'fab' | 'mini-fab';

    // For progress column
    progressColor?: 'primary' | 'accent' | 'warn' | ((value: any, row?: T) => 'primary' | 'accent' | 'warn');
    progressMode?: 'determinate' | 'indeterminate' | 'buffer' | 'query';

    // For toggle column
    toggleChange?: (checked: boolean, row: T) => void;
    toggleDisabled?: boolean | ((row: T) => boolean);

    // For checkbox column
    checkboxChange?: (checked: boolean, row: T) => void;
    checkboxDisabled?: boolean | ((row: T) => boolean);

    // For link column
    linkUrl?: string | ((value: any, row?: T) => string);
    linkTarget?: string | ((value: any, row?: T) => string);

    // For image column
    imageAlt?: string | ((value: any, row?: T) => string);
    imageFallback?: string;
    imageWidth?: string;
    imageHeight?: string;

    alignment?: 'left' | 'center' | 'right';
    width?: string;
}

export interface ColumnConfig<T> {
    key: string;
    header: string;
    display?: ColumnDisplayConfig<T>;
    filter?: ColumnFilterConfig;
    render?: (value: any, row?: T) => string | number | boolean | DateTime | TemplateRef<any>;

    // Nuevas propiedades generales, por ejemplo, para ordenamiento
    sortable?: boolean;
    sortFn?: (a: any, b: any, direction: 'asc' | 'desc') => number;

    visible: boolean;
}
