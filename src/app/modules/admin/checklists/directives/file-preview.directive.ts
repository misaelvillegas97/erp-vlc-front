import {
    Directive,
    ElementRef,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnDestroy,
    inject,
    signal,
    computed
}                       from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilePreviewOptions {
    maxFileSize?: number; // in bytes
    allowedTypes?: string[];
    maxFiles?: number;
    showPreview?: boolean;
    previewSize?: { width: number; height: number };
}

export interface FilePreviewResult {
    file: File;
    preview?: string;
    isValid: boolean;
    errors: string[];
}

@Directive({
    selector: '[appFilePreview]'
})
export class FilePreviewDirective implements OnInit, OnDestroy {
    private readonly elementRef = inject(ElementRef);

    @Input() options: FilePreviewOptions = {};
    @Output() filesSelected = new EventEmitter<FilePreviewResult[]>();
    @Output() fileRemoved = new EventEmitter<number>();
    @Output() validationError = new EventEmitter<string[]>();

    // Default options
    private readonly defaultOptions: Required<FilePreviewOptions> = {
        maxFileSize : 5 * 1024 * 1024, // 5MB
        allowedTypes: [ 'image/*', 'application/pdf', '.doc', '.docx', '.txt' ],
        maxFiles    : 5,
        showPreview : true,
        previewSize : {width: 150, height: 150}
    };

    // State
    private readonly selectedFiles = signal<FilePreviewResult[]>([]);
    private dragCounter = 0;

    // Computed
    readonly canAddMore = computed(() => {
        const maxFiles = this.options.maxFiles ?? this.defaultOptions.maxFiles;
        return this.selectedFiles().length < maxFiles;
    });

    ngOnInit(): void {
        this.setupFileInput();
        this.setupDragAndDrop();
    }

    ngOnDestroy(): void {
        this.cleanup();
    }

    private setupFileInput(): void {
        const element = this.elementRef.nativeElement;

        if (element.tagName === 'INPUT' && element.type === 'file') {
            element.addEventListener('change', this.handleFileInputChange.bind(this));
        } else {
            // Create a hidden file input for non-input elements
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = (this.options.maxFiles ?? this.defaultOptions.maxFiles) > 1;
            fileInput.style.display = 'none';
            fileInput.addEventListener('change', this.handleFileInputChange.bind(this));

            element.appendChild(fileInput);
            element.addEventListener('click', () => fileInput.click());
            element.style.cursor = 'pointer';
        }
    }

    private setupDragAndDrop(): void {
        const element = this.elementRef.nativeElement;

        element.addEventListener('dragenter', this.handleDragEnter.bind(this));
        element.addEventListener('dragover', this.handleDragOver.bind(this));
        element.addEventListener('dragleave', this.handleDragLeave.bind(this));
        element.addEventListener('drop', this.handleDrop.bind(this));

        // Add visual feedback classes
        element.classList.add('file-drop-zone');
    }

