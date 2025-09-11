import { inject, Injectable }     from '@angular/core';
import { HttpClient }                                 from '@angular/common/http';
import { Observable }                                 from 'rxjs';
import { Procedure, ProcedureVersion, ReviewRequest } from '../domain/interfaces';
import { LegalReferenceCategory } from '../domain/enums';
import { Pagination }             from '@shared/domain/model/pagination';
import { ProcedurePriority }      from '../domain/interfaces/base.interface';
import { RoleEnum }               from '@core/user/role.type';
import { FileDto }                from '@modules/admin/maintainers/users/models/file-dto.model';

export interface CreateProcedureDto {
    code: string;
    title: string;
    description?: string;
    category: string;
    tags: string[];
    roles: RoleEnum[];
    priority: ProcedurePriority;
    department: string;
    legalCategories: LegalReferenceCategory[];
    affectsInternalRegulation: boolean;
    requiresQuiz: boolean;
    expiresAt?: string; // ISO 8601 date string
    content: FileDto;
}

export interface CreateVersionDto {
    content: any;
    changelog?: string;
    legalReferences?: any[];
    modifiesInternalRegulations?: boolean;
}

export interface ReviewRequestDto {
    requestedToUserId: string;
    comment?: string;
}

export interface ReviewResponseDto {
    status: 'approved' | 'changes_requested';
    comment?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProceduresService {
    private http = inject(HttpClient);
    private readonly apiUrl = '/api/procedures';

    // Procedures CRUD
    getProcedures(): Observable<Pagination<Procedure>> {
        return this.http.get<Pagination<Procedure>>(this.apiUrl);
    }

    getProcedure(id: string): Observable<Procedure> {
        return this.http.get<Procedure>(`${ this.apiUrl }/${ id }`);
    }

    createProcedure(dto: CreateProcedureDto): Observable<Procedure> {
        return this.http.post<Procedure>(this.apiUrl, dto);
    }

    updateProcedure(id: string, updates: Partial<Procedure>): Observable<Procedure> {
        return this.http.patch<Procedure>(`${ this.apiUrl }/${ id }`, updates);
    }

    deleteProcedure(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.apiUrl }/${ id }`);
    }

    // Versions
    getProcedureVersions(procedureId: string): Observable<ProcedureVersion[]> {
        return this.http.get<ProcedureVersion[]>(`${ this.apiUrl }/${ procedureId }/versions`);
    }

    getProcedureVersion(procedureId: string, versionId: string): Observable<ProcedureVersion> {
        return this.http.get<ProcedureVersion>(`${ this.apiUrl }/${ procedureId }/versions/${ versionId }`);
    }

    createVersion(procedureId: string, dto: CreateVersionDto): Observable<ProcedureVersion> {
        return this.http.post<ProcedureVersion>(`${ this.apiUrl }/${ procedureId }/versions`, dto);
    }

    updateVersion(versionId: string, updates: Partial<ProcedureVersion>): Observable<ProcedureVersion> {
        return this.http.patch<ProcedureVersion>(`/api/versions/${ versionId }`, updates);
    }

    // Review workflow
    submitForReview(versionId: string, dto: ReviewRequestDto): Observable<ReviewRequest> {
        return this.http.post<ReviewRequest>(`/api/versions/${ versionId }/submit-review`, dto);
    }

    reviewVersion(versionId: string, dto: ReviewResponseDto): Observable<ReviewRequest> {
        return this.http.post<ReviewRequest>(`/api/versions/${ versionId }/review`, dto);
    }

    // Version diff
    getVersionDiff(versionId: string): Observable<any> {
        return this.http.get<any>(`/api/versions/${ versionId }/diff`);
    }
}
