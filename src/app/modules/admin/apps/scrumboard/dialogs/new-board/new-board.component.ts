import { Component, OnInit }                                                     from '@angular/core';
import { CdkTextareaAutosize }                                                   from '@angular/cdk/text-field';
import { MatError, MatFormField, MatLabel }                                      from '@angular/material/form-field';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatInput }                                                              from '@angular/material/input';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatButton, MatIconButton }                                              from '@angular/material/button';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { AsyncPipe, NgIf }                                                       from '@angular/common';
import { Notyf }                                                                 from 'notyf';
import { MatDialogClose, MatDialogRef }                                          from '@angular/material/dialog';
import { MatOption }                                                             from '@angular/material/autocomplete';
import { ScrumboardService }                                                     from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { BehaviorSubject, map, take, takeUntil, withLatestFrom }                 from 'rxjs';
import { SubComponent }                                                          from '@layout/components/sub-component/sub-component';
import { MatSelect, MatSelectTrigger }                                           from '@angular/material/select';
import { takeUntilDestroyed }                                                    from '@angular/core/rxjs-interop';
import { UserService }                                                           from '@core/user/user.service';
import { User }                                                                  from '@core/user/user.types';

@Component({
    selector   : 'app-new-board',
    standalone : true,
    imports    : [
        CdkTextareaAutosize,
        MatLabel,
        MatFormField,
        ReactiveFormsModule,
        MatInput,
        MatIcon,
        MatIconButton,
        MatButton,
        MatProgressSpinner,
        NgIf,
        MatError,
        MatOption,
        MatDialogClose,
        MatSelect,
        AsyncPipe,
        MatSelectTrigger,
    ],
    templateUrl: './new-board.component.html'
})
export class NewBoardComponent extends SubComponent implements OnInit {
    form: UntypedFormGroup;
    notyf = new Notyf();

    constructor(
        public readonly _matDialogRef: MatDialogRef<NewBoardComponent>,
        private readonly _formBuilder: UntypedFormBuilder,
        private readonly _scrumboardService: ScrumboardService,
        private readonly _memberService: UserService,
        private readonly _userService: UserService
    ) {
        super();

        this._memberService.findAll()
            .pipe(
                takeUntilDestroyed(),
                map(({data}) => data),
                withLatestFrom(this._userService.user$),
                map(([ members, me ]) => members.filter(member => member.id !== me.id))
            )
            .subscribe({
                next : (members: User[]) => this._members$.next(members),
                error: () => this._members$.next([])
            });
    }

    private _members$: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);

    get members$() {
        return this._members$.asObservable();
    }

    ngOnInit() {
        this.form = this._formBuilder.group({
            title      : [ '', Validators.required ],
            description: [ '', Validators.required ],
            members    : [ undefined, Validators.required ]
        });
    }

    submit() {
        console.log('submit');
        if (this.form.invalid) {
            this.notyf.error('Please fill all required fields');
            return;
        }

        this.form.disable();

        const form = this.form.getRawValue();

        form.members = form.members.map((member) => member.id);


        this._scrumboardService.createBoard({
            ...form,
            icon: 'heroicons_outline:building-office-2'
        })
            .pipe(
                takeUntil(this._unsubscribeAll),
                take(1)
            )
            .subscribe({
                next : (result) => {
                    this.notyf.success('Board created successfully');
                    this._matDialogRef.close();
                },
                error: (error) => {
                    this.notyf.error('Error creating board');
                    this.form.enable();
                }
            });
    }
}
