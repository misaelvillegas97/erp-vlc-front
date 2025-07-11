import { RoleEnum }           from '@core/user/role.type';
import { FuseNavigationItem } from '../../../../@fuse/components/navigation';

export interface RoutePermission {
    path: string;
    allowedRoles: RoleEnum[];
    title?: string;
    description?: string;
    icon?: string;
    selectedIcon?: string;
    children?: RoutePermission[];
    navOptions?: Partial<FuseNavigationItem>;
    hideInMainNav?: boolean;
}
