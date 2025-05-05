import { Component, DestroyRef, forwardRef, inject, input, signal }     from '@angular/core';
import { CommonModule }                                                 from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed }                                           from '@angular/core/rxjs-interop';
import { FileResponse, FileService }                                    from '../../services/file.service';
import { finalize }                                                     from 'rxjs';

type FileUploadState = 'idle' | 'uploading' | 'success' | 'error';

@Component({
    selector  : 'file-upload',
    standalone: true,
    imports   : [
        CommonModule,
        ReactiveFormsModule
    ],
    providers : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileUploadComponent),
            multi      : true
        }
    ],
    template  : `
        <div class="flex flex-col w-full">
            <!-- Label -->
            <label
                *ngIf="label()"
                [for]="inputId"
                class="mb-2 font-medium">
                {{ label() }}
            </label>

            <!-- File input container -->
            <div
                class="relative flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer"
                [class.border-gray-300]="state() === 'idle'"
                [class.border-blue-500]="state() === 'uploading'"
                [class.border-green-500]="state() === 'success'"
                [class.border-red-500]="state() === 'error'"
                [class.bg-gray-50]="state() === 'idle'"
                [class.bg-blue-50]="state() === 'uploading'"
                [class.bg-green-50]="state() === 'success'"
                [class.dark:bg-green-900]="state() === 'success'"
                [class.bg-red-50]="state() === 'error'"
                (click)="triggerFileInput()">

                <!-- Idle state -->
                <ng-container *ngIf="state() === 'idle' && !fileValue()">
                    <svg class="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p class="mb-1 text-sm text-gray-500">
                        <span class="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p class="text-xs text-gray-500">
                        {{ acceptedFileTypes() || 'All file types accepted' }}
                    </p>
                </ng-container>

                <!-- Uploading state -->
                <ng-container *ngIf="state() === 'uploading'">
                    <div class="flex flex-col items-center">
                        <svg class="w-8 h-8 mb-2 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="text-sm text-blue-500">Uploading file...</p>
                    </div>
                </ng-container>

                <!-- Success state with file info -->
                <ng-container *ngIf="state() === 'success' && fileValue()">
                    <div class="flex flex-col items-center">
                        <svg class="w-8 h-8 mb-2 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <p class="text-sm text-green-500 dark:text-green-300">File uploaded successfully</p>
                        <p class="mt-2 text-xs text-gray-500 dark:text-gray-300 truncate max-w-full">
                            {{ fileName() }}
                        </p>
                        <button
                            type="button"
                            class="mt-2 text-xs text-red-500 hover:text-red-700"
                            (click)="removeFile($event)">
                            Remove file
                        </button>
                    </div>
                </ng-container>

                <!-- Error state -->
                <ng-container *ngIf="state() === 'error'">
                    <div class="flex flex-col items-center">
                        <svg class="w-8 h-8 mb-2 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <p class="text-sm text-red-500">Error uploading file</p>
                        <p class="mt-1 text-xs text-red-500">{{ errorMessage() }}</p>
                        <button
                            type="button"
                            class="mt-2 text-xs text-blue-500 hover:text-blue-700"
                            (click)="resetState()">
                            Try again
                        </button>
                    </div>
                </ng-container>
            </div>

            <!-- Hidden file input -->
            <input
                #fileInput
                [id]="inputId"
                type="file"
                class="hidden"
                [accept]="acceptedFileTypes()"
                [disabled]="disabled()"
                (change)="onFileSelected($event)">
        </div>
    `
})
export class FileUploadComponent implements ControlValueAccessor {
    private readonly fileService = inject(FileService);
    private readonly destroyRef = inject(DestroyRef);

    // Inputs
    label = input<string>('');
    acceptedFileTypes = input<string>('');

    // Internal state
    private readonly _state = signal<FileUploadState>('idle');
    private readonly _fileValue = signal<FileResponse | null>(null);
    private readonly _fileName = signal<string>('');
    private readonly _errorMessage = signal<string>('');
    private readonly _disabled = signal<boolean>(false);

    // Public signals
    readonly state = this._state.asReadonly();
    readonly fileValue = this._fileValue.asReadonly();
    readonly fileName = this._fileName.asReadonly();
    readonly errorMessage = this._errorMessage.asReadonly();
    readonly disabled = this._disabled.asReadonly();

    // Generate a unique ID for the input
    readonly inputId = `file-upload-${ Math.random().toString(36).substring(2, 9) }`;

    // ControlValueAccessor methods
    private onChange: (value: FileResponse | null) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: FileResponse | null): void {
        this._fileValue.set(value);

        if (value) {
            // Extract filename from path if available
            const pathParts = value.path.split('/');
            this._fileName.set(pathParts[pathParts.length - 1]);
            this._state.set('success');
        } else {
            this._fileName.set('');
            this._state.set('idle');
        }
    }

    registerOnChange(fn: (value: FileResponse | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabled.set(isDisabled);
    }

    // Component methods
    triggerFileInput(): void {
        if (this.disabled()) return;

        // Get the file input element using ViewChild
        const fileInput = document.getElementById(this.inputId) as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    onFileSelected(event: Event): void {
        this.onTouched();

        const input = event.target as HTMLInputElement;
        const files = input.files;

        if (!files || files.length === 0) {
            return;
        }

        const file = files[0];
        this._fileName.set(file.name);
        this.uploadFile(file);
    }

    uploadFile(file: File): void {
        this._state.set('uploading');

        this.fileService.upload(file)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                    // Reset the file input
                    const fileInput = document.getElementById(this.inputId) as HTMLInputElement;
                    if (fileInput) {
                        fileInput.value = '';
                    }
                })
            )
            .subscribe({
                next : (response) => {
                    this._fileValue.set(response.file);
                    this._state.set('success');
                    this.onChange(response.file);
                },
                error: (error) => {
                    this._state.set('error');
                    this._errorMessage.set(error.message || 'Error uploading file');
                    this.onChange(null);
                }
            });
    }

    removeFile(event: Event): void {
        event.stopPropagation();

        if (this.disabled() || !this.fileValue()) return;

        const fileId = this.fileValue()?.id;
        if (fileId) {
            this._state.set('uploading');

            this.fileService.delete(fileId)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next : () => {
                        this.resetState();
                    },
                    error: (error) => {
                        this._state.set('error');
                        this._errorMessage.set(error.message || 'Error removing file');
                    }
                });
        } else {
            this.resetState();
        }
    }

    resetState(): void {
        this._fileValue.set(null);
        this._fileName.set('');
        this._errorMessage.set('');
        this._state.set('idle');
        this.onChange(null);
    }
}
