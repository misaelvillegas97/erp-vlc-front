import { Component }    from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector  : 'app-checklists',
    standalone: true,
    imports   : [ RouterOutlet ],
    template  : '<router-outlet></router-outlet>'
})
export class ChecklistsComponent {}
