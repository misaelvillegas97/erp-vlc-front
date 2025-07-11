import { Component }                                                             from '@angular/core';
import { TranslocoDirective, TranslocoPipe }                                     from '@ngneat/transloco';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatInput }                                                              from '@angular/material/input';
import { CdkTextareaAutosize }                                                   from '@angular/cdk/text-field';
import { ScrumboardService }                                                     from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatButton }                                                             from '@angular/material/button';
import { first, take }                                                           from 'rxjs';
import { Notyf }                                                                 from 'notyf';

@Component({
    selector   : 'app-information',
    standalone : true,
    imports    : [
        TranslocoDirective,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,
        CdkTextareaAutosize,
        MatProgressSpinner,
        MatIcon,
        MatButton,
        TranslocoPipe
    ],
    templateUrl: './information.component.html'
})
export class InformationComponent {
    form: UntypedFormGroup;
    boardId: string;

    private readonly _notyf = new Notyf();

    constructor(
        private readonly _fb: UntypedFormBuilder,
        private readonly _boardService: ScrumboardService
    ) {
        this._buildForm();

        this._boardService.board$
            .pipe(first())
            .subscribe((board) => {
                this.boardId = board.id;
                this.form.patchValue(board);
            });
    }

    submit() {
        if (this.form.invalid)
            return;

        this.form.disable();

        this._boardService.updateBoard(this.boardId, this.form.value)
            .pipe(take(1))
            .subscribe({
                next : () => {
                    this.form.reset(this.form.value);
                    this.form.markAsPristine();
                    this.form.enable();

                    this._notyf.success('Board information updated successfully');
                },
                error: () => {
                    this.form.enable();
                }
            });
    }

    private _buildForm() {
        this.form = this._fb.group({
            title      : [ '', Validators.required ],
            description: [ '', Validators.required ],
            icon       : [ '', Validators.required ]
        });
    }
}
