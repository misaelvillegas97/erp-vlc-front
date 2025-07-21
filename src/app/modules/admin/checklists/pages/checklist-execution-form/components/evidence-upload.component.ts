import { Component, forwardRef, ChangeDetectionStrategy, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule }                                                                  from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR }                                       from '@angular/forms';
import { MatButtonModule }                                                               from '@angular/material/button';
import { MatIconModule }                                                                 from '@angular/material/icon';
import { MatProgressBarModule }                                                          from '@angular/material/progress-bar';
import { MatTooltipModule }                                                              from '@angular/material/tooltip';

@Component({
    selector       : 'app-evidence-upload',
    standalone     : true,
    imports        : [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatTooltipModule
    ],
    providers      : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EvidenceUploadComponent),
            multi      : true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './evidence-upload.component.html'
})
export class EvidenceUploadComponent implements ControlValueAccessor {
    selectedFiles = signal<File[]>([]);
    isDragOver = signal<boolean>(false);
    isUploading = signal<boolean>(false);
    uploadProgress = signal<number>(0);
    errorMessage = signal<string>('');

    // Configuration signals
    maxFileSize = signal<number>(5 * 1024 * 1024); // 5MB
    maxFiles = signal<number>(3);
    allowMultiple = signal<boolean>(true);
    acceptedTypes = signal<string[]>([ 'image/*', '.pdf', '.doc', '.docx' ]);

    // ViewChild for file input
    fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    private onChange = (value: File[]) => {};
    private onTouched = () => {};

    triggerFileInput(): void {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = input.files;

        if (files && files.length > 0) {
            const validFiles: File[] = [];
            for (let i = 0; i < files.length && validFiles.length < this.maxFiles(); i++) {
                const file = files[i];
                if (this.isValidFile(file)) {
                    validFiles.push(file);
                }
            }

            if (validFiles.length > 0) {
                if (this.allowMultiple()) {
                    this.selectedFiles.update(current => [ ...current, ...validFiles ].slice(0, this.maxFiles()));
                } else {
                    this.selectedFiles.set([ validFiles[0] ]);
                }
                this.onChange(this.selectedFiles());
                this.onTouched();
            }
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const validFiles: File[] = [];
            for (let i = 0; i < files.length && validFiles.length < this.maxFiles(); i++) {
                const file = files[i];
                if (this.isValidFile(file)) {
                    validFiles.push(file);
                }
            }

            if (validFiles.length > 0) {
                if (this.allowMultiple()) {
                    this.selectedFiles.update(current => [ ...current, ...validFiles ].slice(0, this.maxFiles()));
                } else {
                    this.selectedFiles.set([ validFiles[0] ]);
                }
                this.onChange(this.selectedFiles());
                this.onTouched();
            }
        }
    }

    removeFile(index: number, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
        this.onChange(this.selectedFiles());
        this.onTouched();
    }

    private isValidFile(file: File): boolean {
        const maxSize = this.maxFileSize();
        const allowedTypes = this.acceptedTypes();

        if (file.size > maxSize) {
            this.errorMessage.set(`El archivo "${ file.name }" es demasiado grande. El tamaño máximo es ${ this.formatFileSize(maxSize) }.`);
            return false;
        }

        const isValidType = allowedTypes.some(type => {
            if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType);
            }
            return file.type === type || file.name.toLowerCase().endsWith(type);
        });

        if (!isValidType) {
            this.errorMessage.set(`Tipo de archivo "${ file.name }" no permitido. Tipos permitidos: ${ allowedTypes.join(', ') }.`);
            return false;
        }

        this.errorMessage.set('');
        return true;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = [ 'Bytes', 'KB', 'MB', 'GB' ];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(file: File): string {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();

        if (type.startsWith('image/')) {
            return 'image';
        } else if (type === 'application/pdf' || name.endsWith('.pdf')) {
            return 'picture_as_pdf';
        } else if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
            return 'description';
        } else if (type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
            return 'table_chart';
        } else if (type.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
            return 'slideshow';
        } else if (type.startsWith('video/')) {
            return 'videocam';
        } else if (type.startsWith('audio/')) {
            return 'audiotrack';
        } else {
            return 'insert_drive_file';
        }
    }

    // ControlValueAccessor implementation
    writeValue(value: File[] | File | null): void {
        if (Array.isArray(value)) {
            this.selectedFiles.set(value);
        } else if (value) {
            this.selectedFiles.set([ value ]);
        } else {
            this.selectedFiles.set([]);
        }
    }

    registerOnChange(fn: (value: File[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        // Handle disabled state if needed
    }
}
