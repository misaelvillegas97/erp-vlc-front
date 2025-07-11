import { AsyncPipe }                                                             from '@angular/common';
import { Component, inject }                                                     from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButton, MatIconButton }                                              from '@angular/material/button';
import { MatFormField }                                                          from '@angular/material/form-field';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatInput }                                                              from '@angular/material/input';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { MatTooltip }                                                            from '@angular/material/tooltip';

import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';
import { BehaviorSubject, firstValueFrom }   from 'rxjs';

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
    readonly #boardService = inject(ScrumboardService);
    readonly #fb = inject(UntypedFormBuilder);

    board: Board;
    deleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    form: UntypedFormGroup = this.#fb.group({
        title: [ '', Validators.required ],
    });

    protected readonly trackByFn = trackByFn;

    submit() {
        if (this.form.invalid) return;

        this.form.disable();

        firstValueFrom(this.#boardService.addLabel(this.board.id, this.form.getRawValue()))
            .then((label: Label) => {
                this.board.labels.push(label);
                this.form.enable();
                this.form.reset();
            })
            .catch(() => {
                this.form.enable();
            });
    }

    remove(label: Label) {
        this.deleting$.next(true);

        firstValueFrom(this.#boardService.removeLabel(this.board.id, label.id))
            .then(() => {
                this.board.labels = this.board.labels.filter(l => l.id !== label.id);
                this.deleting$.next(false);
            })
            .catch(() => {
                this.deleting$.next(false);
            });
    }
}
