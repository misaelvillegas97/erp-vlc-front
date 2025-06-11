import { Inject, Injectable, Optional } from '@angular/core';
import { RoleEnum }                     from '@core/user/role.type';
import { MODULE_PERMISSIONS }           from './permissions.tokens';
import { FuseNavigationItem }           from '../../../@fuse/components/navigation';
import { UserService }                  from '@core/user/user.service';
import { PanelType } from '@shared/components/drawer-listing/panel.type';

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

@Injectable({providedIn: 'root'})
export class PermissionsService {
    private readonly _routePermissions: RoutePermission[] = [];

    constructor(
        @Optional() @Inject(MODULE_PERMISSIONS) modulePermissions: RoutePermission[][] = [],
        userService: UserService
    ) {
        // Collect all registered module permissions
        this._routePermissions = modulePermissions.flat();

        // If not admin, recursively filter permissions for all levels
        if (userService.user?.role.id !== RoleEnum.admin) {
            this._routePermissions = this._filterPermissionsRecursively(this._routePermissions);
        }
    }

    /**
     * Get all permitted routes for a specific role
     */
    getPermittedRoutes(role: RoleEnum): RoutePermission[] {
        // Admin has access to all routes
        if (role === RoleEnum.admin) {
            return this._routePermissions;
        }

        // Filter routes based on allowed roles
        return this._routePermissions
            .filter(route => route.allowedRoles.includes(role) || this._hasPermittedChild(route, role))
            .map(route => ({
                ...route,
                children: route.children?.filter(child =>
                    child.allowedRoles.includes(role) ||
                    (child.children && this._hasPermittedChild(child, role))
                )
            }));
    }

    /**
     * Verify if a route has children with permitted roles
     */
    private _hasPermittedChild(route: RoutePermission, role: RoleEnum): boolean {
        return !!route.children?.some(child =>
            child.allowedRoles.includes(role) ||
            (child.children && this._hasPermittedChild(child, role))
        );
    }

    /**
     * Verify if a user has permission to access a specific route
     */
    hasPermission(path: string, role: RoleEnum): boolean {
        if (role === RoleEnum.admin) return true;

        const findPermission = (routes: RoutePermission[], targetPath: string): boolean => {
            for (const route of routes) {
                if (route.path === targetPath && route.allowedRoles.includes(role)) {
                    return true;
                }
                if (route.children && findPermission(route.children, targetPath)) {
                    return true;
                }
            }
            return false;
        };

        return findPermission(this._routePermissions, path);
    }

    /**
     * Get navigation configuration based on route permissions
     */
    getNavigationConfig(): any[] {
        // Función recursiva para transformar rutas en elementos de navegación
        const transformToNavigationItems = (routes: RoutePermission[], parentPath: string = ''): any[] => {
            return routes
                .filter(route => !route.hideInMainNav)
                .map(route => {
                    const fullPath = parentPath ? `${ parentPath }/${ route.path }` : route.path;

                    const item: FuseNavigationItem = {
                        id           : fullPath,
                        title        : route.title,
                        type         : route.children && route.children.length > 0 ? 'collapsable' : 'basic',
                        icon         : route.icon,
                        requiredRoles: route.allowedRoles,
                        ...route.navOptions
                    };

                    if (route.children && route.children.length > 0) {
                        const visibleChildren = route.children.filter(child => !child.hideInMainNav);

                        if (visibleChildren.length > 0) {
                            item.children = transformToNavigationItems(visibleChildren, fullPath);
                        } else {
                            // Si todos los hijos están ocultos, cambiar el tipo a 'basic'
                            item.type = 'basic';
                            item.link = `/${ fullPath }`;
                        }
                    } else {
                        item.link = `/${ fullPath }`;
                    }

                    return item;
                });
        };

        return transformToNavigationItems(this._routePermissions);
    }

    /**
     * Gets the panels for a specific module and optional submodule
     * @param modulePath The path of the module to get panels from
     * @param subModulePath Optional submodule path to get panels from
     * @returns An array of panels for the specified module and submodule
     */
    getModulePanels(modulePath: string, subModulePath?: string): PanelType[] {
        const modulePermission = this._routePermissions.find(route => route.path === modulePath);

        if (!modulePermission || !modulePermission.children) {
            return [];
        }

        // Recirsive function to find a node by its path
        const findNodeByPath = (nodes: RoutePermission[], path: string[]): RoutePermission | null => {
            if (path.length === 0) return null;

            const currentSegment = path[0];
            const node = nodes.find(n => n.path === currentSegment);

            if (!node) return null;
            if (path.length === 1) return node;

            return node.children ? findNodeByPath(node.children, path.slice(1)) : null;
        };

        const buildPanelsFromNode = (node: RoutePermission, parentPath: string[] = []): PanelType[] => {
            if (!node.children) return [];

            return node.children.map(child => {
                let linkPath;

                // If the parent path is empty, use the module path as the base
                if (parentPath.length === 0 || parentPath[0] !== '/') {
                    linkPath = [ '/', ...parentPath, child.path ];
                } else {
                    // Otherwise, build the link path from the parent path and child path
                    linkPath = [ ...parentPath, child.path ];
                }

                return {
                    id           : child.path,
                    title        : child.title,
                    description  : child.description,
                    icon         : child.icon,
                    selectedIcon : child.selectedIcon,
                    link         : linkPath,
                    requiredRoles: child.allowedRoles,
                    hasChildren: !!(child.children && child.children.length > 0),
                    children   : child.children ? buildPanelsFromNode(child, linkPath) : [],
                };
            });
        };

        // If a submodule path is provided, find the corresponding node
        if (subModulePath) {
            // Split the submodule path into segments
            const pathSegments = subModulePath.split('/');

            // Find the starting node based on the first segment
            const startNode = modulePermission.children.find(c => c.path === pathSegments[0]);

            if (!startNode) return [];

            if (pathSegments.length === 1) {
                return buildPanelsFromNode(startNode, [ modulePath, startNode.path ]);
            } else {
                // There is multiple segments, find the target node
                const targetNode = findNodeByPath(
                    startNode.children || [],
                    pathSegments.slice(1)
                );

                if (!targetNode) return [];

                // Build the full path for the link
                const fullPath = [ modulePath, ...pathSegments ];
                return buildPanelsFromNode(targetNode, fullPath);
            }
        }

        // If no submodule path is provided, build panels from the main module
        return buildPanelsFromNode(modulePermission, [ modulePath ]);
    }

    /**
     * Recursively filters route permissions to include only those with allowed roles
     * Ensures the permissions tree is properly pruned at all levels
     * @param routes Array of route permissions to filter
     * @returns Filtered array of route permissions
     * @private
     */
    private _filterPermissionsRecursively(routes: RoutePermission[]): RoutePermission[] {
        return routes
            .filter(route => route.allowedRoles && route.allowedRoles.length > 0)
            .map(route => {
                // If it has children, filter them recursively too
                if (route.children && route.children.length > 0) {
                    const filteredChildren = this._filterPermissionsRecursively(route.children);
                    return {
                        ...route,
                        children: filteredChildren.length > 0 ? filteredChildren : undefined
                    };
                }
                return route;
            });
    }
}
