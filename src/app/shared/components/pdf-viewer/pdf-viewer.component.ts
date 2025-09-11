import { ChangeDetectionStrategy, Component, inject, input, signal, Inject } from '@angular/core';
import { CommonModule }                                                      from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA }                    from '@angular/material/dialog';
import { MatButtonModule }                                                   from '@angular/material/button';
import { MatIconModule }                                                     from '@angular/material/icon';
import { MatProgressSpinnerModule }                                          from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl }                                     from '@angular/platform-browser';

interface PdfViewerDialogData {
    filePath: string;
    title?: string;
}

@Component({
    selector       : 'pdf-viewer',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    template       : `
        <div class="pdf-viewer-dialog">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">
                    {{ getActualTitle() }}
                </h2>
                <button
                    mat-icon-button
                    (click)="closeDialog()"
                    class="text-gray-500 hover:text-gray-700">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <!-- PDF Content -->
            <div class="pdf-content relative" [style.height]="height()">
                @if (isLoading()) {
                    <div class="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div class="text-center">
                            <mat-spinner diameter="48"></mat-spinner>
                            <p class="mt-4 text-sm text-gray-600">Cargando documento...</p>
                        </div>
                    </div>
                }

                @if (pdfUrl() && !hasError()) {
                    <iframe
                        [src]="pdfUrl()"
                        class="w-full h-full border-0"
                        (load)="onPdfLoad()"
                        (error)="onPdfError()"
                        [style.display]="isLoading() ? 'none' : 'block'">
                    </iframe>
                }

                @if (hasError()) {
                    <div class="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div class="text-center">
                            <mat-icon class="text-6xl text-gray-300 mb-4">error_outline</mat-icon>
                            <h3 class="text-lg font-medium text-gray-900">Error al cargar el documento</h3>
                            <p class="mt-2 text-sm text-gray-600">
                                No se pudo cargar el archivo PDF. Verifique que el archivo existe y es válido.
                            </p>
                            <button
                                mat-flat-button
                                color="primary"
                                class="mt-4"
                                (click)="retryLoad()">
                                <mat-icon class="mr-2">refresh</mat-icon>
                                Reintentar
                            </button>
                        </div>
                    </div>
                }
            </div>

            <!-- Footer with actions -->
            <div class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <div class="flex items-center text-sm text-gray-600">
                    @if (hasFilePath()) {
                        <mat-icon class="mr-1 text-base">description</mat-icon>
                        {{ getFileName() }}
                    }
                </div>
                <div class="flex gap-2">
                    @if (pdfUrl()) {
                        <a
                            [href]="getDownloadUrl()"
                            download
                            mat-flat-button
                            color="accent"
                            target="_blank">
                            <mat-icon class="mr-2">download</mat-icon>
                            Descargar
                        </a>
                    }
                    <button
                        mat-flat-button
                        (click)="closeDialog()">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `,
    styles         : [ `
        .pdf-viewer-dialog {
            display: flex;
            flex-direction: column;
            width: 90vw;
            max-width: 1200px;
            height: 90vh;
            max-height: 800px;
        }

        .pdf-content {
            flex: 1;
            min-height: 0;
        }

        @media (max-width: 768px) {
            .pdf-viewer-dialog {
                width: 95vw;
                height: 95vh;
            }
        }
    ` ]
})
export class PdfViewerComponent {
    private dialogRef = inject(MatDialogRef<PdfViewerComponent>);
    private sanitizer = inject(DomSanitizer);

    // Inputs
    filePath = input<string>('');
    title = input<string>('');
    height = input<string>('600px');

    // State
    private _isLoading = signal(true);
    private _hasError = signal(false);
    private _pdfUrl = signal<SafeResourceUrl | null>(null);
    private _actualFilePath = signal<string>('');
    private _actualTitle = signal<string>('');

    // Public signals
    readonly isLoading = this._isLoading.asReadonly();
    readonly hasError = this._hasError.asReadonly();
    readonly pdfUrl = this._pdfUrl.asReadonly();

    constructor(@Inject(MAT_DIALOG_DATA) private data?: PdfViewerDialogData) {
        // Initialize from dialog data or inputs
        const filePath = this.data?.filePath || this.filePath() || '';
        const title = this.data?.title || this.title() || '';

        this._actualFilePath.set(filePath);
        this._actualTitle.set(title);

        // Initialize PDF URL when file path is provided
        if (filePath) {
            this.loadPdf();
        }
    }

    private loadPdf(): void {
        const path = this._actualFilePath();
        if (!path) {
            this._hasError.set(true);
            this._isLoading.set(false);
            return;
        }

        this._isLoading.set(true);
        this._hasError.set(false);

        // Construct the PDF URL - assuming the path is relative to the API base
        const fullUrl = this.constructPdfUrl(path);
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
        this._pdfUrl.set(safeUrl);
    }

    private constructPdfUrl(path: string): string {
        // If path is already a full URL, use it directly
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // If path starts with '/', it's relative to domain root
        if (path.startsWith('/')) {
            return path;
        }

        // Otherwise, assume it's relative to API base
        return `/api/files/${ path }`;
    }

    onPdfLoad(): void {
        this._isLoading.set(false);
        this._hasError.set(false);
    }

    onPdfError(): void {
        this._isLoading.set(false);
        this._hasError.set(true);
    }

    retryLoad(): void {
        this.loadPdf();
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    getFileName(): string {
        const path = this._actualFilePath();
        if (!path) return '';

        const parts = path.split('/');
        return parts[parts.length - 1] || 'documento.pdf';
    }

    getDownloadUrl(): string {
        const path = this._actualFilePath();
        if (!path) return '';

        return this.constructPdfUrl(path);
    }

    getActualTitle(): string {
        return this._actualTitle() || 'Visor de PDF';
    }

    hasFilePath(): boolean {
        return !!this._actualFilePath();
    }
}
