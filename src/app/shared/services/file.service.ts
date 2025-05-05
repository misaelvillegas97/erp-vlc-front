import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileResponse {
    id: string;
    path: string;
}

@Injectable({
    providedIn: 'root'
})
export class FileService {
    private readonly baseUrl = '/api/v1/files';

    constructor(private httpClient: HttpClient) {}

    /**
     * Uploads a file to the server
     * @param file The file to upload
     * @returns An observable with the file response
     */
    upload(file: File): Observable<{ file: FileResponse }> {
        const formData = new FormData();
        formData.append('file', file);

        return this.httpClient.post<{ file: FileResponse }>(`${ this.baseUrl }/upload`, formData);
    }

    /**
     * Deletes a file from the server
     * @param id The id of the file to delete
     * @returns An observable with void response
     */
    delete(id: string): Observable<void> {
        return this.httpClient.delete<void>(`${ this.baseUrl }/${ id }`);
    }
}
