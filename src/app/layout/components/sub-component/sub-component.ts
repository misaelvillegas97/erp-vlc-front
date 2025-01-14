import { Component, OnDestroy } from '@angular/core';
import { Subject }              from 'rxjs';

@Component({
    selector   : 'sub-component',
    standalone : true,
    imports    : [],
    templateUrl: './sub-component.html'
})
export class SubComponent implements OnDestroy {
    _unsubscribeAll: Subject<any> = new Subject<any>();

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

}
