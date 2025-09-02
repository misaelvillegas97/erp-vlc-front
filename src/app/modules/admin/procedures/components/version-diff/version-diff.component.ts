import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule }                              from '@angular/common';
import { MatCardModule }                             from '@angular/material/card';
import { MatIconModule }                             from '@angular/material/icon';
import { MatTabsModule }                             from '@angular/material/tabs';

import { ProcedureVersion } from '../../domain/interfaces';

interface SectionDiff {
    sectionIndex: number;
    title: string;
    oldTitle?: string;
    newTitle?: string;
    oldBody?: string;
    newBody?: string;
    type: 'added' | 'removed' | 'modified' | 'unchanged';
    bodyDiff?: string; // HTML diff for body content
}

@Component({
    selector       : 'app-version-diff',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatTabsModule
    ],
    template       : `
        <div class="space-y-4">
            <!-- Diff Summary -->
            <mat-card>
                <mat-card-header>
                    <mat-card-title class="flex items-center">
                        <mat-icon class="mr-2">compare_arrows</mat-icon>
                        Version Comparison
                    </mat-card-title>
                    <mat-card-subtitle>
                        Comparing Version {{ currentVersion().number }} with Version {{ compareVersion()?.number }}
                    </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content class="pt-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600">{{ getAddedCount() }}</div>
                            <div class="text-sm text-gray-600">Added</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">{{ getModifiedCount() }}</div>
                            <div class="text-sm text-gray-600">Modified</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-red-600">{{ getRemovedCount() }}</div>
                            <div class="text-sm text-gray-600">Removed</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-600">{{ getUnchangedCount() }}</div>
                            <div class="text-sm text-gray-600">Unchanged</div>
                        </div>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Section Diffs -->
            <div class="space-y-4">
                @for (sectionDiff of getSectionDiffs(); track sectionDiff.sectionIndex) {
                    <mat-card [class]="getSectionCardClass(sectionDiff.type)">
                        <mat-card-header>
                            <mat-card-title class="flex items-center">
                                <mat-icon [class]="getSectionIconClass(sectionDiff.type)" class="mr-2">
                                    {{ getSectionIcon(sectionDiff.type) }}
                                </mat-icon>
                                <span>{{ sectionDiff.title }}</span>
                                <span class="ml-2 px-2 py-1 rounded text-xs font-medium"
                                      [class]="getSectionBadgeClass(sectionDiff.type)">
                                    {{ getSectionTypeText(sectionDiff.type) }}
                                </span>
                            </mat-card-title>
                        </mat-card-header>
                        <mat-card-content class="pt-4">
                            <!-- Title changes -->
                            @if (sectionDiff.type === 'modified' && sectionDiff.oldTitle !== sectionDiff.newTitle) {
                                <div class="mb-4">
                                    <h4 class="text-sm font-medium text-gray-600 mb-2">Title Changes:</h4>
                                    <div class="space-y-1">
                                        @if (sectionDiff.oldTitle) {
                                            <div class="p-2 bg-red-50 border-l-4 border-red-400">
                                                <span class="text-red-800 line-through">{{ sectionDiff.oldTitle }}</span>
                                            </div>
                                        }
                                        @if (sectionDiff.newTitle) {
                                            <div class="p-2 bg-green-50 border-l-4 border-green-400">
                                                <span class="text-green-800">{{ sectionDiff.newTitle }}</span>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }

                            <!-- Content changes -->
                            @switch (sectionDiff.type) {
                                @case ('added') {
                                    <div class="p-4 bg-green-50 border border-green-200 rounded">
                                        <h5 class="text-sm font-medium text-green-800 mb-2">New Content:</h5>
                                        <div class="prose prose-sm max-w-none text-green-900">
                                            <pre class="whitespace-pre-wrap font-sans">{{ sectionDiff.newBody }}</pre>
                                        </div>
                                    </div>
                                }
                                @case ('removed') {
                                    <div class="p-4 bg-red-50 border border-red-200 rounded">
                                        <h5 class="text-sm font-medium text-red-800 mb-2">Removed Content:</h5>
                                        <div class="prose prose-sm max-w-none text-red-900">
                                            <pre class="whitespace-pre-wrap font-sans line-through">{{ sectionDiff.oldBody }}</pre>
                                        </div>
                                    </div>
                                }
                                @case ('modified') {
                                    <div class="space-y-3">
                                        <mat-tab-group>
                                            <mat-tab label="Side by Side">
                                                <div class="pt-4">
                                                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        <div>
                                                            <h5 class="text-sm font-medium text-red-800 mb-2">Previous Version:</h5>
                                                            <div class="p-3 bg-red-50 border border-red-200 rounded max-h-96 overflow-auto">
                                                                <pre class="whitespace-pre-wrap font-sans text-sm text-red-900">{{ sectionDiff.oldBody }}</pre>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h5 class="text-sm font-medium text-green-800 mb-2">Current Version:</h5>
                                                            <div class="p-3 bg-green-50 border border-green-200 rounded max-h-96 overflow-auto">
                                                                <pre class="whitespace-pre-wrap font-sans text-sm text-green-900">{{ sectionDiff.newBody }}</pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </mat-tab>
                                            <mat-tab label="Inline Diff">
                                                <div class="pt-4">
                                                    @if (sectionDiff.bodyDiff) {
                                                        <div class="p-3 bg-gray-50 border border-gray-200 rounded max-h-96 overflow-auto"
                                                             [innerHTML]="sectionDiff.bodyDiff">
                                                        </div>
                                                    } @else {
                                                        <div class="p-3 bg-gray-50 border border-gray-200 rounded">
                                                            <p class="text-gray-600">Inline diff not available</p>
                                                        </div>
                                                    }
                                                </div>
                                            </mat-tab>
                                        </mat-tab-group>
                                    </div>
                                }
                                @case ('unchanged') {
                                    <div class="p-4 bg-gray-50 border border-gray-200 rounded">
                                        <div class="prose prose-sm max-w-none text-gray-800">
                                            <pre class="whitespace-pre-wrap font-sans">{{ sectionDiff.newBody || sectionDiff.oldBody }}</pre>
                                        </div>
                                    </div>
                                }
                            }
                        </mat-card-content>
                    </mat-card>
                }
            </div>

            <!-- Legal References Diff -->
            @if (hasLegalReferenceChanges()) {
                <mat-card>
                    <mat-card-header>
                        <mat-card-title class="flex items-center">
                            <mat-icon class="mr-2">gavel</mat-icon>
                            Legal References Changes
                        </mat-card-title>
                    </mat-card-header>
                    <mat-card-content class="pt-4">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- Previous references -->
                            <div>
                                <h5 class="text-sm font-medium text-red-800 mb-2">Previous References:</h5>
                                <div class="space-y-2">
                                    @for (ref of compareVersion()?.legalReferences || []; track $index) {
                                        <div class="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                            <span class="font-medium">{{ ref.norma }}</span>
                                            @if (ref.articulo) {
                                                <span class="text-red-700 ml-1">{{ ref.articulo }}</span>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                            
                            <!-- Current references -->
                            <div>
                                <h5 class="text-sm font-medium text-green-800 mb-2">Current References:</h5>
                                <div class="space-y-2">
                                    @for (ref of currentVersion().legalReferences || []; track $index) {
                                        <div class="p-2 bg-green-50 border border-green-200 rounded text-sm">
                                            <span class="font-medium">{{ ref.norma }}</span>
                                            @if (ref.articulo) {
                                                <span class="text-green-700 ml-1">{{ ref.articulo }}</span>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </mat-card-content>
                </mat-card>
            }
        </div>
    `
})
export class VersionDiffComponent {
    // Inputs
    currentVersion = input.required<ProcedureVersion>();
    compareVersion = input<ProcedureVersion | undefined>();
    diff = input<any>();

