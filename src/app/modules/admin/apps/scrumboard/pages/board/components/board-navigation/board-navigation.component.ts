import { Component, input } from '@angular/core';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { RouterLink }       from '@angular/router';

@Component({
    selector: 'scrumboard-board-navigation',
    template: `
        <div class="relative z-10 flex flex-0 flex-col backdrop-blur-md bg-white/10 border-b border-white/20 p-4 sm:p-6 lg:px-10 lg:py-8 sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <!-- Title -->
            <div class="min-w-0 flex-1 flex items-center gap-2 sm:gap-4">
                <a [routerLink]="'../'" mat-icon-button class="!w-10 !h-10 sm:!w-9 sm:!h-9 flex-shrink-0">
                    <mat-icon [svgIcon]="'heroicons_outline:chevron-left'" class="!text-lg sm:!text-base text-white"></mat-icon>
                </a>
                <h2 class="truncate text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold leading-tight sm:leading-7 lg:leading-10 tracking-tight text-white drop-shadow-lg">
                    {{ boardTitle() }}
                </h2>
            </div>
            <!-- Actions -->
            <div class="flex shrink-0 items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:ml-4 mt-0">
                <a [routerLink]="['./..']" mat-stroked-button class="!min-h-[40px] sm:!min-h-[36px] !text-sm sm:!text-base flex-1 sm:flex-initial">
                    <mat-icon
                        [svgIcon]="'heroicons_solid:view-columns'"
                        class="!text-base sm:!text-sm"
                    ></mat-icon>
                    <span class="ml-1 sm:ml-2 hidden sm:inline">Tableros</span>
                    <span class="ml-1 sm:hidden">Boards</span>
                </a>
                <a [routerLink]="['./settings']" mat-stroked-button class="!min-h-[40px] sm:!min-h-[36px] !text-sm sm:!text-base flex-1 sm:flex-initial">
                    <mat-icon
                        [svgIcon]="'heroicons_solid:cog-8-tooth'"
                        class="!text-base sm:!text-sm"
                    ></mat-icon>
                    <span class="ml-1 sm:ml-2 hidden sm:inline">Configuración</span>
                    <span class="ml-1 sm:hidden">Config</span>
                </a>
            </div>
        </div>
    `,
    imports : [
        MatButtonModule,
        MatIconModule,
        RouterLink
    ]
})
export class ScrumboardBoardNavigationComponent {
    // Inputs
    boardTitle = input<string>('');
}
