import { inject, Injectable }  from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable }          from 'rxjs';
import { FeatureToggleEntity } from './domain/model/feature-toggle';

@Injectable({providedIn: 'root'})
export class FeatureTogglesService {
    readonly #http = inject(HttpClient);

    findAll(filters?: any): Observable<FeatureToggleEntity[]> {
        return this.#http.get<FeatureToggleEntity[]>('/api/config/features', {params: filters});
    }

    getHierarchy(): Observable<FeatureToggleEntity[]> {
        return this.#http.get<FeatureToggleEntity[]>('/api/config/features/hierarchy');
    }

    findById(id: string, includeRelations: boolean = false): Observable<FeatureToggleEntity> {
        return this.#http.get<FeatureToggleEntity>(`/api/config/features/${ id }`, {
            params: {relations: includeRelations ? 'true' : 'false'}
        });
    }

    findByName(name: string, includeRelations: boolean = false): Observable<FeatureToggleEntity> {
        return this.#http.get<FeatureToggleEntity>(`/api/config/features/name/${ name }`, {
            params: {relations: includeRelations ? 'true' : 'false'}
        });
    }

    isEnabled(name: string): Observable<{ enabled: boolean }> {
        return this.#http.get<{ enabled: boolean }>(`/api/config/features/status/${ name }`);
    }

    getChildren(id: string): Observable<FeatureToggleEntity[]> {
        return this.#http.get<FeatureToggleEntity[]>(`/api/config/features/${ id }/children`);
    }

    create(dto: any): Observable<FeatureToggleEntity> {
        return this.#http.post<FeatureToggleEntity>('/api/config/features', dto);
    }

    update(id: string, dto: any): Observable<FeatureToggleEntity> {
        return this.#http.put<FeatureToggleEntity>(`/api/config/features/${ id }`, dto);
    }

    toggle(id: string, enabled: boolean): Observable<FeatureToggleEntity> {
        return this.#http.put<FeatureToggleEntity>(`/api/config/features/${ id }/toggle`, {enabled});
    }

    delete(id: string): Observable<void> {
        return this.#http.delete<void>(`/api/config/features/${ id }`);
    }
}
