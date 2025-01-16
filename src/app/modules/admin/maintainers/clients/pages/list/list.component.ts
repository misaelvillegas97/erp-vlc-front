import { Component, OnInit }            from '@angular/core';
import { MatIconAnchor, MatIconButton } from '@angular/material/button';
import { MatDialog }                    from '@angular/material/dialog';
import { MatDivider }                   from '@angular/material/divider';
import { MatFormFieldModule }           from '@angular/material/form-field';
import { MatIcon }                      from '@angular/material/icon';
import { MatInputModule }               from '@angular/material/input';
import { MatTooltip }                   from '@angular/material/tooltip';

import { TranslocoDirective, TranslocoService } from '@ngneat/transloco';
import { Notyf }                                from 'notyf';

import { FuseConfirmationService }                                                            from '@fuse/services/confirmation';
import { PageHeaderComponent }                                                                from '@layout/components/page-header/page-header.component';
import { Table }                                                                              from '@shared/components/table/table.component';
import { BehaviorSubject, debounceTime, distinctUntilChanged, mergeMap, of, switchMap, take } from 'rxjs';
import { takeUntilDestroyed }                                                                 from '@angular/core/rxjs-interop';
import { AsyncPipe, DatePipe, JsonPipe }                                                      from '@angular/common';
import { MatTableModule }                                                                     from '@angular/material/table';
import { MatSort, MatSortHeader }                                                             from '@angular/material/sort';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators }                          from '@angular/forms';
import { Client }                                                                             from '@modules/admin/maintainers/clients/domain/model/client';
import { ClientService }                                                                      from '@modules/admin/maintainers/clients/client.service';
import { RouterLink }                                                                         from '@angular/router';

@Component({
    selector   : 'app-list',
    standalone : true,
    imports    : [
        PageHeaderComponent,
        TranslocoDirective,
        MatIcon,
        MatIconAnchor,
        MatTooltip,
        MatFormFieldModule,
        MatIconButton,
        MatInputModule,
        MatTableModule,
        MatDivider,
        Table,
        AsyncPipe,
        JsonPipe,
        DatePipe,
        MatSortHeader,
        MatSort,
        ReactiveFormsModule,
        RouterLink,
    ],
    templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
    public clients$: BehaviorSubject<Client[]> = new BehaviorSubject<Client[]>(null);
    public readonly displayedColumns: string[] = [ 'businessName', 'fantasyName', 'code', 'email', 'phone', 'actions' ];
    public searchControl = new FormControl(undefined, [ Validators.minLength(3), Validators.maxLength(100) ]);
    private _notyf = new Notyf();

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _fuseConfirmationService: FuseConfirmationService,
        private readonly _clientService: ClientService,
        private readonly _translationService: TranslocoService,
        private readonly _matDialog: MatDialog,
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
                    if (!value) return this._clientService.getAll();
                    else if (value.length >= 3 && value.length < 100) return this._clientService.getAll(value);
                    else return of('invalid');
                })
            )
            .subscribe();
    }
}
