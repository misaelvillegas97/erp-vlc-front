import { RoleEnum } from '@core/user/role.type';

export interface PanelType {
    id?: string,
    icon?: string,
    selectedIcon?: string,
    title: string,
    description?: string,
    link?: string | Array<string>,
    disabled?: boolean,
    children?: PanelType[],
    requiredRoles?: RoleEnum[]
}
