// column-config.model.ts
import { TemplateRef }            from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateTime }               from 'luxon';

export type ColumnType = 'text' | 'date' | 'currency' | 'badge' | 'custom';

interface BaseFilterConfig {
    placeholder?: string;
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

export type ColumnFilterConfig =
    | TextFilterConfig
    | DateFilterConfig
    | DateRangeFilterConfig
    | NumberFilterConfig
    | NumberRangeFilterConfig
    | AutocompleteFilterConfig
    | SelectFilterConfig;

export interface ColumnDisplayConfig {
    type?: ColumnType;
    classes?: string | ((row: any) => string);
    containerClasses?: string | ((row: any) => string);
    formatter?: (value: any, row?: any) => string;
    customTemplate?: TemplateRef<any>;
    pipeOptions?: any; // TODO: Define available types
    onClick?: (row: any) => void;

    alignment?: 'left' | 'center' | 'right';
    width?: string;
}

export interface ColumnConfig {
    key: string;
    header: string;
    display?: ColumnDisplayConfig;
    filter?: ColumnFilterConfig;

    // Nuevas propiedades generales, por ejemplo, para ordenamiento
    sortable?: boolean;
    sortFn?: (a: any, b: any, direction: 'asc' | 'desc') => number;

    visible: boolean;
}
