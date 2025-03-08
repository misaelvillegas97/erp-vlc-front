import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'displayRoles'})
export class DisplayRolesPipe implements PipeTransform {
    transform(roles: { id: string, role: { id: number; name: string } }[]): string {
        if (!roles || roles.length === 0) {
            return '';
        }
        if (roles.length === 1) {
            return roles[0].role.name;
        }
        if (roles.length === 2) {
            return roles.map(r => r.role.name).join(', ');
        }
        // Para más de dos roles: mostramos los dos primeros y el resto como "+ N"
        const firstTwo = roles.slice(0, 2).map(r => r.role.name).join(', ');
        const extraCount = roles.length - 2;
        return `${ firstTwo } + ${ extraCount }`;
    }
}
