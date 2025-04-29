import { FuseNavigationItem } from './navigation.types';
import { User }               from '@core/user/user.types';
import { RoleEnum }           from '@core/user/role.type';

/**
 * Check if the user has access to the navigation item
 *
 * @param item
 * @param currentUser
 */
export const canAccess = (item: FuseNavigationItem, currentUser: User): boolean => {
    // If there's no user, deny access
    if (!currentUser || !currentUser.role) return false;

    // If the user is an admin, allow access to everything
    if (currentUser.role.id === RoleEnum.admin) return true;

    // If the item doesn't have requiredRoles or it's an empty array, allow access
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;

    // Check if the user's role is in the requiredRoles array
    return item.requiredRoles.includes(currentUser.role.id);
};
