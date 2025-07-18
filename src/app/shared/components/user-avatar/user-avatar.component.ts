import { Component, input } from '@angular/core';
import { MatTooltip }       from '@angular/material/tooltip';

@Component({
    selector   : 'user-avatar',
    imports    : [ MatTooltip ],
    templateUrl: './user-avatar.component.html'
})
export class UserAvatarComponent {
    readonly name = input.required<string>();
    readonly avatar = input<string | null>(null);
    readonly tooltip = input<string | null>(null);

    /**
     * Get user initial for avatar fallback
     */
    getUserInitial(name: string): string {
        if (!name || name.trim().length === 0) {
            return '?';
        }
        return name.trim().charAt(0).toUpperCase();
    }
}
