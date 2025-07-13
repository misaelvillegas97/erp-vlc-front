import { TextFieldModule }                                                                                                            from '@angular/cdk/text-field';
import { DatePipe, NgSwitch, NgSwitchCase }                                                                                           from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnDestroy, signal, ViewChild, ViewEncapsulation, } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators, }                                        from '@angular/forms';
import { MatButtonModule }                                                                                                            from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule, }                                                                                      from '@angular/material/checkbox';
import { MatDatepickerModule }                                                                                                        from '@angular/material/datepicker';
import { MatDialogContent, MatDialogRef, MatDialogTitle }                                                                             from '@angular/material/dialog';
import { MatFormFieldModule }                                                                                                         from '@angular/material/form-field';
import { MatIconModule }                                                                                                              from '@angular/material/icon';
import { MatInputModule }                                                                                                             from '@angular/material/input';
import { Attachment, Checklist, ChecklistItem, Comment, CustomField, Label, Member }                                                  from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService }                                                                                                          from '@modules/admin/apps/scrumboard/services/scrumboard.service';
import { DateTime }                                                                                                                   from 'luxon';
import { debounceTime, distinctUntilChanged, Subject }                                                                                from 'rxjs';
import { UserService }                                                                                                                from '@core/user/user.service';
import { MatSelectModule }                                                                                                            from '@angular/material/select';
import { toSignal }                                                                                                                   from '@angular/core/rxjs-interop';

@Component({
    selector       : 'scrumboard-card-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports: [
        MatButtonModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        TextFieldModule,
        MatDatepickerModule,
        MatCheckboxModule,
        DatePipe,
        MatSelectModule,
        NgSwitch,
        NgSwitchCase,
        MatDialogTitle,
        MatDialogContent
    ]
})
export class ScrumboardCardDetailsComponent implements OnDestroy {
    readonly #userService = inject(UserService);
    readonly #boardService = inject(ScrumboardService);
    readonly #fb = inject(UntypedFormBuilder);