    getSectionDiffs(): SectionDiff[] {
        const current = this.currentVersion();
        const compare = this.compareVersion();

        if (!current || !compare) return [];

        const currentSections = current.content?.sections || [];
        const compareSections = compare.content?.sections || [];
        const diffs: SectionDiff[] = [];

        // Find all unique section indices
        const maxLength = Math.max(currentSections.length, compareSections.length);

        for (let i = 0; i < maxLength; i++) {
            const currentSection = currentSections[i];
            const compareSection = compareSections[i];

            if (currentSection && compareSection) {
                // Both sections exist - check for changes
                const titleChanged = currentSection.title !== compareSection.title;
                const bodyChanged = currentSection.body !== compareSection.body;

                if (titleChanged || bodyChanged) {
                    diffs.push({
                        sectionIndex: i,
                        title       : currentSection.title || `Section ${ i + 1 }`,
                        oldTitle    : compareSection.title,
                        newTitle    : currentSection.title,
                        oldBody     : compareSection.body,
                        newBody     : currentSection.body,
                        type        : 'modified',
                        bodyDiff    : this.generateSimpleDiff(compareSection.body, currentSection.body)
                    });
                } else {
                    diffs.push({
                        sectionIndex: i,
                        title       : currentSection.title || `Section ${ i + 1 }`,
                        newBody     : currentSection.body,
                        type        : 'unchanged'
                    });
                }
            } else if (currentSection && !compareSection) {
                // Section added
                diffs.push({
                    sectionIndex: i,
                    title       : currentSection.title || `Section ${ i + 1 }`,
                    newTitle    : currentSection.title,
                    newBody     : currentSection.body,
                    type        : 'added'
                });
            } else if (!currentSection && compareSection) {
                // Section removed
                diffs.push({
                    sectionIndex: i,
                    title       : compareSection.title || `Section ${ i + 1 }`,
                    oldTitle    : compareSection.title,
                    oldBody     : compareSection.body,
                    type        : 'removed'
                });
            }
        }

        return diffs;
    }

