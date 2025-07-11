import { TextFieldModule }                                                                                                                               from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgStyle, NgSwitch, NgSwitchCase }                                                                                            from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild, ViewEncapsulation, } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators, }                                                           from '@angular/forms';
import { MatButtonModule }                                                                                                                               from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule, }                                                                                                         from '@angular/material/checkbox';
import { MatDatepickerModule }                                                                                                                           from '@angular/material/datepicker';
import { MatDialogRef }                                                                                                                                  from '@angular/material/dialog';
import { MatFormFieldModule }                                                                                                                            from '@angular/material/form-field';
import { MatIconModule }                                                                                                                                 from '@angular/material/icon';
import { MatInputModule }                                                                                                                                from '@angular/material/input';
import { Board, Card, Label, Member, Checklist, ChecklistItem, Comment, Attachment, CustomField }                                                        from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService }                                                                                                                             from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { assign }                                                                                                                                        from 'lodash-es';
import { DateTime }                                                                                                                                      from 'luxon';
import { debounceTime, distinctUntilChanged, lastValueFrom, Subject, takeUntil, tap }                                                                    from 'rxjs';
import { UserService }                                                                                                                                   from '@core/user/user.service';
import { MatSelectModule }                                                                                                                               from '@angular/material/select';

@Component({
    selector       : 'scrumboard-card-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [
        MatButtonModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        TextFieldModule,
        NgClass,
        MatDatepickerModule,
        MatCheckboxModule,
        DatePipe,
        NgStyle,
        MatSelectModule,
        NgSwitch,
        NgSwitchCase
    ],
})
export class ScrumboardCardDetailsComponent implements OnInit, OnDestroy {
    readonly #userService = inject(UserService);

    @ViewChild('labelInput') labelInput: ElementRef<HTMLInputElement>;
    board = signal<Board>(undefined);
    card = signal<Card>(undefined);
    labels = signal<Label[]>(undefined);
    filteredLabels = signal<Label[]>(undefined);
    members = signal<Member[]>(undefined);
    filteredMembers = signal<Member[]>(undefined);
    cardForm: UntypedFormGroup;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    currentUser = computed(() => {
        const loggedUser = this.#userService.userSignal();

        return this.members()?.find(member => member.id === loggedUser?.id) || null;
    });