    @ViewChild('labelInput') labelInput: ElementRef<HTMLInputElement>;
    board = this.#boardService.board;
    card = this.#boardService.card;
    labels = computed(() => this.board().labels);
    members = computed(() => this.board().members);
    cardForm: UntypedFormGroup = this.#fb.group({
        id         : [ '' ],
        title      : [ '', Validators.required ],
        description: [ '' ],
        labels     : [ [] ],
        assignees  : [ [] ],
        dueDate    : [ null ],
        type       : [ null ],
    });

    formValue = toSignal(this.cardForm.valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)), {initialValue: null});

    // Filter terms as signals
    private _labelFilterTerm = signal<string>('');
    private _memberFilterTerm = signal<string>('');

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Computed signals for filtered data
    filteredLabels = computed(() => {
        const labels = this.labels();
        const filterTerm = this._labelFilterTerm().toLowerCase();

        if (!labels || !filterTerm) {
            return labels || [];
        }

        return labels.filter(label => label.title.toLowerCase().includes(filterTerm));
    });

    filteredMembers = computed(() => {
        const members = this.members();
        const filterTerm = this._memberFilterTerm().toLowerCase();

        if (!members || !filterTerm) {
            return members || [];
        }

        return members.filter(member => member.name.toLowerCase().includes(filterTerm));
    });

    currentUser = computed(() => {
        const loggedUser = this.#userService.userSignal();

        return this.members()?.find(member => member.id === loggedUser?.id) || null;
    });

    constructor(
        public matDialogRef: MatDialogRef<ScrumboardCardDetailsComponent>,
    ) {
        effect(() => {
            const card = this.card();

            this.cardForm.patchValue({...card}, {emitEvent: false});
        });

        effect(() => {
            const cardForm = this.formValue();

            if (cardForm && cardForm.id) {
                this.#boardService.updateCard(cardForm.id, cardForm);
            }
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
        // Get the value and update the filter term signal
        const value = event.target.value;
        this._labelFilterTerm.set(value);
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
        const currentCard = this.card();
        if (!currentCard) return;

        // Add the label immutably
        const updatedLabels = [ label, ...currentCard.labels ];
        const updatedCard = {...currentCard, labels: updatedLabels};

        this.card.set(updatedCard);

        // Update the card form data
        this.cardForm.get('labels').patchValue(updatedLabels);
    }

    /**
     * Remove label from the card
     *
     * @param label
     */
    removeLabelFromCard(label: Label): void {
        const currentCard = this.card();
        if (!currentCard) return;

        // Remove the label immutably
        const updatedLabels = currentCard.labels.filter(
            (cardLabel) => cardLabel.id !== label.id
        );
        const updatedCard = {...currentCard, labels: updatedLabels};

        this.card.set(updatedCard);

        // Update the card form data
        this.cardForm.get('labels').patchValue(updatedLabels);
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
        // Get the value and update the filter term signal
        const value = event.target.value;
        this._memberFilterTerm.set(value);
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

        // If there is no member available...
        if (this.filteredMembers().length === 0) {
            // Return
            return;
        }

        // If there is a member...
        const assignee = this.filteredMembers()[0];
        const isAssigneeApplied = this.card().assignees?.find(
            (cardAssignee) => cardAssignee.id === assignee.id
        );

        // If the found assignee is already applied to the card...
        if (isAssigneeApplied) {
            // Remove the assignee from the card
            this.removeAssigneeFromCard(assignee);
        } else {
            // Otherwise add the assignee to the card
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
        const currentCard = this.card();
        if (!currentCard) return;

        // Add the assignee immutably
        const currentAssignees = currentCard.assignees || [];
        const updatedAssignees = [ assignee, ...currentAssignees ];
        const updatedCard = {...currentCard, assignees: updatedAssignees};

        this.card.set(updatedCard);

        // Update the card form data
        this.cardForm.get('assignees').patchValue(updatedAssignees);
    }

    /**
     * Remove assignee from the card
     *
     * @param assignee
     */
    removeAssigneeFromCard(assignee: Member): void {
        const currentCard = this.card();
        if (!currentCard || !currentCard.assignees) return;

        // Remove the assignee immutably
        const updatedAssignees = currentCard.assignees.filter(
            (cardAssignee) => cardAssignee.id !== assignee.id
        );
        const updatedCard = {...currentCard, assignees: updatedAssignees};

        this.card.set(updatedCard);

        // Update the card form data
        this.cardForm.get('assignees').patchValue(updatedAssignees);
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
        const currentCard = this.card();
        if (!currentCard) return;

        // Create a new checklist with a default title
        const checklist = new Checklist({
            id    : null,
            cardId: currentCard.id,
            title : 'Nueva Lista de Verificación',
            items : []
        });

        // Add the checklist to the card immutably
        const updatedChecklists = [ ...(currentCard.checklists || []), checklist ];
        const updatedCard = {...currentCard, checklists: updatedChecklists};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
    }

    /**
     * Remove the given checklist
     *
     * @param checklist
     */
    removeChecklist(checklist: Checklist): void {
        const currentCard = this.card();
        if (!currentCard || !currentCard.checklists) return;

        // Remove the checklist from the card immutably
        const updatedChecklists = currentCard.checklists.filter(item => item.id !== checklist.id);
        const updatedCard = {...currentCard, checklists: updatedChecklists};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
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

        const currentCard = this.card();
        if (!currentCard || !currentCard.checklists) return;

        // Create a new checklist item
        const item = new ChecklistItem({
            id         : null,
            checklistId: checklist.id,
            title      : title.trim(),
            checked    : false
        });

        // Update the checklist and card immutably
        const updatedChecklists = currentCard.checklists.map(cl =>
            cl.id === checklist.id
                ? {...cl, items: [ ...(cl.items || []), item ]}
                : cl
        );
        const updatedCard = {...currentCard, checklists: updatedChecklists};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
    }

    /**
     * Toggle the checked status of the given checklist item
     *
     * @param checklist
     * @param item
     * @param change
     */
    toggleChecklistItem(checklist: Checklist, item: ChecklistItem, change: MatCheckboxChange): void {
        const currentCard = this.card();
        if (!currentCard || !currentCard.checklists) return;

        // Update the item and card immutably
        const updatedChecklists = currentCard.checklists.map(cl =>
            cl.id === checklist.id
                ? {
                    ...cl,
                    items: cl.items.map(it =>
                        it.id === item.id
                            ? {...it, checked: change.checked}
                            : it
                    )
                }
                : cl
        );
        const updatedCard = {...currentCard, checklists: updatedChecklists};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
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
                const currentCard = this.card();
                if (!currentCard) return;

                // Create a new attachment
                const attachment = new Attachment({
                    id       : null,
                    cardId: currentCard.id,
                    name     : file.name,
                    url      : dataURL as string,
                    type     : file.type,
                    size     : file.size,
                    createdAt: DateTime.now().toISO()
                });

                // Add the attachment to the card immutably
                const updatedAttachments = [ ...(currentCard.attachments || []), attachment ];
                const updatedCard = {...currentCard, attachments: updatedAttachments};

                this.card.set(updatedCard);

                // Update the card
                this.#boardService.updateCard(updatedCard.id, updatedCard);
            });
        });
    }

    /**
     * Remove the given attachment
     *
     * @param attachment
     */
    removeAttachment(attachment: Attachment): void {
        const currentCard = this.card();
        if (!currentCard || !currentCard.attachments) return;

        // Remove the attachment from the card immutably
        const updatedAttachments = currentCard.attachments.filter(item => item.id !== attachment.id);
        const updatedCard = {...currentCard, attachments: updatedAttachments};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
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

        const currentCard = this.card();
        const currentUser = this.currentUser();
        if (!currentCard || !currentUser) return;

        // Create a new comment
        const comment = new Comment({
            id       : null,
            cardId  : currentCard.id,
            memberId: currentUser.id,
            member  : currentUser,
            message  : message.trim(),
            createdAt: DateTime.now().toISO()
        });

        // Add the comment to the card immutably
        const updatedComments = [ ...(currentCard.comments || []), comment ];
        const updatedCard = {...currentCard, comments: updatedComments};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
    }

    /**
     * Add a new custom field
     */
    addCustomField(): void {
        const currentCard = this.card();
        if (!currentCard) return;

        // Create a new custom field
        const field = new CustomField({
            id    : null,
            cardId: currentCard.id,
            type  : 'text',
            title : 'Nuevo Campo',
            value : null
        });

        // Add the field to the card immutably
        const updatedCustomFields = [ ...(currentCard.customFields || []), field ];
        const updatedCard = {...currentCard, customFields: updatedCustomFields};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
    }

    /**
     * Remove the given custom field
     *
     * @param field
     */
    removeCustomField(field: CustomField): void {
        const currentCard = this.card();
        if (!currentCard || !currentCard.customFields) return;

        // Remove the field from the card immutably
        const updatedCustomFields = currentCard.customFields.filter(item => item.id !== field.id);
        const updatedCard = {...currentCard, customFields: updatedCustomFields};

        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
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
        const currentCard = this.card();
        if (!currentCard || !currentCard.customFields) return;

        // Update the field and card immutably
        const updatedCustomFields = currentCard.customFields.map(cf => {
            if (cf.id === field.id) {
                const currentValue = cf.value || [];
                const updatedValue = change.checked
                    ? [ ...currentValue, user.id ]
                    : currentValue.filter(id => id !== user.id);

                return {...cf, value: updatedValue};
            }
            return cf;
        });

        const updatedCard = {...currentCard, customFields: updatedCustomFields};
        this.card.set(updatedCard);

        // Update the card
        this.#boardService.updateCard(updatedCard.id, updatedCard);
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