    private handleFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.processFiles(Array.from(input.files));
        }
    }

    private handleDragEnter(event: DragEvent): void {
        event.preventDefault();
        this.dragCounter++;
        this.elementRef.nativeElement.classList.add('drag-over');
    }

    private handleDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    private handleDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.dragCounter--;
        if (this.dragCounter === 0) {
            this.elementRef.nativeElement.classList.remove('drag-over');
        }
    }

    private handleDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragCounter = 0;
        this.elementRef.nativeElement.classList.remove('drag-over');

        const files = event.dataTransfer?.files;
        if (files) {
            this.processFiles(Array.from(files));
        }
    }

    private async processFiles(files: File[]): Promise<void> {
        const maxFiles = this.options.maxFiles ?? this.defaultOptions.maxFiles;
        const currentCount = this.selectedFiles().length;
        const availableSlots = maxFiles - currentCount;

        if (availableSlots <= 0) {
            this.validationError.emit([ `Maximum ${ maxFiles } files allowed` ]);
            return;
        }

        const filesToProcess = files.slice(0, availableSlots);
        const results: FilePreviewResult[] = [];

        for (const file of filesToProcess) {
            const result = await this.validateAndPreviewFile(file);
            results.push(result);
        }

        // Update selected files
        this.selectedFiles.update(current => [ ...current, ...results ]);
        this.filesSelected.emit(this.selectedFiles());

        // Emit validation errors if any
        const errors = results.flatMap(r => r.errors);
        if (errors.length > 0) {
            this.validationError.emit(errors);
        }
    }

    private async validateAndPreviewFile(file: File): Promise<FilePreviewResult> {
        const errors: string[] = [];
        const maxFileSize = this.options.maxFileSize ?? this.defaultOptions.maxFileSize;
        const allowedTypes = this.options.allowedTypes ?? this.defaultOptions.allowedTypes;

        // Validate file size
        if (file.size > maxFileSize) {
            errors.push(`File "${ file.name }" exceeds maximum size of ${ this.formatFileSize(maxFileSize) }`);
        }

        // Validate file type
        const isValidType = allowedTypes.some(type => {
            if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType);
            }
            return file.type === type || file.name.toLowerCase().endsWith(type);
        });

        if (!isValidType) {
            errors.push(`File "${ file.name }" has unsupported type. Allowed: ${ allowedTypes.join(', ') }`);
        }

        // Generate preview if needed and file is valid
        let preview: string | undefined;
        if (this.options.showPreview !== false && errors.length === 0) {
            preview = await this.generatePreview(file);
        }

        return {
            file,
            preview,
            isValid: errors.length === 0,
            errors
        };
    }

    private async generatePreview(file: File): Promise<string | undefined> {
        return new Promise((resolve) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        if (ctx) {
                            const {width, height} = this.options.previewSize ?? this.defaultOptions.previewSize;
                            canvas.width = width;
                            canvas.height = height;

                            // Calculate aspect ratio
                            const aspectRatio = img.width / img.height;
                            let drawWidth = width;
                            let drawHeight = height;

                            if (aspectRatio > 1) {
                                drawHeight = width / aspectRatio;
                            } else {
                                drawWidth = height * aspectRatio;
                            }

                            const x = (width - drawWidth) / 2;
                            const y = (height - drawHeight) / 2;

                            ctx.drawImage(img, x, y, drawWidth, drawHeight);
                            resolve(canvas.toDataURL());
                        } else {
                            resolve(undefined);
                        }
                    };
                    img.src = e.target?.result as string;
                };
                reader.readAsDataURL(file);
            } else {
                // For non-image files, return a generic icon or file info
                resolve(this.getFileTypeIcon(file.type));
            }
        });
    }

    private getFileTypeIcon(mimeType: string): string {
        // Return data URL for file type icons or generic file icon
        if (mimeType.includes('pdf')) {
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDJINGMtMS4xIDAtMiAuOS0yIDJ2MTZjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY0YzAtMS4xLS45LTItMi0yem0tNSA2SDl2LTJoNnYyem0wIDJIOXYyaDZ2LTJ6bTAgNEg5djJoNnYtMnoiIGZpbGw9IiNmNDQzMzYiLz4KPC9zdmc+';
        }
        if (mimeType.includes('word') || mimeType.includes('document')) {
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDJINGMtMS4xIDAtMiAuOS0yIDJ2MTZjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY0YzAtMS4xLS45LTItMi0yem0tNSA2SDl2LTJoNnYyem0wIDJIOXYyaDZ2LTJ6bTAgNEg5djJoNnYtMnoiIGZpbGw9IiMyMTk2ZjMiLz4KPC9zdmc+';
        }
        // Generic file icon
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDJINGMtMS4xIDAtMiAuOS0yIDJ2MTZjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY0YzAtMS4xLS45LTItMi0yem0tNSA2SDl2LTJoNnYyem0wIDJIOXYyaDZ2LTJ6bTAgNEg5djJoNnYtMnoiIGZpbGw9IiM2MTYxNjEiLz4KPC9zdmc+';
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = [ 'Bytes', 'KB', 'MB', 'GB' ];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index: number): void {
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
        this.fileRemoved.emit(index);
        this.filesSelected.emit(this.selectedFiles());
    }

    clearAll(): void {
        this.selectedFiles.set([]);
        this.filesSelected.emit([]);
    }

    getFiles(): FilePreviewResult[] {
        return this.selectedFiles();
    }

    private cleanup(): void {
        // Clean up event listeners and resources
        const element = this.elementRef.nativeElement;
        element.classList.remove('file-drop-zone', 'drag-over');
    }
}
