import { Role } from '@core/user/role.type';

export interface User {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    email?: string;

    role?: Role;
}
