import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { Router }                                                               from '@angular/router';
import { FormControl, ReactiveFormsModule }                                     from '@angular/forms';
import { MatButtonModule }                                                      from '@angular/material/button';
import { MatCardModule }                                                        from '@angular/material/card';
import { MatChipsModule }                                                       from '@angular/material/chips';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatIconModule }                                                        from '@angular/material/icon';
import { MatInputModule }                                                       from '@angular/material/input';
import { MatProgressSpinnerModule }                                             from '@angular/material/progress-spinner';
import { MatSelectModule }                                                      from '@angular/material/select';
import { MatTabsModule }                                                        from '@angular/material/tabs';
import { MatTooltipModule }                                                     from '@angular/material/tooltip';
import { MatBadgeModule }                                                       from '@angular/material/badge';
import { debounceTime, distinctUntilChanged, startWith }                        from 'rxjs/operators';
import { toSignal }                                                             from '@angular/core/rxjs-interop';
import { Publication }                                                          from '@modules/admin/procedures/domain/interfaces';
import { PublicationsService }                                                  from '@modules/admin/procedures/services';

interface WorkerPublication extends Publication {
    isRead: boolean;
    isOverdue: boolean;
    acknowledgedAt?: Date;
    daysRemaining?: number;
}

@Component({
    selector       : 'app-worker-inbox',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTabsModule,
        MatTooltipModule,
        MatBadgeModule
    ],
    template       : `
        <div class="flex flex-col h-full">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900">Procedure Inbox</h2>
                    <p class="text-sm text-gray-600 mt-1">Review and acknowledge workplace procedures</p>
                </div>

                <!-- Summary badges -->
                <div class="flex items-center gap-4">
                    <div class="text-center">
                        <div class="text-xl font-bold text-red-600">{{ getOverdueCount() }}</div>
                        <div class="text-xs text-gray-600">Overdue</div>
                    </div>
                    <div class="text-center">
                        <div class="text-xl font-bold text-amber-600">{{ getPendingCount() }}</div>
                        <div class="text-xs text-gray-600">Pending</div>
                    </div>
                    <div class="text-center">
                        <div class="text-xl font-bold text-green-600">{{ getCompletedCount() }}</div>
                        <div class="text-xs text-gray-600">Completed</div>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <mat-card class="mb-6">
                <mat-card-content class="pt-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Search -->
                        <mat-form-field>
                            <mat-label>Search procedures</mat-label>
                            <mat-icon matPrefix>search</mat-icon>
                            <input matInput [formControl]="searchControl" placeholder="Title, category...">
                            @if (searchControl.value) {
                                <button matSuffix mat-icon-button (click)="clearSearch()">
                                    <mat-icon>clear</mat-icon>
                                </button>
                            }
                        </mat-form-field>

                        <!-- Status filter -->
                        <mat-form-field>
                            <mat-label>Status</mat-label>
                            <mat-select [formControl]="statusControl">
                                <mat-option value="">All Status</mat-option>
                                <mat-option value="pending">Pending</mat-option>
                                <mat-option value="overdue">Overdue</mat-option>
                                <mat-option value="completed">Completed</mat-option>
                            </mat-select>
                        </mat-form-field>

                        <!-- Priority filter -->
                        <mat-form-field>
                            <mat-label>Priority</mat-label>
                            <mat-select [formControl]="priorityControl">
                                <mat-option value="">All Priorities</mat-option>
                                <mat-option value="high">High Priority</mat-option>
                                <mat-option value="normal">Normal</mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Tabs for different views -->
            <mat-card class="flex-1 overflow-hidden">
                <mat-card-content class="p-0 h-full">
                    <mat-tab-group class="h-full">
                        <!-- All Publications -->
                        <mat-tab label="All" [matBadge]="filteredPublications().length" matBadgePosition="after">
                            <div class="p-4 h-full overflow-auto">
                                @if (isLoading()) {
                                    <div class="flex items-center justify-center h-64">
                                        <mat-progress-spinner diameter="40"></mat-progress-spinner>
                                    </div>
                                } @else {
                                    <div class="space-y-4">
                                        @for (publication of filteredPublications(); track publication.id) {
                                            <mat-card class="hover:shadow-md transition-shadow cursor-pointer"
                                                      [class]="getPublicationCardClass(publication)"
                                                      (click)="openPublication(publication.id)">
                                                <mat-card-content class="pt-4">
                                                    <div class="flex items-start justify-between">
                                                        <div class="flex-1">
                                                            <!-- Publication header -->
                                                            <div class="flex items-center gap-2 mb-2">
                                                                <mat-icon [class]="getStatusIconClass(publication)">
                                                                    {{ getStatusIcon(publication) }}
                                                                </mat-icon>
                                                                <h3 class="text-lg font-semibold">
                                                                    {{ publication.version?.procedure?.title || 'Untitled' }}
                                                                </h3>
                                                                @if (publication.isOverdue) {
                                                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                                                        Overdue
                                                                    </span>
                                                                } @else if (!publication.isRead) {
                                                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                                                        New
                                                                    </span>
                                                                }
                                                            </div>

                                                            <!-- Publication details -->
                                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                                <div>
                                                                    <div class="text-sm text-gray-600">Version</div>
                                                                    <div class="font-medium">{{ publication.version?.number }}</div>
                                                                </div>
                                                                <div>
                                                                    <div class="text-sm text-gray-600">Category</div>
                                                                    <div class="font-medium">{{ publication.version?.procedure?.category || 'General' }}</div>
                                                                </div>
                                                                <div>
                                                                    <div class="text-sm text-gray-600">Published</div>
                                                                    <div class="font-medium">{{ publication.createdAt | date:'mediumDate' }}</div>
                                                                </div>
                                                                @if (publication.validUntil) {
                                                                    <div>
                                                                        <div class="text-sm text-gray-600">Valid Until</div>
                                                                        <div class="font-medium">{{ publication.validUntil | date:'mediumDate' }}</div>
                                                                    </div>
                                                                }
                                                            </div>

                                                            <!-- Legal notice -->
                                                            @if (publication.version?.modifiesInternalRegulations) {
                                                                <div class="flex items-center p-2 bg-red-50 border border-red-200 rounded mb-3">
                                                                    <mat-icon class="text-red-500 mr-2 text-sm">gavel</mat-icon>
                                                                    <span class="text-sm text-red-800">
                                                                        Modifies Internal Regulations - Mandatory Acknowledgment Required
                                                                    </span>
                                                                </div>
                                                            }

                                                            <!-- Message -->
                                                            @if (publication.message) {
                                                                <div class="p-3 bg-blue-50 border border-blue-200 rounded mb-3">
                                                                    <p class="text-sm text-blue-900">{{ publication.message }}</p>
                                                                </div>
                                                            }

                                                            <!-- Legal references -->
                                                            @if (publication.version?.legalReferences?.length) {
                                                                <div class="mb-3">
                                                                    <div class="text-sm text-gray-600 mb-2">Legal References:</div>
                                                                    <div class="flex flex-wrap gap-1">
                                                                        @for (ref of publication.version.legalReferences.slice(0, 3); track $index) {
                                                                            <span class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                                                                {{ ref.norma }}
                                                                                @if (ref.articulo) {
                                                                                    <span class="ml-1">{{ ref.articulo }}</span>
                                                                                }
                                                                            </span>
                                                                        }
                                                                        @if (publication.version.legalReferences.length > 3) {
                                                                            <span class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                                                                +{{ publication.version.legalReferences.length - 3 }} more
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            }

                                                            <!-- Actions -->
                                                            <div class="flex items-center gap-2 mt-3">
                                                                @if (publication.pdfUrl) {
                                                                    <button mat-button color="accent" (click)="viewPDF(publication.pdfUrl); $event.stopPropagation()">
                                                                        <mat-icon>picture_as_pdf</mat-icon>
                                                                        View PDF
                                                                    </button>
                                                                }

                                                                @if (!publication.isRead) {
                                                                    <button mat-raised-button color="primary"
                                                                            (click)="openPublication(publication.id); $event.stopPropagation()">
                                                                        <mat-icon>visibility</mat-icon>
                                                                        Read & Acknowledge
                                                                    </button>
                                                                } @else if (publication.acknowledgedAt) {
                                                                    <div class="flex items-center text-green-600">
                                                                        <mat-icon class="mr-1 text-sm">check_circle</mat-icon>
                                                                        <span class="text-sm">
                                                                            Acknowledged {{ publication.acknowledgedAt | date:'short' }}
                                                                        </span>
                                                                    </div>
                                                                }
                                                            </div>

                                                            <!-- Time remaining -->
                                                            @if (publication.daysRemaining !== undefined && publication.daysRemaining >= 0) {
                                                                <div class="mt-2">
                                                                    <div class="text-xs text-gray-500">
                                                                        {{ publication.daysRemaining }} day{{ publication.daysRemaining === 1 ? '' : 's' }} remaining
                                                                    </div>
                                                                    <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                                        <div class="h-1.5 rounded-full transition-all"
                                                                             [class]="getProgressBarClass(publication)"
                                                                             [style.width.%]="getTimeRemainingPercentage(publication)">
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            }
                                                        </div>
                                                    </div>
                                                </mat-card-content>
                                            </mat-card>
                                        }

                                        @if (filteredPublications().length === 0) {
                                            <div class="text-center py-12">
                                                <mat-icon class="text-gray-400 text-6xl mb-4">inbox</mat-icon>
                                                <h3 class="text-lg font-medium text-gray-900 mb-2">No procedures found</h3>
                                                <p class="text-gray-500">{{ getEmptyStateMessage() }}</p>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        </mat-tab>

                        <!-- Pending Publications -->
                        <mat-tab label="Pending" [matBadge]="getPendingCount()" matBadgePosition="after">
                            <div class="p-4 h-full overflow-auto">
                                <div class="space-y-4">
                                    @for (publication of getPendingPublications(); track publication.id) {
                                        <mat-card class="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-amber-500"
                                                  (click)="openPublication(publication.id)">
                                            <!-- Same card content as above but filtered for pending -->
                                            <mat-card-content class="pt-4">
                                                <!-- Simplified pending view -->
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <h3 class="text-lg font-semibold mb-1">
                                                            {{ publication.version?.procedure?.title || 'Untitled' }}
                                                        </h3>
                                                        <p class="text-sm text-gray-600 mb-2">
                                                            Published {{ publication.createdAt | date:'mediumDate' }}
                                                        </p>
                                                        @if (publication.daysRemaining !== undefined) {
                                                            <p class="text-sm"
                                                               [class]="publication.daysRemaining <= 3 ? 'text-red-600' : 'text-amber-600'">
                                                                {{ publication.daysRemaining }} day{{ publication.daysRemaining === 1 ? '' : 's' }} remaining
                                                            </p>
                                                        }
                                                    </div>
                                                    <button mat-raised-button color="primary">
                                                        <mat-icon>visibility</mat-icon>
                                                        Review
                                                    </button>
                                                </div>
                                            </mat-card-content>
                                        </mat-card>
                                    }
                                </div>
                            </div>
                        </mat-tab>

                        <!-- Completed Publications -->
                        <mat-tab label="Completed" [matBadge]="getCompletedCount()" matBadgePosition="after">
                            <div class="p-4 h-full overflow-auto">
                                <div class="space-y-4">
                                    @for (publication of getCompletedPublications(); track publication.id) {
                                        <mat-card class="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-green-500"
                                                  (click)="openPublication(publication.id)">
                                            <mat-card-content class="pt-4">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <h3 class="text-lg font-semibold mb-1">
                                                            {{ publication.version?.procedure?.title || 'Untitled' }}
                                                        </h3>
                                                        <div class="flex items-center text-green-600 text-sm">
                                                            <mat-icon class="mr-1 text-sm">check_circle</mat-icon>
                                                            <span>Acknowledged {{ publication.acknowledgedAt | date:'short' }}</span>
                                                        </div>
                                                    </div>
                                                    <button mat-button>
                                                        <mat-icon>visibility</mat-icon>
                                                        View
                                                    </button>
                                                </div>
                                            </mat-card-content>
                                        </mat-card>
                                    }
                                </div>
                            </div>
                        </mat-tab>
                    </mat-tab-group>
                </mat-card-content>
            </mat-card>
        </div>
    `
})
export class WorkerInboxComponent implements OnInit {
    private publicationsService = inject(PublicationsService);
    private router = inject(Router);

