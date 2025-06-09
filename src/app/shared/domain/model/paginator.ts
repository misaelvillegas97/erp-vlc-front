export interface Paginator {
    page: number;
    limit: number;
    totalElements: number;
    totalPages: number;
    disabled: boolean;
}
