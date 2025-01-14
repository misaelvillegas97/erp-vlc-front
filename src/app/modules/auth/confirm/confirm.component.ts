import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterLink }           from '@angular/router';
import { fuseAnimations }                               from '@fuse/animations';
import { TranslocoDirective, TranslocoPipe }            from '@ngneat/transloco';
import { HttpClient }                                   from '@angular/common/http';
import { take }                                         from 'rxjs';

@Component({
    selector     : 'auth-confirmation-required',
    templateUrl  : './confirm.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [ RouterLink, TranslocoDirective, TranslocoPipe ],
})
export class AuthConfirmComponent implements OnInit {
    private _httpClient: HttpClient = inject(HttpClient);
    private _route: ActivatedRoute = inject(ActivatedRoute);
    private _router: Router = inject(Router);

    /**
     * Constructor
     */
    constructor() {
    }

    ngOnInit() {
        const token = this._route.snapshot.params.token;
        this._httpClient.post('api/auth/confirm-email', {confirmationToken: token})
            .pipe(take(1))
            .subscribe(() => this._router.navigate([ '/sign-in' ]));
    }
}
