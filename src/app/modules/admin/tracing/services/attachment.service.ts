import { Injectable, inject, signal }                        from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest }            from '@angular/common/http';
import { Observable, from, of, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, switchMap, retry, delay }     from 'rxjs/operators';
import { environment }                                       from 'environments/environment';

interface AttachmentUpload {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
    url?: string;
    error?: string;
    retryCount: number;
    chunkSize: number;
    uploadedChunks: number;
    totalChunks: number;
}

interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
}

@Injectable({
    providedIn: 'root'
})
export class AttachmentService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `api/tracing/attachments`;

    // Upload state management
    private readonly uploads$ = new BehaviorSubject<Map<string, AttachmentUpload>>(new Map());
    private readonly isUploading = signal(false);

    // Configuration
    private readonly DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000; // 1 second

    // Supported file types
    private readonly SUPPORTED_IMAGE_TYPES = [ 'image/jpeg', 'image/png', 'image/webp' ];
    private readonly SUPPORTED_FILE_TYPES = [
        ...this.SUPPORTED_IMAGE_TYPES,
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    constructor() {
        this.setupUploadQueue();
    }

    // ========== PUBLIC API ==========

    /**
     * Upload a single file with automatic compression for images
     */
    uploadFile(file: File, options?: {
        compress?: boolean;
        compressOptions?: CompressOptions;
        stepExecutionId?: string;
    }): Observable<string> {
        if (!this.isValidFileType(file)) {
            return throwError(() => new Error(`Unsupported file type: ${ file.type }`));
        }

        if (!this.isValidFileSize(file)) {
            return throwError(() => new Error(`File too large. Maximum size: ${ this.getMaxFileSize() }MB`));
        }

        const uploadId = this.generateUploadId();

        // Compress image if needed
        const fileToUpload$ = (options?.compress && this.isImage(file))
            ? this.compressImage(file, options.compressOptions)
            : of(file);

        return fileToUpload$.pipe(
            switchMap(processedFile => {
                const upload: AttachmentUpload = {
                    id            : uploadId,
                    file          : processedFile,
                    progress      : 0,
                    status        : 'pending',
                    retryCount    : 0,
                    chunkSize     : this.DEFAULT_CHUNK_SIZE,
                    uploadedChunks: 0,
                    totalChunks   : Math.ceil(processedFile.size / this.DEFAULT_CHUNK_SIZE)
                };

                this.addUpload(upload);
                return this.performChunkedUpload(upload, options?.stepExecutionId);
            })
        );
    }

    /**
     * Upload multiple files
     */
    uploadFiles(files: File[], options?: {
        compress?: boolean;
        compressOptions?: CompressOptions;
        stepExecutionId?: string;
    }): Observable<string[]> {
        const uploads$ = files.map(file => this.uploadFile(file, options));

        return from(uploads$).pipe(
            switchMap(upload$ => upload$),
            map(urls => urls),
            // Collect all results
            switchMap(() => {
                const allUploads = Array.from(this.uploads$.value.values());
                const completedUrls = allUploads
                    .filter(upload => upload.status === 'completed')
                    .map(upload => upload.url!)
                    .filter(url => url);

                return of(completedUrls);
            })
        );
    }

    /**
     * Get upload progress for a specific upload
     */
    getUploadProgress(uploadId: string): Observable<number> {
        return this.uploads$.pipe(
            map(uploads => uploads.get(uploadId)?.progress || 0)
        );
    }

    /**
     * Get all active uploads
     */
    getActiveUploads(): Observable<AttachmentUpload[]> {
        return this.uploads$.pipe(
            map(uploads => Array.from(uploads.values()).filter(u => u.status !== 'completed'))
        );
    }

    /**
     * Cancel an upload
     */
    cancelUpload(uploadId: string): void {
        const uploads = this.uploads$.value;
        const upload = uploads.get(uploadId);

        if (upload && upload.status === 'uploading') {
            upload.status = 'paused';
            uploads.set(uploadId, upload);
            this.uploads$.next(uploads);
        }
    }

    /**
     * Retry a failed upload
     */
    retryUpload(uploadId: string): Observable<string> {
        const upload = this.uploads$.value.get(uploadId);

        if (!upload || upload.status !== 'failed') {
            return throwError(() => new Error('Upload not found or not in failed state'));
        }

        upload.status = 'pending';
        upload.retryCount = 0;
        upload.error = undefined;

        this.updateUpload(upload);

        return this.performChunkedUpload(upload);
    }

    /**
     * Compress an image file
     */
    compressImage(file: File, options?: CompressOptions): Observable<File> {
        if (!this.isImage(file)) {
            return of(file);
        }

        const defaultOptions: CompressOptions = {
            maxWidth : 1920,
            maxHeight: 1080,
            quality  : 0.8,
            format   : 'jpeg'
        };

        const compressOptions = {...defaultOptions, ...options};

        return from(this.performImageCompression(file, compressOptions));
    }

    /**
     * Delete an attachment
     */
    deleteAttachment(url: string): Observable<void> {
        const attachmentId = this.extractAttachmentId(url);

        return this.http.delete<void>(`${ this.baseUrl }/${ attachmentId }`);
    }

    // ========== PRIVATE METHODS ==========

    private setupUploadQueue(): void {
        // Process upload queue every 100ms
        setInterval(() => {
            this.processUploadQueue();
        }, 100);
    }

    private processUploadQueue(): void {
        const uploads = this.uploads$.value;
        const pendingUploads = Array.from(uploads.values())
            .filter(upload => upload.status === 'pending');

        if (pendingUploads.length > 0 && !this.isUploading()) {
            const nextUpload = pendingUploads[0];
            this.performChunkedUpload(nextUpload).subscribe();
        }
    }

    private performChunkedUpload(upload: AttachmentUpload, stepExecutionId?: string): Observable<string> {
        this.isUploading.set(true);
        upload.status = 'uploading';
        this.updateUpload(upload);

        return this.uploadChunks(upload, stepExecutionId).pipe(
            tap(url => {
                upload.status = 'completed';
                upload.url = url;
                upload.progress = 100;
                this.updateUpload(upload);
                this.isUploading.set(false);
            }),
            catchError(error => {
                upload.status = 'failed';
                upload.error = error.message;
                upload.retryCount++;
                this.updateUpload(upload);
                this.isUploading.set(false);

                if (upload.retryCount < this.MAX_RETRIES) {
                    return of(null).pipe(
                        delay(this.RETRY_DELAY * upload.retryCount),
                        switchMap(() => this.performChunkedUpload(upload, stepExecutionId))
                    );
                }

                return throwError(() => error);
            })
        );
    }

    private uploadChunks(upload: AttachmentUpload, stepExecutionId?: string): Observable<string> {
        const {file, chunkSize, totalChunks} = upload;
        let uploadedChunks = 0;

        // Initialize multipart upload
        return this.initializeUpload(file.name, file.size, file.type, stepExecutionId).pipe(
            switchMap(({uploadId, uploadUrl}) => {
                // Upload chunks sequentially
                return this.uploadChunksSequentially(file, uploadId, chunkSize, totalChunks, (progress) => {
                    upload.progress = progress;
                    upload.uploadedChunks = uploadedChunks++;
                    this.updateUpload(upload);
                }).pipe(
                    switchMap(() => this.finalizeUpload(uploadId))
                );
            })
        );
    }

    private initializeUpload(filename: string, size: number, type: string, stepExecutionId?: string): Observable<any> {
        const body = {
            filename,
            size,
            type,
            stepExecutionId
        };

        return this.http.post<any>(`${ this.baseUrl }/initialize`, body);
    }

    private uploadChunksSequentially(
        file: File,
        uploadId: string,
        chunkSize: number,
        totalChunks: number,
        onProgress: (progress: number) => void
    ): Observable<void> {
        return new Observable(observer => {
            let currentChunk = 0;

            const uploadNextChunk = () => {
                if (currentChunk >= totalChunks) {
                    observer.next();
                    observer.complete();
                    return;
                }

                const start = currentChunk * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('chunk', chunk);
                formData.append('chunkIndex', currentChunk.toString());
                formData.append('uploadId', uploadId);

                const req = new HttpRequest('POST', `${ this.baseUrl }/chunk`, formData, {
                    reportProgress: true
                });

                this.http.request(req).subscribe({
                    next : event => {
                        if (event.type === HttpEventType.UploadProgress && event.total) {
                            const chunkProgress = (event.loaded / event.total) * 100;
                            const totalProgress = ((currentChunk + chunkProgress / 100) / totalChunks) * 100;
                            onProgress(totalProgress);
                        } else if (event.type === HttpEventType.Response) {
                            currentChunk++;
                            uploadNextChunk();
                        }
                    },
                    error: error => observer.error(error)
                });
            };

            uploadNextChunk();
        });
    }

    private finalizeUpload(uploadId: string): Observable<string> {
        return this.http.post<{ url: string }>(`${ this.baseUrl }/finalize`, {uploadId}).pipe(
            map(response => response.url)
        );
    }

    private async performImageCompression(file: File, options: CompressOptions): Promise<File> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let {width, height} = img;
                const maxWidth = options.maxWidth || 1920;
                const maxHeight = options.maxHeight || 1080;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([ blob ], file.name, {
                                type        : `image/${ options.format || 'jpeg' }`,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    `image/${ options.format || 'jpeg' }`,
                    options.quality || 0.8
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    private isValidFileType(file: File): boolean {
        return this.SUPPORTED_FILE_TYPES.includes(file.type);
    }

    private isValidFileSize(file: File): boolean {
        const maxSize = this.getMaxFileSize() * 1024 * 1024; // Convert MB to bytes
        return file.size <= maxSize;
    }

    private getMaxFileSize(): number {
        return 50; // 50MB max file size
    }

    private isImage(file: File): boolean {
        return this.SUPPORTED_IMAGE_TYPES.includes(file.type);
    }

    private generateUploadId(): string {
        return `upload_${ Date.now() }_${ Math.random().toString(36).substr(2, 9) }`;
    }

    private addUpload(upload: AttachmentUpload): void {
        const uploads = this.uploads$.value;
        uploads.set(upload.id, upload);
        this.uploads$.next(uploads);
    }

    private updateUpload(upload: AttachmentUpload): void {
        const uploads = this.uploads$.value;
        uploads.set(upload.id, upload);
        this.uploads$.next(uploads);
    }

    private extractAttachmentId(url: string): string {
        // Extract attachment ID from URL
        const parts = url.split('/');
        return parts[parts.length - 1];
    }
}
