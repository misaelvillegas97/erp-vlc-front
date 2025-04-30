export interface Status {
    id: number;
    name?: string;
}

export enum StatusEnum {
    'active' = 1,
    'inactive' = 2,
    'pending' = 3,
}

export const statusNames = {
    [StatusEnum.active]  : 'active',
    [StatusEnum.inactive]: 'inactive',
    [StatusEnum.pending] : 'pending',
};
