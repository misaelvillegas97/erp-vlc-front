import { Injectable, inject }     from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }             from 'rxjs';
import { environment }            from 'environments/environment';

// Import DTOs and interfaces
import { CreateFlowTemplateDto }                   from '../models/dtos/create-flow-template.dto';
import { CreateFlowVersionDto }                    from '../models/dtos/create-flow-version.dto';
import { CreateFlowInstanceDto }                   from '../models/dtos/create-flow-instance.dto';
import { CompleteStepDto }                         from '../models/dtos/complete-step.dto';
import { CreateFieldCategoryDto }                  from '../models/dtos/create-field-category.dto';
import { CreateFieldDefDto }                       from '../models/dtos/create-field-def.dto';
import { FlowTemplate, FlowVersion, FlowInstance } from '../models/entities';

@Injectable({
    providedIn: 'root'
})
export class TracingApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `api/tracing`;

    // ========== TEMPLATES ==========
    createTemplate(dto: CreateFlowTemplateDto): Observable<FlowTemplate> {
        return this.http.post<FlowTemplate>(`${ this.baseUrl }/templates`, dto);
    }

    getTemplates(filters?: { name?: string; isActive?: boolean }): Observable<FlowTemplate[]> {
        let params = new HttpParams();
        if (filters?.name) params = params.set('name', filters.name);
        if (filters?.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());

        return this.http.get<FlowTemplate[]>(`${ this.baseUrl }/templates`, {params});
    }

    getTemplate(id: string): Observable<FlowTemplate> {
        return this.http.get<FlowTemplate>(`${ this.baseUrl }/templates/${ id }`);
    }

    updateTemplate(id: string, dto: Partial<CreateFlowTemplateDto>): Observable<FlowTemplate> {
        return this.http.put<FlowTemplate>(`${ this.baseUrl }/templates/${ id }`, dto);
    }

    deleteTemplate(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.baseUrl }/templates/${ id }`);
    }

    // ========== VERSIONS ==========
    createVersion(dto: CreateFlowVersionDto): Observable<FlowVersion> {
        return this.http.post<FlowVersion>(`${ this.baseUrl }/versions`, dto);
    }

    getVersionsByTemplate(templateId: string): Observable<FlowVersion[]> {
        return this.http.get<FlowVersion[]>(`${ this.baseUrl }/versions/template/${ templateId }`);
    }

    getVersion(id: string): Observable<FlowVersion> {
        return this.http.get<FlowVersion>(`${ this.baseUrl }/versions/${ id }`);
    }

    updateVersion(id: string, dto: Partial<CreateFlowVersionDto>): Observable<FlowVersion> {
        return this.http.put<FlowVersion>(`${ this.baseUrl }/versions/${ id }`, dto);
    }

    publishVersion(id: string): Observable<FlowVersion> {
        return this.http.post<FlowVersion>(`${ this.baseUrl }/versions/${ id }/publish`, {});
    }

    archiveVersion(id: string): Observable<FlowVersion> {
        return this.http.post<FlowVersion>(`${ this.baseUrl }/versions/${ id }/archive`, {});
    }

    deleteVersion(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.baseUrl }/versions/${ id }`);
    }

    // ========== FIELDS ==========
    // Field Categories
    createFieldCategory(dto: CreateFieldCategoryDto): Observable<any> {
        return this.http.post<any>(`${ this.baseUrl }/fields/categories`, dto);
    }

    getFieldCategoriesByVersion(versionId: string): Observable<any[]> {
        return this.http.get<any[]>(`${ this.baseUrl }/fields/categories/version/${ versionId }`);
    }

    getFieldCategory(id: string): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/fields/categories/${ id }`);
    }

    updateFieldCategory(id: string, dto: Partial<CreateFieldCategoryDto>): Observable<any> {
        return this.http.put<any>(`${ this.baseUrl }/fields/categories/${ id }`, dto);
    }

    deleteFieldCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.baseUrl }/fields/categories/${ id }`);
    }

    // Field Definitions
    createFieldDefinition(dto: CreateFieldDefDto): Observable<any> {
        return this.http.post<any>(`${ this.baseUrl }/fields/definitions`, dto);
    }

    getFieldDefinitionsByStep(stepId: string): Observable<any[]> {
        return this.http.get<any[]>(`${ this.baseUrl }/fields/definitions/step/${ stepId }`);
    }

    getFieldDefinition(id: string): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/fields/definitions/${ id }`);
    }

    updateFieldDefinition(id: string, dto: Partial<CreateFieldDefDto>): Observable<any> {
        return this.http.put<any>(`${ this.baseUrl }/fields/definitions/${ id }`, dto);
    }

    deleteFieldDefinition(id: string): Observable<void> {
        return this.http.delete<void>(`${ this.baseUrl }/fields/definitions/${ id }`);
    }

    // ========== EXECUTION ==========
    createInstance(dto: CreateFlowInstanceDto): Observable<FlowInstance> {
        return this.http.post<FlowInstance>(`${ this.baseUrl }/execution/instances`, dto);
    }

    getInstances(filters?: {
        templateId?: string;
        status?: string;
        startedBy?: string;
        page?: number;
        limit?: number;
    }): Observable<{ data: FlowInstance[]; total: number }> {
        let params = new HttpParams();
        if (filters?.templateId) params = params.set('templateId', filters.templateId);
        if (filters?.status) params = params.set('status', filters.status);
        if (filters?.startedBy) params = params.set('startedBy', filters.startedBy);
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());

        return this.http.get<{ data: FlowInstance[]; total: number }>(`${ this.baseUrl }/execution/instances`, {params});
    }

    getInstance(id: string): Observable<FlowInstance> {
        return this.http.get<FlowInstance>(`${ this.baseUrl }/execution/instances/${ id }`);
    }

    cancelInstance(id: string, cancelledBy: string, reason: string): Observable<FlowInstance> {
        return this.http.put<FlowInstance>(`${ this.baseUrl }/execution/instances/${ id }/cancel`, {cancelledBy, reason});
    }

    getInstanceProgress(id: string): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/execution/instances/${ id }/progress`);
    }

    resumeInstance(id: string, resumedBy: string, notes?: string): Observable<FlowInstance> {
        return this.http.put<FlowInstance>(`${ this.baseUrl }/execution/instances/${ id }/resume`, {resumedBy, notes});
    }

    pauseInstance(id: string, reason?: string): Observable<FlowInstance> {
        return this.http.put<FlowInstance>(`${ this.baseUrl }/execution/instances/${ id }/pause`, {reason});
    }

    getInstanceHistory(id: string): Observable<any[]> {
        return this.http.get<any[]>(`${ this.baseUrl }/execution/instances/${ id }/history`);
    }

    // ========== STEP EXECUTION ==========
    startStep(instanceId: string, stepId: string, actorId: string, notes?: string): Observable<any> {
        return this.http.post<any>(`${ this.baseUrl }/execution/steps/${ instanceId }/${ stepId }/start`, {actorId, notes});
    }

    completeStep(instanceId: string, stepId: string, dto: CompleteStepDto): Observable<any> {
        return this.http.post<any>(`${ this.baseUrl }/execution/steps/${ instanceId }/${ stepId }/complete`, dto);
    }

    getStepExecution(executionId: string): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/execution/steps/${ executionId }`);
    }

    getStepExecutionsByInstance(instanceId: string): Observable<any[]> {
        return this.http.get<any[]>(`${ this.baseUrl }/execution/steps/instance/${ instanceId }`);
    }

    skipStep(instanceId: string, stepId: string, actorId: string, reason: string, notes?: string): Observable<any> {
        return this.http.put<any>(`${ this.baseUrl }/execution/steps/${ instanceId }/${ stepId }/skip`, {actorId, reason, notes});
    }

    restartStep(instanceId: string, stepId: string, actorId: string, reason: string, notes?: string): Observable<any> {
        return this.http.put<any>(`${ this.baseUrl }/execution/steps/${ instanceId }/${ stepId }/restart`, {actorId, reason, notes});
    }

    getStepForm(instanceId: string, stepId: string): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/execution/steps/${ instanceId }/${ stepId }/form`);
    }

    validateStep(instanceId: string, stepId: string, dto: CompleteStepDto): Observable<any> {
        return this.http.post<any>(`${ this.baseUrl }/execution/steps/${ instanceId }/${ stepId }/validate`, dto);
    }

    // ========== SYNC ==========
    syncPull(deviceId: string, since?: Date): Observable<any> {
        const body: any = {deviceId};
        if (since) body.since = since.toISOString();

        return this.http.post<any>(`${ this.baseUrl }/sync/pull`, body);
    }

    syncPush(deviceId: string, changes: any[], lastKnownServerTs?: Date): Observable<any> {
        const body: any = {deviceId, changes};
        if (lastKnownServerTs) body.lastKnownServerTs = lastKnownServerTs.toISOString();

        return this.http.post<any>(`${ this.baseUrl }/sync/push`, body);
    }

    getSyncStatus(deviceId: string): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/sync/status/${ deviceId }`);
    }

    resolveSyncConflicts(conflicts: any[]): Observable<any> {
        return this.http.post<any>(`${ this.baseUrl }/sync/conflicts/resolve`, {conflicts});
    }

    getSyncHealth(): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/sync/health`);
    }

    cleanupSyncData(): Observable<any> {
        return this.http.post<any>(`${ this.baseUrl }/sync/cleanup`, {});
    }

    testSyncConnectivity(deviceId: string): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/sync/test/${ deviceId }`);
    }

    getSyncMetrics(): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/sync/metrics`);
    }

    // ========== REPORTS ==========
    getKpiReport(filters: {
        range?: { start: Date; end: Date };
        templateId?: string;
        version?: number;
        groupBy?: 'day' | 'week' | 'month';
    }): Observable<any> {
        let params = new HttpParams();
        if (filters.range?.start) params = params.set('startDate', filters.range.start.toISOString());
        if (filters.range?.end) params = params.set('endDate', filters.range.end.toISOString());
        if (filters.templateId) params = params.set('templateId', filters.templateId);
        if (filters.version) params = params.set('version', filters.version.toString());
        if (filters.groupBy) params = params.set('groupBy', filters.groupBy);

        return this.http.get<any>(`${ this.baseUrl }/reports/kpi`, {params});
    }

    getBottlenecksReport(topN?: number): Observable<any> {
        let params = new HttpParams();
        if (topN) params = params.set('topN', topN.toString());

        return this.http.get<any>(`${ this.baseUrl }/reports/bottlenecks`, {params});
    }

    exportKpiToCsv(filters: any): Observable<Blob> {
        let params = new HttpParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined) {
                params = params.set(key, filters[key].toString());
            }
        });

        return this.http.get(`${ this.baseUrl }/reports/export/csv`, {
            params,
            responseType: 'blob'
        });
    }

    getPerformanceReport(): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/reports/performance`);
    }

    getWasteAnalysisReport(): Observable<any> {
        return this.http.get<any>(`${ this.baseUrl }/reports/waste-analysis`);
    }
}
