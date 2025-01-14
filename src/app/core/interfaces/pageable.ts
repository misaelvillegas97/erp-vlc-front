import { Sort } from './sort';

export type Pageable<T extends Record<string, unknown> = NonNullable<unknown>> = {
    page: number;
    size: number;
    offset: number;
    unpaged: boolean;
    totalPages: number;
    totalElements: number;
    sort: Sort[];
} & T;
