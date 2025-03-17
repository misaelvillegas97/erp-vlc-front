// column-config.model.ts
import { TemplateRef }            from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

export type ColumnType = 'text' | 'date' | 'currency' | 'badge' | 'custom';
export type FilterType = 'text' | 'select' | 'autocomplete' | 'date' | 'date-range' | 'number';

export interface ColumnDisplayConfig {
    type?: ColumnType;
    classes?: string | ((row: any) => string);
    containerClasses?: string | ((row: any) => string);
    formatter?: (value: any, row?: any) => string;
    customTemplate?: TemplateRef<any>;
    pipeOptions?: any;
    onClick?: (row: any) => void;
    // Posibles nuevas propiedades para la presentación
    alignment?: 'left' | 'center' | 'right';
    width?: string;
}

export interface ColumnFilterOptions {
    options?: { value: any; viewValue: string }[];
    multiple?: boolean;
    placeholder?: string;
    placeholderFn?: (value: any, row?: any) => string;
}

export interface ColumnFilterConfig {
    control?: FormControl;
    group?: FormGroup;
    type?: FilterType;
    options?: ColumnFilterOptions;
    displayWith?: (value: any) => string;
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
