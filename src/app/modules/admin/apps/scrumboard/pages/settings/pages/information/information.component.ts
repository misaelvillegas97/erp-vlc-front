import { ChangeDetectionStrategy, Component, effect, inject, signal }            from '@angular/core';
import { TranslocoDirective, TranslocoPipe }                                     from '@ngneat/transloco';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule }                                                    from '@angular/material/form-field';
import { MatInput }                                                              from '@angular/material/input';
import { CdkTextareaAutosize }                                                   from '@angular/cdk/text-field';
import { ScrumboardService }                                                     from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { MatProgressSpinner }                                                    from '@angular/material/progress-spinner';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatButton }                                                             from '@angular/material/button';
import { take }                                                                  from 'rxjs';
import { Notyf }                                                                 from 'notyf';
import { Board }                                                                 from '@modules/admin/apps/scrumboard/models/scrumboard.models';

@Component({
    selector       : 'app-information',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
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
    templateUrl    : './information.component.html'
})
export class InformationComponent {
    readonly #boardService = inject(ScrumboardService);
    readonly #fb = inject(UntypedFormBuilder);
    readonly #notyf = new Notyf();

    // Signals for reactive state management
    board = signal<Board | null>(null);
    boardId = signal<string | null>(null);
    isLoading = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);
    error = signal<string | null>(null);

    // Form
    form: UntypedFormGroup;

    constructor() {
        // Initialize form
        this.form = this.#fb.group({
            title      : [ '', Validators.required ],
            description: [ '', Validators.required ],
            icon       : [ '', Validators.required ]
        });

        // Effect to update form when board changes
        effect(() => {
            const currentBoard = this.#boardService.board();
            if (currentBoard && this.form) {
                this.form.patchValue({
                    title      : currentBoard.title || '',
                    description: currentBoard.description || '',
                    icon       : currentBoard.icon || ''
                });
                this.boardId.set(currentBoard.id);
                this.board.set(currentBoard);
                this.isLoading.set(false);
            }
        });
    }

    submit(): void {
        if (this.form.invalid || this.isSubmitting()) {
            return;
        }

        const currentBoardId = this.boardId();
        if (!currentBoardId) {
            this.#notyf.error('Board ID not available');
            return;
        }

        this.isSubmitting.set(true);
        this.form.disable();

        this.#boardService.updateBoard(currentBoardId, this.form.value)
            .pipe(take(1))
            .subscribe({
                next : () => {
                    this.form.reset(this.form.value);
                    this.form.markAsPristine();
                    this.form.enable();
                    this.isSubmitting.set(false);

                    this.#notyf.success('Board information updated successfully');
                },
                error: (err) => {
                    this.form.enable();
                    this.isSubmitting.set(false);
                    this.#notyf.error('Error updating board information');
                    console.error('Error updating board:', err);
                }
            });
    }
}
