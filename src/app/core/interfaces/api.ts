export interface Api<T> {
    content: T;
    method: string;
    path: string;
    statusCode: number;
    timestamp: Date;
}
