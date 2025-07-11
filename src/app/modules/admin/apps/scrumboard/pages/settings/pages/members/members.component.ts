import { AsyncPipe }                                                             from '@angular/common';
import { Component, computed, DestroyRef, inject, signal }                       from '@angular/core';
import { toSignal }                                                              from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption }                    from '@angular/material/autocomplete';
import { MatButton, MatIconButton }                                              from '@angular/material/button';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatInput }                                                              from '@angular/material/input';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { MatTooltip }                                                            from '@angular/material/tooltip';

import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';
import { Notyf }                             from 'notyf';
import { BehaviorSubject, firstValueFrom }   from 'rxjs';

import { UserService }                  from '@core/user/user.service';
import { displayWithFn, filterByValue } from '@core/utils';
import { fuseAnimations }               from '@fuse/animations';
import { trackByFn }                    from '@libs/ui/utils/utils';
import { Board, Member }                from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService }            from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { User }                         from '@core/user/user.types';

@Component({
    selector   : 'app-members',
    standalone : true,
    imports    : [
        ReactiveFormsModule,
        MatFormFieldModule,
        TranslocoDirective,
        MatAutocompleteTrigger,
        MatAutocomplete,
        MatOption,
        AsyncPipe,
        MatInput,
        MatIcon,
        MatButton,
        MatIconButton,
        MatTooltip,
        TranslocoPipe,
        MatProgressSpinner
    ],
    animations : fuseAnimations,
    templateUrl: './members.component.html',
})
export class MembersComponent {
    readonly #fb = inject(UntypedFormBuilder);

    board = signal<Board>(undefined);
    deleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    form: UntypedFormGroup = this.#fb.group({
        member: [ '', Validators.required ]
    });

    protected readonly trackByFn = trackByFn;
    protected readonly displayWithFn = displayWithFn<Member>;
    private readonly _destroy: DestroyRef = inject(DestroyRef);
    private _notyf = new Notyf();

    constructor(
        private readonly _userService: UserService,
        private readonly _boardService: ScrumboardService
    ) {}

    filterField = toSignal<string>(this.form.get('member').valueChanges);

    availableMembers = signal<User[]>([]);
    filteredMembers = computed(() => {
        let availableMembers = this.availableMembers();
        const loggedUser = this._userService.userSignal();
        const filterFieldValue = this.filterField();

        if (!this.availableMembers().length) {
            return [];
        }

        if (filterFieldValue) availableMembers = filterByValue<User>(availableMembers, filterFieldValue, 'name');

        return availableMembers.filter(member => member.id !== loggedUser.id);
    });

    public addMember() {
        if (this.form.invalid) return;

        this.form.disable();
        const member = this.form.value.member;

        firstValueFrom(this._boardService.addMember(this.board().id, member.id))
            .then(() => {
                this._notyf.success(`Member added successfully`);
                this.form.reset();
                this.form.markAsPristine();
                this.form.enable();
            })
            .catch((error) => {
                this._notyf.error(`Error adding member: ${ error }`);
                this.form.enable();
            });
    }

    public deleteMember(memberId: string) {
        this.deleting$.next(true);

        firstValueFrom(this._boardService.removeMember(this.board().id, memberId))
            .then(() => {
                this._notyf.success(`Member removed successfully`);
                this.deleting$.next(false);
            })
            .catch((error) => {
                this._notyf.error(`Error removing member: ${ error }`);
                this.deleting$.next(false);
            });
    }
}
