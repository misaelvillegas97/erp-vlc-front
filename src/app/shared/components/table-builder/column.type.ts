// column-config.model.ts
import { TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';

export type ColumnType = 'text' | 'date' | 'currency' | 'clickable-text' | 'badge' | 'custom';
export type FilterType = 'text' | 'select' | 'autocomplete' | 'date' | 'number';

export interface ColumnConfig {
    key: string;
    header: string;
    type?: ColumnType;
    classes?: string;
    formatter?: (value: any, row?: any) => string;
    customTemplate?: TemplateRef<any>;
    pipeOptions?: any;
    onClick?: (row: any) => void;
    filterControl?: FormControl;
    filterType?: FilterType;
    filterOptions?: {
        options?: {
            value: any;
            viewValue: string;
        }[],
        multiple?: boolean;
    };
    filterDisplayWith?: (value: any) => string;
}