    constructor(
        public matDialogRef: MatDialogRef<ScrumboardCardDetailsComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _scrumboardService: ScrumboardService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the board
        this._scrumboardService.board$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((board) => {
                // Board data
                this.board.set(board);

                // Get the labels
                this.labels.set(board.labels);
                this.filteredLabels.set(board.labels);

                // Get the members
                this.members.set(board.members);
                this.filteredMembers.set(board.members);
            });

        // Get the card details
        this._scrumboardService.card$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((card) => {
                this.card.set(card);

                console.log(card);
            });

        // Prepare the card form
        this.cardForm = this._formBuilder.group({
            id         : [ '' ],
            title      : [ '', Validators.required ],
            description: [ '' ],
            labels     : [ [] ],
            assignees  : [ [] ],
            dueDate    : [ null ],
            type       : [ null ],
        });

        // Fill the form
        this.cardForm.setValue({
            id         : this.card().id,
            title      : this.card().title,
            description: this.card().description,
            labels     : this.card().labels,
            assignees  : this.card().assignees,
            dueDate    : this.card().dueDate,
        });

        // Update card when there is a value change on the card form
        this.cardForm.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                tap((value) => this.card.update((currentCard) => ({...currentCard, ...value}))),
                debounceTime(500),
                distinctUntilChanged(),
            )
            .subscribe((value) => {
                lastValueFrom(this._scrumboardService.updateCard(value.id, value)).then(() => {
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Return whether the card has the given label
     *
     * @param label
     */
    hasLabel(label: Label): boolean {
        return !!this.card().labels.find(
            (cardLabel) => cardLabel.id === label.id
        );
    }

    /**
     * Filter labels
     *
     * @param event
     */
    filterLabels(event): void {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the labels
        this.filteredLabels.set(this.labels().filter((label) => label.title.toLowerCase().includes(value)));
    }

    /**
     * Filter labels input key down event
     *
     * @param event
     */
    filterLabelsInputKeyDown(event): void {
        // Return if the pressed key is not 'Enter'
        if (event.key !== 'Enter') {
            return;
        }

        // If there is no label available...
        if (this.filteredLabels.length === 0) {
            // Return
            return;
        }

        // If there is a label...
        const label = this.filteredLabels()[0];
        const isLabelApplied = this.card().labels.find(
            (cardLabel) => cardLabel.id === label.id
        );

        // If the found label is already applied to the card...
        if (isLabelApplied) {
            // Remove the label from the card
            this.removeLabelFromCard(label);
        } else {
            // Otherwise add the label to the card
            this.addLabelToCard(label);
        }
    }

    /**
     * Toggle card label
     *
     * @param label
     * @param change
     */
    toggleProductTag(label: Label, change: MatCheckboxChange): void {
        if (change.checked) {
            this.addLabelToCard(label);
        } else {
            this.removeLabelFromCard(label);
        }
    }

    /**
     * Add label to the card
     *
     * @param label
     */
    addLabelToCard(label: Label): void {
        // Add the label
        this.card().labels.unshift(label);

        // Update the card form data
        this.cardForm.get('labels').patchValue(this.card().labels);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove label from the card
     *
     * @param label
     */
    removeLabelFromCard(label: Label): void {
        // Remove the label
        this.card().labels.splice(
            this.card().labels.findIndex(
                (cardLabel) => cardLabel.id === label.id
            ),
            1
        );

        // Update the card form data
        this.cardForm.get('labels').patchValue(this.card().labels);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Return whether the card has the given member
     *
     * @param assignee
     */
    hasMember(assignee: Member): boolean {
        return !!this.card().assignees?.find(
            (cardAssignee) => cardAssignee.id === assignee.id
        );
    }

    /**
     * Filter assignees
     *
     * @param event
     */
    filterMembers(event): void {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the members
        this.filteredMembers.set(this.members().filter((assignee: Member) => assignee.name.toLowerCase().includes(value)));
    }

    /**
     * Filter assignees input key down event
     *
     * @param event
     */
    filterMembersInputKeyDown(event): void {
        // Return if the pressed key is not 'Enter'
        if (event.key !== 'Enter') {
            return;
        }

        // If there is no label available...
        if (this.filteredLabels.length === 0) {
            // Return
            return;
        }

        // If there is a label...
        const assignee = this.filteredMembers()[0];
        const isLabelApplied = this.card().assignees.find(
            (cardAssignee) => cardAssignee.id === assignee.id
        );

        // If the found label is already applied to the card...
        if (isLabelApplied) {
            // Remove the label from the card
            this.removeAssigneeFromCard(assignee);
        } else {
            // Otherwise add the label to the card
            this.addAssigneeToCard(assignee);
        }
    }

    /**
     * Toggle card assignee
     *
     * @param assignee
     * @param change
     */
    toggleCardAssignee(assignee: Member, change: MatCheckboxChange): void {
        if (change.checked) {
            this.addAssigneeToCard(assignee);
        } else {
            this.removeAssigneeFromCard(assignee);
        }
    }

    /**
     * Add assignee to the card
     *
     * @param assignee
     */
    addAssigneeToCard(assignee: Member): void {
        if (!this.card().assignees) {
            this.card().assignees = [];
        }

        // Add the label
        this.card().assignees.unshift(assignee);

        // Update the card form data
        this.cardForm.get('assignees').patchValue(this.card().assignees);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove assignee from the card
     *
     * @param assignee
     */
    removeAssigneeFromCard(assignee: Member): void {
        // Remove the label
        this.card().assignees.splice(
            this.card().assignees.findIndex(
                (cardAssignee) => cardAssignee.id === assignee.id
            ),
            1
        );

        // Update the card form data
        this.cardForm.get('assignees').patchValue(this.card().assignees);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Check if the given date is overdue
     */
    isOverdue(date: string): boolean {
        return (
            DateTime.fromISO(date).startOf('day') <
            DateTime.now().startOf('day')
        );
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Add a new checklist
     */
    addChecklist(): void {
        // Create a new checklist with a default title
        const checklist = new Checklist({
            id    : null,
            cardId: this.card().id,
            title : 'Nueva Lista de Verificación',
            items : []
        });

        // Add the checklist to the card
        this.card().checklists.push(checklist);

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Remove the given checklist
     *
     * @param checklist
     */
    removeChecklist(checklist: Checklist): void {
        // Remove the checklist from the card
        this.card().checklists = this.card().checklists.filter(item => item.id !== checklist.id);

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Add an item to the given checklist
     *
     * @param checklist
     * @param title
     */
    addChecklistItem(checklist: Checklist, title: string): void {
        if (!title.trim()) {
            return;
        }

        // Create a new checklist item
        const item = new ChecklistItem({
            id         : null,
            checklistId: checklist.id,
            title      : title.trim(),
            checked    : false
        });

        // Add the item to the checklist
        checklist.items.push(item);

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Toggle the checked status of the given checklist item
     *
     * @param checklist
     * @param item
     * @param change
     */
    toggleChecklistItem(checklist: Checklist, item: ChecklistItem, change: MatCheckboxChange): void {
        // Update the item
        item.checked = change.checked;

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Add a new attachment
     */
    addAttachment(): void {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.click();

        // Listen for file selection
        fileInput.addEventListener('change', (e: any) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }

            // Read the file
            this._readAsDataURL(file).then((dataURL) => {
                // Create a new attachment
                const attachment = new Attachment({
                    id       : null,
                    cardId   : this.card().id,
                    name     : file.name,
                    url      : dataURL as string,
                    type     : file.type,
                    size     : file.size,
                    createdAt: DateTime.now().toISO()
                });

                // Add the attachment to the card
                this.card().attachments.push(attachment);

                // Update the card
                this._scrumboardService.updateCard(this.card().id, this.card())
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe();
            });
        });
    }

    /**
     * Remove the given attachment
     *
     * @param attachment
     */
    removeAttachment(attachment: Attachment): void {
        // Remove the attachment from the card
        this.card().attachments = this.card().attachments.filter(item => item.id !== attachment.id);

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Add a new comment
     *
     * @param message
     */
    addComment(message: string): void {
        if (!message.trim()) {
            return;
        }

        // Create a new comment
        const comment = new Comment({
            id       : null,
            cardId   : this.card().id,
            memberId : this.currentUser().id,
            member   : this.currentUser(),
            message  : message.trim(),
            createdAt: DateTime.now().toISO()
        });

        // Add the comment to the card
        this.card().comments.push(comment);

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Add a new custom field
     */
    addCustomField(): void {
        // Create a new custom field
        const field = new CustomField({
            id    : null,
            cardId: this.card().id,
            type  : 'text',
            title : 'Nuevo Campo',
            value : null
        });

        // Add the field to the card
        this.card().customFields.push(field);

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Remove the given custom field
     *
     * @param field
     */
    removeCustomField(field: CustomField): void {
        // Remove the field from the card
        this.card().customFields = this.card().customFields.filter(item => item.id !== field.id);

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    /**
     * Check if the given user is selected in the given field
     *
     * @param field
     * @param user
     */
    isUserSelected(field: CustomField, user: Member): boolean {
        if (!field.value) {
            return false;
        }

        return field.value.includes(user.id);
    }

    /**
     * Toggle the selection of the given user in the given field
     *
     * @param field
     * @param user
     * @param change
     */
    toggleUserSelection(field: CustomField, user: Member, change: MatCheckboxChange): void {
        // Initialize the value if it doesn't exist
        if (!field.value) {
            field.value = [];
        }

        // Add or remove the user
        if (change.checked) {
            field.value.push(user.id);
        } else {
            field.value = field.value.filter(id => id !== user.id);
        }

        // Update the card
        this._scrumboardService.updateCard(this.card().id, this.card())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Read the given file for demonstration purposes
     *
     * @param file
     */
    private _readAsDataURL(file: File): Promise<any> {
        // Return a new promise
        return new Promise((resolve, reject) => {
            // Create a new reader
            const reader = new FileReader();

            // Resolve the promise on success
            reader.onload = (): void => {
                resolve(reader.result);
            };

            // Reject the promise on error
            reader.onerror = (e): void => {
                reject(e);
            };

            // Read the file as the
            reader.readAsDataURL(file);
        });
    }
}
