import { Component, OnInit }                            from '@angular/core';
import { takeUntilDestroyed }                           from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconAnchor, MatIconButton }                 from '@angular/material/button';
import { MatFormFieldModule }                           from '@angular/material/form-field';
import { MatIcon }                                      from '@angular/material/icon';
import { MatInputModule }                               from '@angular/material/input';
import { MatTableModule }                               from '@angular/material/table';
import { MatTooltip }                                   from '@angular/material/tooltip';
import { RouterLink }                                   from '@angular/router';

import { TranslocoDirective, TranslocoService }                                               from '@ngneat/transloco';
import { Notyf }                                                                              from 'notyf';
import { BehaviorSubject, debounceTime, distinctUntilChanged, mergeMap, of, switchMap, take } from 'rxjs';

import { FuseConfirmationService }              from '@fuse/services/confirmation';
import { PageHeaderComponent }                  from '@layout/components/page-header/page-header.component';
import { Table }                                from '@shared/components/table/table.component';
import { Client }                               from '@modules/admin/maintainers/clients/domain/model/client';
import { ClientService }                        from '@modules/admin/maintainers/clients/client.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector   : 'app-list',
    standalone : true,
    imports: [
        PageHeaderComponent,
        TranslocoDirective,
        MatIcon,
        MatIconAnchor,
        MatTooltip,
        MatFormFieldModule,
        MatIconButton,
        MatInputModule,
        MatTableModule,
        Table,
        ReactiveFormsModule,
        RouterLink,
        MatMenu,
        MatMenuItem,
        MatMenuTrigger
    ],
    templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
    public clients$: BehaviorSubject<Client[]> = new BehaviorSubject<Client[]>(null);
    public readonly displayedColumns: string[] = [ 'businessName', 'fantasyName', 'code', 'email', 'phone', 'actions' ];
    public searchControl = new FormControl(undefined, [ Validators.minLength(3), Validators.maxLength(100) ]);
    private _notyf = new Notyf();

    constructor(
        private readonly _fuseConfirmationService: FuseConfirmationService,
        private readonly _clientService: ClientService,
        private readonly _translationService: TranslocoService,
    ) {
        this._subscribeToSearchControl();
        this._clientService.clients$
            .pipe(takeUntilDestroyed())
            .subscribe((clients) => this.clients$.next(clients));
    }

    ngOnInit() {}

    openDeleteDialog(client: Client): void {
        const confirmation = this._fuseConfirmationService.open({
            title  : this._translationService.translate('modal.delete-confirmation.title'),
            message: this._translationService.translate('modal.delete-confirmation.message'),
            actions: {
                confirm: {
                    label: this._translationService.translate('modal.delete-confirmation.confirm'),
                },
                cancel : {
                    label: this._translationService.translate('modal.delete-confirmation.cancel'),
                }
            },
        });

        confirmation.afterClosed()
            .pipe(
                take(1),
                mergeMap((result) => result === 'confirmed' ? this._clientService.delete(client.id) : of(null))
            )
            .subscribe();
    }

    private _subscribeToSearchControl() {
        this.searchControl.valueChanges
            .pipe(
                takeUntilDestroyed(),
                debounceTime(1000),
                distinctUntilChanged(),
                switchMap((value) => {
                    value = value.trim();
                    if (!value) return this._clientService.findAll();
                    else if (value.length >= 3 && value.length < 100) return this._clientService.findAll(value);
                    else return of('invalid');
                })
            )
            .subscribe();
    }
}
