import { Component, forwardRef, inject, input, OnInit, resource, signal }            from '@angular/core';
import { CommonModule }                                                              from '@angular/common';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule }                                                        from '@angular/material/form-field';
import { MatInputModule }                                                            from '@angular/material/input';
import { MatAutocompleteModule }                                                     from '@angular/material/autocomplete';
import { MatIconModule }                                                             from '@angular/material/icon';
import { MatProgressSpinnerModule }                                                  from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, firstValueFrom, Observable, startWith } from 'rxjs';
import { toSignal }                                                                  from '@angular/core/rxjs-interop';
import { UserService }                                                               from '@core/user/user.service';
import { RoleEnum }                                                                  from '@core/user/role.type';
import { User }                                                                      from '@core/user/user.types';

export { User };

@Component({
    selector  : 'app-user-selector',
    standalone: true,
    imports   : [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    providers : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UserSelectorComponent),
            multi      : true
        }
    ],
    template  : `
        <mat-form-field class="w-full fuse-mat-dense">
            <mat-label>{{ label() }}</mat-label>

            <input
                matInput
                type="search"
                [formControl]="searchControl"
                [matAutocomplete]="auto"
                [placeholder]="placeholder()"
            />

            @if (filteredUsers.isLoading()) {
                <mat-spinner matSuffix diameter="20"></mat-spinner>
            } @else {
                <mat-icon matSuffix>person_search</mat-icon>
            }

            <mat-autocomplete
                #auto="matAutocomplete"
                [displayWith]="displayFn"
                (optionSelected)="onOptionSelected($event)"
            >
                @if (filteredUsers.value()?.length === 0 && !filteredUsers.isLoading()) {
                    <mat-option disabled>
                        No se encontraron usuarios
                    </mat-option>
                } @else {
                    @for (user of filteredUsers.value() || []; track user.id) {
                        <mat-option [value]="user" [disabled]="user.isActive === false">
                            <div class="flex flex-col">
                                <span class="font-medium">{{ user.name }}</span>
                                @if (user.email || user.role) {
                                    <span class="text-sm text-gray-600">{{ user.email || user.role }}</span>
                                }
                            </div>
                        </mat-option>
                    }
                }
            </mat-autocomplete>

            @if (hint()) {
                <mat-hint>{{ hint() }}</mat-hint>
            }

            @if (hasError()) {
                <mat-error>{{ errorMessage() }}</mat-error>
            }
        </mat-form-field>
    `
})
export class UserSelectorComponent implements ControlValueAccessor, OnInit {
    private userService = inject(UserService);

    // Inputs
    disabled = input<boolean>(false);
    required = input<boolean>(false);
    placeholder = input<string>('Buscar usuario...');
    label = input<string>('Usuario');
    hint = input<string>('Selecciona un usuario');
    roles = input<RoleEnum[]>([]);
    userStatus = input<boolean | undefined>(undefined);
    excludeIds = input<string[]>([]);
    staticUsers = input<User[]>([]);

    // Internal state
    searchControl = new FormControl({value: '', disabled: this.disabled()}, {nonNullable: true});
    selectedUser = signal<User | null>(null);

    // Error handling
    hasError = signal<boolean>(false);
    errorMessage = signal<string>('');

    // ControlValueAccessor
    private onChange = (value: string | null) => {};
    private onTouched = () => {};

    // Search functionality
    private searchQuery = toSignal(
        this.searchControl.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ),
        {initialValue: ''}
    );

    // Resource for fetching users
    filteredUsers = resource({
        params: () => ({search: this.searchQuery()}),
        loader: async ({params}) => {
            try {
                return await firstValueFrom(this.searchUsers(params.search));
            } catch (error) {
                console.error('Error fetching users:', error);
                return [];
            }
        }
    });

    ngOnInit(): void {
        // Set up validation
        if (this.required()) {
            this.searchControl.addValidators(() => {
                const value = this.selectedUser();
                return value ? null : {required: true};
            });
        }

        if (!(this.staticUsers()?.length > 0)) this.searchUsers();
    }

    // Search function for dynamic user loading
    private searchUsers(query?: string): Observable<User[]> {
        // Build query parameters
        const params: any = {
            search: query,
            limit : 20
        };

        // Add role filter if specified
        const roles = this.roles();
        if (roles.length > 0) {
            params.roles = roles.join(',');
        }

        // Add user status filter if specified
        const userStatus = this.userStatus();
        if (userStatus !== undefined) {
            params.active = userStatus;
        }

        // Add exclude IDs if specified
        const excludeIds = this.excludeIds();
        if (excludeIds.length > 0) {
            params.excludeIds = excludeIds.join(',');
        }

        return this.userService.findByQuery(params);
    }

    // ControlValueAccessor implementation
    writeValue(value: string | null): void {
        if (value) {
            // Find the user that matches the value
            const user = this.staticUsers().find(u => u.id === value);
            if (user) {
                this.selectedUser.set(user);
                this.searchControl.setValue(user.name, {emitEvent: false});
            }
        } else {
            this.selectedUser.set(null);
            this.searchControl.setValue('', {emitEvent: false});
        }
    }

    registerOnChange(fn: (value: string | null) => void): void {
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

    // Event handlers
    onOptionSelected(event: any): void {
        const user = event.option.value as User;
        this.selectedUser.set(user);
        this.onChange(user.id);
        this.onTouched();
        this.hasError.set(false);
    }

    displayFn = (user: User | string): string => {
        if (typeof user === 'string') {
            return user;
        }
        return user ? user.name : '';
    };

    // Validation
    validate(): void {
        if (this.required() && !this.selectedUser()) {
            this.hasError.set(true);
            this.errorMessage.set('Este campo es requerido');
        } else {
            this.hasError.set(false);
            this.errorMessage.set('');
        }
    }
}
