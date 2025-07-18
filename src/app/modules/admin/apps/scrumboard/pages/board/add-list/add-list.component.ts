import { NgClass }                                                                                                                               from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, }                                                               from '@angular/forms';
import { MatButtonModule }                                                                                                                       from '@angular/material/button';
import { MatIconModule }                                                                                                                         from '@angular/material/icon';

@Component({
    selector       : 'scrumboard-board-add-list',
    templateUrl    : './add-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports: [
        MatButtonModule,
        NgClass,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,

    ],
})
export class ScrumboardBoardAddListComponent implements OnInit {
    @ViewChild('titleInput') titleInput: ElementRef;
    @Input() buttonTitle: string = 'Add a list';
    @Output() readonly saved: EventEmitter<string> = new EventEmitter<string>();

    form: UntypedFormGroup;
    formVisible: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Initialize the new list form
        this.form = this._formBuilder.group({
            title: [ '' ],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Save
     */
    save(): void {
        // Get the new list title
        const title = this.form.get('title').value;

        // Return, if the title is empty
        if (!title || title.trim() === '') {
            return;
        }

        // Execute the observable
        this.saved.next(title.trim());

        // Clear the new list title and hide the form
        this.form.get('title').setValue('');
        this.formVisible = false;

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle the visibility of the form
     */
    toggleFormVisibility(): void {
        // Toggle the visibility
        this.formVisible = !this.formVisible;

        // If the form becomes visible, focus on the title field
        if (this.formVisible) {
            this.titleInput.nativeElement.focus();
        }
    }
}
