export interface Pagination<T> {
    page: number;
    limit: number;
    totalElements: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    items: T[];
}
