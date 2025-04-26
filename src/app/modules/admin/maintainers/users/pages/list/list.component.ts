import { Component, inject, resource, Signal, signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                 from '@ngneat/transloco';
import { MatTooltip }                                                                          from '@angular/material/tooltip';
import { RouterLink }                                                                          from '@angular/router';
import { MatIcon }                                                                             from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                                                        from '@angular/material/button';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { MatInput }                                                                            from '@angular/material/input';
import { FormControl, ReactiveFormsModule }                                                    from '@angular/forms';
import { User }                                                                                from '@core/user/user.types';
import { UserService }                                                                         from '@core/user/user.service';
import { FuseConfirmationService }                                                             from '../../../../../../../@fuse/services/confirmation';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { MatTableModule }                                                                      from '@angular/material/table';
import { trackByFn }                                                                           from '@libs/ui/utils/utils';
import { TableBuilderComponent }                                                               from '@shared/components/table-builder/table-builder.component';
import { MatDialog }                                                                           from '@angular/material/dialog';
import { DriverLicenseDialogComponent }                                                        from '../../dialog/driver-license/driver-license.component';
import { ColumnConfig }                                                                        from '@shared/components/table-builder/column.type';

@Component({
    selector   : 'app-list',
    imports: [
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIcon,
        MatIconAnchor,
        MatFormFieldModule,
        MatInput,
        ReactiveFormsModule,
        MatTableModule,
        MatIconButton,
        TranslocoPipe,
        TableBuilderComponent
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #fuseConfirmationService = inject(FuseConfirmationService);
    readonly #userService = inject(UserService);
    readonly #ts = inject(TranslocoService);
    readonly #dialog = inject(MatDialog);

    searchControl = new FormControl<string>(undefined);
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});

    usersResource = resource({
        request: () => this.searchControlSignal(),
        loader: () => {
            let query = {};

            if (this.searchControlSignal().trim().length > 0)
                query = {query: this.searchControlSignal().trim()};

            return firstValueFrom(this.#userService.findByQuery(query));
        },
    });

    readonly actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell');
    columnsConfig: WritableSignal<ColumnConfig<User>[]> = signal(undefined);

    protected readonly trackByFn = trackByFn;

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    remove = (user: User) => {
        const dialog = this.#fuseConfirmationService.open({
            title  : this.#ts.translate('modal.delete-confirmation.title'),
            message: this.#ts.translate('modal.delete-confirmation.message'),
            actions: {
                confirm: {label: this.#ts.translate('modal.delete-confirmation.confirm')},
                cancel : {label: this.#ts.translate('modal.delete-confirmation.cancel')}
            },
        });

        dialog
            .afterClosed()
            .subscribe((result) => result === 'confirmed' && this.#userService.remove(user.id).subscribe(() => this.usersResource.reload()));
    };

    assignDriverLicense = (user: User) => {
        const dialogRef = this.#dialog.open(DriverLicenseDialogComponent, {
            width: '500px',
            data : {user}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.usersResource.reload();
            }
        });
    };

    buildColumnsConfig = (): ColumnConfig<User>[] => [
        {key: 'name', header: this.#ts.translate('maintainers.users.fields.name'), visible: true, display: {type: 'text'}},
        {key: 'email', header: this.#ts.translate('maintainers.users.fields.email'), visible: true, display: {type: 'text'}},
        {
            key    : 'role',
            header : this.#ts.translate('maintainers.users.fields.role'),
            visible: true,
            display: {
                type     : 'text',
                formatter: (value: User['role']) => value.name
            }
        },
        {key: 'createdAt', header: this.#ts.translate('maintainers.users.fields.created-at'), visible: true, display: {type: 'text'}},
        {
            key    : 'actions',
            header : this.#ts.translate('maintainers.users.fields.actions'),
            visible: true,
            display: {
                type          : 'custom',
                customTemplate: this.actionsCell()
            }
        }
    ];
}
