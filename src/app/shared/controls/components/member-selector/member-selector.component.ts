import { Component, forwardRef, input, OnDestroy, OnInit, signal }                                            from '@angular/core';
import { CommonModule }                                                                                       from '@angular/common';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabelType, MatFormFieldModule, SubscriptSizing }                                                from '@angular/material/form-field';
import { MatInputModule }                                                                                     from '@angular/material/input';
import { MatIconModule }                                                                                      from '@angular/material/icon';
import { MatAutocompleteModule }                                                                              from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, Subject, takeUntil }                                             from 'rxjs';
import { startWith }                                                                                          from 'rxjs/operators';
import { toSignal }                                                                                           from '@angular/core/rxjs-interop';
import { members as membersData }                                                                             from 'app/mock-api/apps/scrumboard/data';
import { Member }                                                                                             from '@modules/admin/apps/scrumboard/models/scrumboard.models';

@Component({
    selector   : 'member-selector',
    standalone : true,
    imports    : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule
    ],
    templateUrl: './member-selector.component.html',
    providers  : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MemberSelectorComponent),
            multi      : true
        }
    ]
})
export class MemberSelectorComponent implements ControlValueAccessor, OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    // Input properties
    label = input<string>('Member');
    placeholder = input<string>('Select member');
    floatLabel = input<FloatLabelType>('always');
    subscriptSizing = input<SubscriptSizing>('fixed');
    controlClasses = input<string>('');
    required = input<boolean>(false);
    multiple = input<boolean>(false);

    // State
    allMembers = signal<Member[]>(membersData);
    filteredMembers = signal<Member[]>(membersData);
    loading = signal<boolean>(false);
    searchControl = new FormControl<string | Member | Member[]>('');
    selectedMembers = signal<Member[]>([]);

    // Convert the search control value changes to a signal
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
    ));

    // ControlValueAccessor implementation
    private onChange: (value: string | string[]) => void = () => {};
    private onTouched: () => void = () => {};

    ngOnInit(): void {
        // Set validators if required
        if (this.required()) {
            this.searchControl.setValidators([ Validators.required ]);
            this.searchControl.updateValueAndValidity();
        }

        // Filter members when search term changes
        this.searchControl.valueChanges.pipe(
            takeUntil(this.destroy$),
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.filterMembers(value);
        });

        // Initial filtering
        this.filterMembers('');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Filter members based on search term
     */
    filterMembers(value: string | Member | Member[] | null): void {
        // If value is null or empty, show all members
        if (!value) {
            this.filteredMembers.set(this.allMembers());
            return;
        }

        // If value is a string, filter by name
        if (typeof value === 'string') {
            const filterValue = value.toLowerCase();
            this.filteredMembers.set(
                this.allMembers().filter(member =>
                    member.name.toLowerCase().includes(filterValue)
                )
            );
            return;
        }

        // If value is an array (multiple selection), show all members
        if (Array.isArray(value)) {
            this.filteredMembers.set(this.allMembers());
            return;
        }

        // If value is a Member object, show all members
        this.filteredMembers.set(this.allMembers());
    }

    /**
     * Handle member selection
     */
    onMemberSelected(member: Member): void {
        if (this.multiple()) {
            // For multiple selection, add to the array if not already selected
            const currentMembers = this.selectedMembers();
            if (!currentMembers.some(m => m.id === member.id)) {
                this.selectedMembers.set([ ...currentMembers, member ]);
                this.onChange(this.selectedMembers().map(m => m.id));
            }

            // Clear the search input
            this.searchControl.setValue('', {emitEvent: false});
        } else {
            // For single selection, just set the selected member
            this.selectedMembers.set([ member ]);
            this.onChange(member.id);
        }
    }

    /**
     * Remove a selected member (for multiple selection)
     */
    removeMember(member: Member): void {
        if (this.multiple()) {
            const currentMembers = this.selectedMembers();
            this.selectedMembers.set(currentMembers.filter(m => m.id !== member.id));
            this.onChange(this.selectedMembers().map(m => m.id));
        }
    }

    /**
     * Display function for autocomplete
     */
    displayMemberFn = (member: Member | string | null): string => {
        if (!member) {
            return '';
        }

        if (typeof member === 'string') {
            const selectedMember = this.selectedMembers().find(m => m.id === member);
            if (selectedMember) {
                return selectedMember.name;
            }
            return '';
        }

        return member.name;
    };

    // ControlValueAccessor methods
    writeValue(value: string | string[]): void {
        if (!value) {
            this.selectedMembers.set([]);
            this.searchControl.setValue('', {emitEvent: false});
            return;
        }

        if (Array.isArray(value)) {
            // For multiple selection, find all members by IDs
            const members = value.map(id =>
                this.allMembers().find(member => member.id === id)
            ).filter(Boolean) as Member[];

            this.selectedMembers.set(members);
            this.searchControl.setValue('', {emitEvent: false});
        } else {
            // For single selection, find the member by ID
            const member = this.allMembers().find(m => m.id === value);
            if (member) {
                this.selectedMembers.set([ member ]);
                this.searchControl.setValue(member, {emitEvent: false});
            } else {
                this.selectedMembers.set([]);
                this.searchControl.setValue('', {emitEvent: false});
            }
        }
    }

    registerOnChange(fn: (value: string | string[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.searchControl.disable();
        } else {
            this.searchControl.enable();
        }
    }

    // Mark as touched when the control is blurred
    onBlur(): void {
        this.onTouched();
    }
}
