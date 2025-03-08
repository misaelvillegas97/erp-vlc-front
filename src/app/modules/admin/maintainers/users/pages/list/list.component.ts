import { Component, inject, resource }                         from '@angular/core';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatTooltip }                                          from '@angular/material/tooltip';
import { RouterLink }                                          from '@angular/router';
import { MatIcon }                                             from '@angular/material/icon';
import { MatIconAnchor, MatIconButton }                        from '@angular/material/button';
import { MatFormFieldModule }                                  from '@angular/material/form-field';
import { MatInput }                                            from '@angular/material/input';
import { FormControl, ReactiveFormsModule }                    from '@angular/forms';
import { User }                                                from '@core/user/user.types';
import { UserService }                                         from '@core/user/user.service';
import { FuseConfirmationService }                             from '../../../../../../../@fuse/services/confirmation';
import { toSignal }                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                        from 'rxjs';
import { MatTableModule }                                      from '@angular/material/table';
import { trackByFn }                                           from '@libs/ui/utils/utils';
import { DisplayRolesPipe }                                    from '@shared/directives/display-roles.directive';
import { DatePipe }                                            from '@angular/common';

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
        DisplayRolesPipe,
        DatePipe
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #fuseConfirmationService = inject(FuseConfirmationService);
    readonly #userService = inject(UserService);
    readonly #ts = inject(TranslocoService);

    readonly displayedColumns: (keyof User | 'actions')[] = [ 'name', 'email', 'role', 'createdAt', 'actions' ];

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
    protected readonly trackByFn = trackByFn;

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
}
