import { Component, input } from '@angular/core';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { RouterLink }       from '@angular/router';

@Component({
    selector: 'scrumboard-board-navigation',
    template: `
        <div class="relative z-10 flex flex-0 flex-col backdrop-blur-md bg-white/10 border-b border-white/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
            <!-- Title -->
            <div class="min-w-0 flex-1 space-x-4 flex">
                <a [routerLink]="'../'" mat-icon-button>
                    <mat-icon [svgIcon]="'heroicons_outline:chevron-left'"></mat-icon>
                </a>
                <h2 class="truncate text-3xl font-extrabold leading-7 tracking-tight sm:leading-10 md:text-4xl text-white drop-shadow-lg">
                    {{ boardTitle() }}
                </h2>
            </div>
            <!-- Actions -->
            <div class="mt-6 flex shrink-0 items-center sm:ml-4 sm:mt-0">
                <a [routerLink]="['./..']" mat-stroked-button>
                    <mat-icon
                        [svgIcon]="'heroicons_solid:view-columns'"
                        class="icon-size-5"
                    ></mat-icon>
                    <span class="ml-2">Tableros</span>
                </a>
                <a [routerLink]="['./settings']" class="ml-3" mat-stroked-button>
                    <mat-icon
                        [svgIcon]="'heroicons_solid:cog-8-tooth'"
                        class="icon-size-5"
                    ></mat-icon>
                    <span class="ml-2">Configuración</span>
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
