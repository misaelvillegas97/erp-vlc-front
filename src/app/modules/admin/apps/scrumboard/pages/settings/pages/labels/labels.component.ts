import { AsyncPipe }                                                             from '@angular/common';
import { Component }                                                             from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButton, MatIconButton }                                              from '@angular/material/button';
import { MatFormField }                                                          from '@angular/material/form-field';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatInput }                                                              from '@angular/material/input';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { MatTooltip }                                                            from '@angular/material/tooltip';

import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';
import { BehaviorSubject, take }             from 'rxjs';

import { trackByFn }         from '@libs/ui/utils/utils';
import { Board, Label }      from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService } from '@modules/admin/apps/scrumboard/services/scrumboard.service';

@Component({
    selector   : 'app-labels',
    standalone : true,
    imports    : [
        ReactiveFormsModule,
        MatFormField,
        MatInput,
        MatProgressSpinner,
        MatIcon,
        MatButton,
        TranslocoPipe,
        TranslocoDirective,
        MatTooltip,
        AsyncPipe,
        MatIconButton
    ],
    templateUrl: './labels.component.html'
})
export class LabelsComponent {
    board: Board;
    deleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    form: UntypedFormGroup;

    protected readonly trackByFn = trackByFn;

    constructor(
        private readonly _fb: UntypedFormBuilder,
        private readonly _boardService: ScrumboardService
    ) {
        this.form = this._fb.group({
            title: [ '', Validators.required ],
        });

        this._boardService.board$
            .pipe(take(1))
            .subscribe((board) => {
                this.board = board;
            });
    }

    submit() {
        if (this.form.invalid) return;

        this.form.disable();

        this._boardService.addLabel(this.board.id, this.form.getRawValue())
            .pipe(take(1))
            .subscribe({
                next : () => {
                    this.form.enable();
                    this.form.reset();
                },
                error: () => {
                    this.form.enable();
                }
            });
    }

    remove(label: Label) {
        this.deleting$.next(true);

        this._boardService.removeLabel(this.board.id, label.id)
            .pipe(take(1))
            .subscribe({
                next : () => {
                    this.deleting$.next(false);
                },
                error: () => {
                    this.deleting$.next(false);
                }
            });
    }
}