    private generateSimpleDiff(oldText: string, newText: string): string {
        // Simple word-based diff - in a real implementation you'd use a library like diff2html
        const oldWords = oldText.split(/(\s+)/);
        const newWords = newText.split(/(\s+)/);

        // This is a simplified diff - just highlights major changes
        let diffHtml = '';
        const maxLength = Math.max(oldWords.length, newWords.length);

        for (let i = 0; i < maxLength; i++) {
            const oldWord = oldWords[i] || '';
            const newWord = newWords[i] || '';

            if (oldWord === newWord) {
                diffHtml += `<span>${ newWord }</span>`;
            } else {
                if (oldWord) {
                    diffHtml += `<del class="bg-red-200 text-red-800 px-1">${ oldWord }</del>`;
                }
                if (newWord) {
                    diffHtml += `<ins class="bg-green-200 text-green-800 px-1">${ newWord }</ins>`;
                }
            }
        }

        return diffHtml;
    }

    getAddedCount(): number {
        return this.getSectionDiffs().filter(d => d.type === 'added').length;
    }

    getModifiedCount(): number {
        return this.getSectionDiffs().filter(d => d.type === 'modified').length;
    }

    getRemovedCount(): number {
        return this.getSectionDiffs().filter(d => d.type === 'removed').length;
    }

    getUnchangedCount(): number {
        return this.getSectionDiffs().filter(d => d.type === 'unchanged').length;
    }

    getSectionCardClass(type: SectionDiff['type']): string {
        const baseClass = 'transition-shadow hover:shadow-md';
        switch (type) {
            case 'added':
                return `${ baseClass } border-l-4 border-green-500`;
            case 'removed':
                return `${ baseClass } border-l-4 border-red-500`;
            case 'modified':
                return `${ baseClass } border-l-4 border-blue-500`;
            case 'unchanged':
                return `${ baseClass } border-l-4 border-gray-300`;
        }
    }

    getSectionIconClass(type: SectionDiff['type']): string {
        switch (type) {
            case 'added':
                return 'text-green-600';
            case 'removed':
                return 'text-red-600';
            case 'modified':
                return 'text-blue-600';
            case 'unchanged':
                return 'text-gray-600';
        }
    }

    getSectionIcon(type: SectionDiff['type']): string {
        switch (type) {
            case 'added':
                return 'add_circle';
            case 'removed':
                return 'remove_circle';
            case 'modified':
                return 'edit';
            case 'unchanged':
                return 'check_circle';
        }
    }

    getSectionBadgeClass(type: SectionDiff['type']): string {
        switch (type) {
            case 'added':
                return 'bg-green-100 text-green-800';
            case 'removed':
                return 'bg-red-100 text-red-800';
            case 'modified':
                return 'bg-blue-100 text-blue-800';
            case 'unchanged':
                return 'bg-gray-100 text-gray-800';
        }
    }

    getSectionTypeText(type: SectionDiff['type']): string {
        switch (type) {
            case 'added':
                return 'Added';
            case 'removed':
                return 'Removed';
            case 'modified':
                return 'Modified';
            case 'unchanged':
                return 'Unchanged';
        }
    }

    hasLegalReferenceChanges(): boolean {
        const current = this.currentVersion();
        const compare = this.compareVersion();

        if (!current || !compare) return false;

        const currentRefs = JSON.stringify(current.legalReferences || []);
        const compareRefs = JSON.stringify(compare.legalReferences || []);

        return currentRefs !== compareRefs;
    }
}
