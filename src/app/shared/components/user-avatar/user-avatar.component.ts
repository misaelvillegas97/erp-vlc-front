import { Component, Input } from '@angular/core';
import { NgClass }          from '@angular/common';
import { User }             from '@core/user/user.types';

@Component({
    selector   : 'user-avatar',
    standalone : true,
    imports    : [
        NgClass
    ],
    templateUrl: './user-avatar.component.html',
    styles     : `
        :host {
            display: flex;
            align-items: center;
        }
    `
})
export class UserAvatarComponent {
    @Input() user: User;
    @Input() avatarClass: string[] = [];
    @Input() showName: boolean = false;
}
