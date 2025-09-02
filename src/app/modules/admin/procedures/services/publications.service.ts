import { Injectable, inject }                     from '@angular/core';
import { HttpClient }                             from '@angular/common/http';
import { Observable }                             from 'rxjs';
import { Publication, Acknowledgement, EConsent } from '../domain/interfaces';
import { AudienceType, Channel, SignatureType }   from '../domain/enums';

export interface CreatePublicationDto {
    versionId: string;
    audienceType: AudienceType;
    audienceIds: string[];
    channels: Channel[];
    message?: string;
    validFrom?: Date;
    validUntil?: Date;
    modifiesInternalRegulations?: boolean;
}

export interface UploadEvidenceDto {
    postedOnVisibleSites?: boolean;
    deliveredToUnionsAndCP?: boolean;
    evidenceFiles?: File[];
}

export interface CreateAcknowledgementDto {
    signatureType: SignatureType;
    ip?: string;
    device?: Record<string, any>;
    quizAnswers?: Record<string, any>;
}

export interface CreateEConsentDto {
    userId: string;
    policyCode: string;
    metadata?: Record<string, any>;
}

@Injectable({
    providedIn: 'root'
})
export class PublicationsService {
    private http = inject(HttpClient);
    private readonly apiUrl = '/api';

    // Publications
    createPublication(dto: CreatePublicationDto): Observable<Publication> {
        return this.http.post<Publication>(`${ this.apiUrl }/versions/${ dto.versionId }/publish`, dto);
    }

    getPublication(id: string): Observable<Publication> {
        return this.http.get<Publication>(`${ this.apiUrl }/publications/${ id }`);
    }

    getPublications(): Observable<Publication[]> {
        return this.http.get<Publication[]>(`${ this.apiUrl }/publications`);
    }

    uploadEvidence(publicationId: string, dto: UploadEvidenceDto): Observable<Publication> {
        const formData = new FormData();
        if (dto.postedOnVisibleSites !== undefined) {
            formData.append('postedOnVisibleSites', dto.postedOnVisibleSites.toString());
        }
        if (dto.deliveredToUnionsAndCP !== undefined) {
            formData.append('deliveredToUnionsAndCP', dto.deliveredToUnionsAndCP.toString());
        }
        if (dto.evidenceFiles) {
            dto.evidenceFiles.forEach(file => {
                formData.append('evidenceFiles', file);
            });
        }
        return this.http.post<Publication>(`${ this.apiUrl }/publications/${ publicationId }/evidence`, formData);
    }

    // Acknowledgements
    createAcknowledgement(publicationId: string, dto: CreateAcknowledgementDto): Observable<Acknowledgement> {
        return this.http.post<Acknowledgement>(`${ this.apiUrl }/publications/${ publicationId }/ack`, dto);
    }

    getAcknowledgements(publicationId: string): Observable<Acknowledgement[]> {
        return this.http.get<Acknowledgement[]>(`${ this.apiUrl }/publications/${ publicationId }/acknowledgements`);
    }

    getUserAcknowledgements(): Observable<Acknowledgement[]> {
        return this.http.get<Acknowledgement[]>(`${ this.apiUrl }/acknowledgements/my`);
    }

    // E-Consents
    createEConsent(dto: CreateEConsentDto): Observable<EConsent> {
        return this.http.post<EConsent>(`${ this.apiUrl }/e-consents`, dto);
    }

    getUserEConsents(): Observable<EConsent[]> {
        return this.http.get<EConsent[]>(`${ this.apiUrl }/e-consents/my`);
    }

    // Reports and metrics
    getPublicationReport(publicationId: string): Observable<any> {
        return this.http.get<any>(`${ this.apiUrl }/reports/publications/${ publicationId }`);
    }

    exportPublicationReport(publicationId: string, format: 'csv' | 'pdf'): Observable<Blob> {
        return this.http.get(`${ this.apiUrl }/reports/publications/${ publicationId }/export`, {
            params      : {format},
            responseType: 'blob'
        });
    }
}
