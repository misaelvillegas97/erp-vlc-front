import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, tap }                      from 'rxjs/operators';
import { firstValueFrom, of }                   from 'rxjs';
import { ProceduresService }                                       from '../services/procedures.service';
import { PublicationsService }                                     from '../services/publications.service';
import { Procedure, ProcedureVersion, Publication, ReviewRequest } from '../domain/interfaces';
import { ProcedureVersionStatus }                                  from '../domain/enums';

export interface ProcedureFilter {
    search?: string;
    category?: string;
    status?: ProcedureVersionStatus;
    tags?: string[];
}

export interface PublicationStats {
    totalPublications: number;
    pendingAcknowledgments: number;
    completedAcknowledgments: number;
    overdueProcedures: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProcedureStore {
    private proceduresService = inject(ProceduresService);
    private publicationsService = inject(PublicationsService);

    // Core signals
    procedures = signal<Procedure[]>([]);
    selectedProcedure = signal<Procedure | null>(null);
    currentVersion = signal<ProcedureVersion | null>(null);
    procedureVersions = signal<ProcedureVersion[]>([]);
    publications = signal<Publication[]>([]);
    reviewRequests = signal<ReviewRequest[]>([]);

    // UI state signals
    isLoading = signal(false);
    error = signal<string | null>(null);
    filters = signal<ProcedureFilter>({});

    // Version diff signal
    versionDiff = signal<any>(null);

    // Publication stats signal
    pubStats = signal<PublicationStats>({
        totalPublications       : 0,
        pendingAcknowledgments  : 0,
        completedAcknowledgments: 0,
        overdueProcedures       : 0
    });

    // Computed signals
    filteredProcedures = computed(() => {
        const procedures = this.procedures();
        const filters = this.filters();

        return procedures.filter(procedure => {
            if (filters.search && !procedure.title.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.category && procedure.category !== filters.category) {
                return false;
            }
            if (filters.tags && filters.tags.length > 0) {
                return filters.tags.some(tag => procedure.tags.includes(tag));
            }
            return true;
        });
    });

    currentProcedureVersions = computed(() => {
        const procedure = this.selectedProcedure();
        const versions = this.procedureVersions();

        if (!procedure) return [];

        return versions.filter(version => version.procedureId === procedure.id);
    });

    latestVersion = computed(() => {
        const versions = this.currentProcedureVersions();
        return versions.length > 0
            ? versions.reduce((latest, current) =>
                current.number > latest.number ? current : latest
            )
            : null;
    });

    canEditCurrentVersion = computed(() => {
        const version = this.currentVersion();
        return version?.status === ProcedureVersionStatus.DRAFT ||
            version?.status === ProcedureVersionStatus.REJECTED;
    });

    canSubmitForReview = computed(() => {
        const version = this.currentVersion();
        return version?.status === ProcedureVersionStatus.DRAFT ||
            version?.status === ProcedureVersionStatus.REJECTED;
    });

    canPublish = computed(() => {
        const version = this.currentVersion();
        return version?.status === ProcedureVersionStatus.APPROVED;
    });

    // Methods to update state
    loadProcedures(): void {
        this.isLoading.set(true);
        this.error.set(null);

        firstValueFrom(this.proceduresService.getProcedures())
            .then(procedures => {
                this.procedures.set(procedures.items);
                this.isLoading.set(false);
            }).catch(error => {
            this.error.set('Error loading procedures');
            this.isLoading.set(false);
            return of([]);
        });
    }

    selectProcedure(procedureId: string): void {
        const procedure = this.procedures().find(p => p.id === procedureId);
        if (procedure) {
            this.selectedProcedure.set(procedure);
            this.loadProcedureVersions(procedureId);
        }
    }

    loadProcedureVersions(procedureId: string): void {
        this.proceduresService.getProcedureVersions(procedureId)
            .pipe(
                tap(versions => this.procedureVersions.set(versions)),
                catchError(error => {
                    this.error.set('Error loading procedure versions');
                    return of([]);
                })
            )
            .subscribe();
    }

    selectVersion(versionId: string): void {
        const version = this.procedureVersions().find(v => v.id === versionId);
        if (version) {
            this.currentVersion.set(version);
        }
    }

    loadVersionDiff(versionId: string): void {
        this.proceduresService.getVersionDiff(versionId)
            .pipe(
                tap(diff => this.versionDiff.set(diff)),
                catchError(error => {
                    this.error.set('Error loading version diff');
                    return of(null);
                })
            )
            .subscribe();
    }

    updateFilters(filters: Partial<ProcedureFilter>): void {
        this.filters.update(current => ({...current, ...filters}));
    }

    clearFilters(): void {
        this.filters.set({});
    }

    loadPublications(): void {
        this.publicationsService.getPublications()
            .pipe(
                tap(publications => this.publications.set(publications)),
                catchError(error => {
                    this.error.set('Error loading publications');
                    return of([]);
                })
            )
            .subscribe();
    }

    refreshPublicationStats(): void {
        // This would typically call an API endpoint that returns aggregated stats
        // For now, we'll compute basic stats from loaded data
        const publications = this.publications();
        this.pubStats.set({
            totalPublications       : publications.length,
            pendingAcknowledgments  : 0, // Would be calculated from API
            completedAcknowledgments: 0, // Would be calculated from API
            overdueProcedures       : 0 // Would be calculated from API
        });
    }

    // Reset methods
    resetSelectedProcedure(): void {
        this.selectedProcedure.set(null);
        this.currentVersion.set(null);
        this.procedureVersions.set([]);
        this.versionDiff.set(null);
    }

    resetError(): void {
        this.error.set(null);
    }
}