    // Form controls
    searchControl = new FormControl('');
    statusControl = new FormControl('');
    priorityControl = new FormControl('');

    // State
    isLoading = signal(false);
    publications = signal<WorkerPublication[]>([]);

    // Search signals
    searchValue = toSignal(this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
    ), {initialValue: ''});

    statusValue = toSignal(this.statusControl.valueChanges.pipe(startWith('')), {initialValue: ''});
    priorityValue = toSignal(this.priorityControl.valueChanges.pipe(startWith('')), {initialValue: ''});

    // Computed signals
    filteredPublications = computed(() => {
        const pubs = this.publications();
        const search = this.searchValue()?.toLowerCase() || '';
        const status = this.statusValue();
        const priority = this.priorityValue();

        return pubs.filter(pub => {
            // Search filter
            if (search && !pub.version?.procedure?.title?.toLowerCase().includes(search)) {
                return false;
            }

            // Status filter
            if (status) {
                if (status === 'pending' && pub.isRead) return false;
                if (status === 'overdue' && !pub.isOverdue) return false;
                if (status === 'completed' && !pub.isRead) return false;
            }

            // Priority filter (mock logic)
            if (priority) {
                if (priority === 'high' && !pub.version?.modifiesInternalRegulations) return false;
                if (priority === 'normal' && pub.version?.modifiesInternalRegulations) return false;
            }

            return true;
        });
    });

    ngOnInit(): void {
        this.loadPublications();
    }

    private async loadPublications(): Promise<void> {
        this.isLoading.set(true);
        try {
            // In a real app, this would load user's publications
            const publications = await this.publicationsService.getPublications().toPromise() || [];

            // Transform to WorkerPublication format with mock data
            const workerPublications = publications.map(pub => this.transformToWorkerPublication(pub));

            this.publications.set(workerPublications);
        } catch (error) {
            console.error('Error loading publications:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    private transformToWorkerPublication(pub: Publication): WorkerPublication {
        // Mock transformation - in real app this would come from acknowledgment data
        const isRead = Math.random() > 0.6; // Mock: 40% chance of being read
        const isOverdue = pub.validUntil ? new Date() > new Date(pub.validUntil) : false;
        const acknowledgedAt = isRead ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined;

        let daysRemaining: number | undefined;
        if (pub.validUntil && !isRead) {
            const timeRemaining = new Date(pub.validUntil).getTime() - new Date().getTime();
            daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
        }

        return {
            ...pub,
            isRead,
            isOverdue,
            acknowledgedAt,
            daysRemaining
        };
    }

    // Count methods
    getOverdueCount(): number {
        return this.publications().filter(p => p.isOverdue).length;
    }

    getPendingCount(): number {
        return this.publications().filter(p => !p.isRead && !p.isOverdue).length;
    }

    getCompletedCount(): number {
        return this.publications().filter(p => p.isRead).length;
    }

    // Filter methods
    getPendingPublications(): WorkerPublication[] {
        return this.filteredPublications().filter(p => !p.isRead && !p.isOverdue);
    }

    getCompletedPublications(): WorkerPublication[] {
        return this.filteredPublications().filter(p => p.isRead);
    }

    // UI helper methods
    getPublicationCardClass(publication: WorkerPublication): string {
        if (publication.isOverdue) return 'border-l-4 border-red-500';
        if (!publication.isRead) return 'border-l-4 border-blue-500';
        return 'border-l-4 border-green-500';
    }

    getStatusIcon(publication: WorkerPublication): string {
        if (publication.isOverdue) return 'error';
        if (!publication.isRead) return 'schedule';
        return 'check_circle';
    }

    getStatusIconClass(publication: WorkerPublication): string {
        if (publication.isOverdue) return 'text-red-500';
        if (!publication.isRead) return 'text-blue-500';
        return 'text-green-500';
    }

    getProgressBarClass(publication: WorkerPublication): string {
        if (!publication.daysRemaining) return 'bg-gray-400';
        if (publication.daysRemaining <= 1) return 'bg-red-500';
        if (publication.daysRemaining <= 3) return 'bg-amber-500';
        return 'bg-green-500';
    }

    getTimeRemainingPercentage(publication: WorkerPublication): number {
        if (!publication.daysRemaining || !publication.validUntil) return 0;

        const totalDays = Math.ceil(
            (new Date(publication.validUntil).getTime() - new Date(publication.createdAt).getTime())
            / (1000 * 60 * 60 * 24)
        );

        return Math.max(0, Math.min(100, (publication.daysRemaining / totalDays) * 100));
    }

    getEmptyStateMessage(): string {
        const status = this.statusValue();
        const search = this.searchValue();

        if (search) return `No procedures match "${ search }"`;
        if (status === 'pending') return 'No pending procedures';
        if (status === 'completed') return 'No completed procedures';
        if (status === 'overdue') return 'No overdue procedures';

        return 'No procedures assigned to you';
    }

    // Actions
    clearSearch(): void {
        this.searchControl.setValue('');
    }

    openPublication(publicationId: string): void {
        this.router.navigate([ '/inbox/procedures/publication', publicationId ]);
    }

    viewPDF(pdfUrl: string): void {
        window.open(pdfUrl, '_blank');
    }
}
