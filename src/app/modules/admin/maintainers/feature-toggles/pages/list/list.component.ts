import { Component, inject, resource, Signal, signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { CommonModule }                                                                        from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators }                                        from '@angular/forms';
import { ColumnConfig }                                                                        from '@shared/components/table-builder/column.type';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                 from '@ngneat/transloco';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { MatTooltip }                                                                          from '@angular/material/tooltip';
import { RouterLink }                                                                          from '@angular/router';
import { MatButton, MatIconAnchor, MatIconButton }                                             from '@angular/material/button';
import { MatIcon }                                                                             from '@angular/material/icon';
import { MatInput }                                                                            from '@angular/material/input';
import { MatSlideToggle }                                                                      from '@angular/material/slide-toggle';
import { debounceTime, firstValueFrom, tap }                                                   from 'rxjs';
import { FeatureTogglesService }                                                               from '../../feature-toggles.service';
import { MatOption, MatSelect }                                                                from '@angular/material/select';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { MatTreeModule, MatTreeNestedDataSource }                                              from '@angular/material/tree';
import { NestedTreeControl }                                                                   from '@angular/cdk/tree';
import { FeatureToggleEntity }                                                                 from '../../domain/model/feature-toggle';
import { MatTabsModule }                                                                       from '@angular/material/tabs';

@Component({
    selector   : 'app-list',
    standalone : true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIconAnchor,
        MatIcon,
        ReactiveFormsModule,
        MatInput,
        TranslocoPipe,
        MatIconButton,
        MatSlideToggle,
        MatSelect,
        MatOption,
        MatButton,
        MatTreeModule,
        MatTabsModule
    ],
    styles     : [],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #ts = inject(TranslocoService);
    readonly #service = inject(FeatureTogglesService);
    readonly #notyfService = inject(NotyfService);

    searchControl = new FormControl(undefined, [ Validators.minLength(3), Validators.maxLength(100) ]);
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(1_000)));
    categoryControl = new FormControl(undefined);
    categoryControlSignal = toSignal(this.categoryControl.valueChanges.pipe(debounceTime(1_000)));
    parentIdControl = new FormControl(undefined);
    parentIdControlSignal = toSignal(this.parentIdControl.valueChanges.pipe(debounceTime(1_000)));
    enabledControl = new FormControl<string>(undefined);
    enabledControlSignal = toSignal(this.enabledControl.valueChanges.pipe(debounceTime(1_000)));

    actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell', {read: TemplateRef});
    toggleCell: Signal<TemplateRef<any>> = viewChild('toggleCell', {read: TemplateRef});

    // Tree control for nested data
    treeControl = new NestedTreeControl<FeatureToggleEntity>(node => node.children);

    // Map to store feature toggles by category
    categorizedFeatures: Map<string, FeatureToggleEntity[]> = new Map();

    // Map to store data sources by category
    categoryDataSources: Map<string, MatTreeNestedDataSource<FeatureToggleEntity>> = new Map();

    // Set to track expanded categories
    expandedCategories: Set<string> = new Set();

    // Resource for loading feature toggles in hierarchical structure
    featureTogglesResource = resource({
        request: () => {
            const params: Record<string, string> = {};

            // Only add parameters that have values
            if (this.searchControlSignal() && this.searchControlSignal() !== '') {
                params.search = this.searchControl.value;
            }

            if (this.categoryControlSignal() && this.categoryControlSignal() !== '') {
                params.category = this.categoryControl.value;
            }

            if (this.parentIdControlSignal() && this.parentIdControlSignal() !== '') {
                params.parentId = this.parentIdControl.value;
            }

            if (this.enabledControlSignal() && this.enabledControlSignal() !== '') {
                params.enabled = this.enabledControl.value;
            }

            return params;
        },
        loader: async ({request}) => {
            // If we're filtering, use findAll with filters
            if (Object.keys(request).length > 0) {
                const features = await firstValueFrom(this.#service.findAll(request));
                this.processFeatures(features);
                return features;
            }

            // Otherwise, use getHierarchy to get the hierarchical structure
            const features = await firstValueFrom(this.#service.getHierarchy());
            this.processFeatures(features);
            return features;
        }
    });

    // Categories for filtering
    categoriesResource = resource({
        loader: async () => {
            const features = await firstValueFrom(this.#service.findAll());
            return [ ...new Set(features.map(f => f.category).filter(Boolean)) ];
        }
    });

    // Parents for filtering
    parentsResource = resource({
        loader: async () => {
            const features = await firstValueFrom(this.#service.findAll());
            // Only return features that have children
            return features.filter(f => f.children?.length > 0);
        }
    });

    // Column configuration for the table
    columnsConfig: WritableSignal<ColumnConfig<any>[]> = signal(undefined);

    // Process features to organize them by category and set up the tree data sources
    processFeatures(features: FeatureToggleEntity[]): void {
        // Save current expanded categories
        const previouslyExpandedCategories = new Set(this.expandedCategories);

        // Reset the maps
        this.categorizedFeatures.clear();
        this.categoryDataSources.clear();
        this.expandedCategories.clear();

        // Group features by category
        features.forEach(feature => {
            const category = feature.category || 'Sin categoría';
            if (!this.categorizedFeatures.has(category)) {
                this.categorizedFeatures.set(category, []);
                // Create a new data source for this category
                this.categoryDataSources.set(category, new MatTreeNestedDataSource<FeatureToggleEntity>());

                // If this category was previously expanded, keep it expanded
                if (previouslyExpandedCategories.has(category)) {
                    this.expandedCategories.add(category);
                }
            }
            this.categorizedFeatures.get(category).push(feature);
        });

        // For each category, set up its tree data source with root-level features
        this.categorizedFeatures.forEach((categoryFeatures, category) => {
            // Get root features for this category (those without parents or with parents outside this category)
            const rootFeatures = categoryFeatures.filter(f =>
                !f.parentId || !categoryFeatures.some(cf => cf.id === f.parentId)
            );

            // Set the data source for this category
            this.categoryDataSources.get(category).data = rootFeatures;

            // If there are no expanded categories yet, expand the first one by default
            if (this.expandedCategories.size === 0 && category === Array.from(this.categorizedFeatures.keys())[0]) {
                this.expandedCategories.add(category);
            }
        });

        // Expand all nodes by default
        setTimeout(() => {
            this.treeControl.expandAll();
        }, 100);
    }

    // Toggle category expansion
    toggleCategory(category: string): void {
        if (this.expandedCategories.has(category)) {
            this.expandedCategories.delete(category);
        } else {
            this.expandedCategories.add(category);
        }
    }

    // Check if a node has children
    hasChild = (_: number, node: FeatureToggleEntity) => !!node.children && node.children.length > 0;

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    buildColumnsConfig = (): ColumnConfig<any>[] => [
        {
            key    : 'name',
            header : this.#ts.translate('maintainers.feature-toggles.fields.name'),
            display: {type: 'text'},
            visible: true
        },
        {
            key    : 'displayName',
            header : this.#ts.translate('maintainers.feature-toggles.fields.display-name'),
            display: {type: 'text'},
            visible: true
        },
        {
            key    : 'category',
            header : this.#ts.translate('maintainers.feature-toggles.fields.category'),
            display: {type: 'text'},
            visible: true
        },
        {
            key    : 'enabled',
            header : this.#ts.translate('maintainers.feature-toggles.fields.enabled'),
            visible: true,
            display: {
                type          : 'custom',
                customTemplate: this.toggleCell()
            }
        },
        {
            key    : 'actions',
            header : '',
            visible: true,
            display: {
                type          : 'custom',
                customTemplate: this.actionsCell()
            }
        }
    ];

    toggleFeature(feature: any, event: any) {
        const enabled = event.checked;

        // Store the expanded state of tree nodes
        const expandedNodes = new Set<string>();
        this.treeControl.dataNodes.forEach(node => {
            if (this.treeControl.isExpanded(node)) {
                expandedNodes.add(node.id);
            }
        });

        this.#service.toggle(feature.id, enabled).pipe(
            // Update the feature in-place without reloading the entire data
            tap(() => {
                // Update the feature in the categorizedFeatures map
                const category = feature.category || 'Sin categoría';
                const features = this.categorizedFeatures.get(category);
                if (features) {
                    const featureIndex = features.findIndex(f => f.id === feature.id);
                    if (featureIndex !== -1) {
                        features[featureIndex].enabled = enabled;
                    }
                }

                // Update the feature in the tree data source
                this.updateFeatureInTree(feature.id, {enabled});

                // Restore the expanded state of tree nodes
                setTimeout(() => {
                    this.treeControl.dataNodes.forEach(node => {
                        if (expandedNodes.has(node.id)) {
                            this.treeControl.expand(node);
                        }
                    });
                }, 0);
            })
        ).subscribe({
            next : () => {
                const message = enabled
                    ? this.#ts.translate('maintainers.feature-toggles.messages.enabled')
                    : this.#ts.translate('maintainers.feature-toggles.messages.disabled');
                this.#notyfService.success(message);
            },
            error: () => {
                this.#notyfService.error(this.#ts.translate('errors.service.message'));
                // Revert the toggle state
                event.source.checked = !enabled;

                // Also revert the feature state in our data
                feature.enabled = !enabled;
            }
        });
    }

    // Helper method to update a feature in the tree
    updateFeatureInTree(featureId: string, updates: Partial<FeatureToggleEntity>): void {
        // Update the feature in all category data sources
        this.categorizedFeatures.forEach((features, category) => {
            const updateFeatureRecursively = (nodes: FeatureToggleEntity[]) => {
                for (const node of nodes) {
                    if (node.id === featureId) {
                        Object.assign(node, updates);
                    }
                    if (node.children?.length) {
                        updateFeatureRecursively(node.children);
                    }
                }
            };

            updateFeatureRecursively(features);

            // Update the data source
            const dataSource = this.categoryDataSources.get(category);
            if (dataSource) {
                const rootFeatures = features.filter(f =>
                    !f.parentId || !features.some(cf => cf.id === f.parentId)
                );
                dataSource.data = [ ...rootFeatures ]; // Create a new array to trigger change detection
            }
        });
    }

    deleteFeature(feature: any) {
        if (confirm(this.#ts.translate('maintainers.feature-toggles.messages.confirmDelete'))) {
            // Store the expanded state of tree nodes
            const expandedNodes = new Set<string>();
            this.treeControl.dataNodes.forEach(node => {
                if (this.treeControl.isExpanded(node)) {
                    expandedNodes.add(node.id);
                }
            });

            this.#service.delete(feature.id).pipe(
                // Remove the feature from our data without reloading
                tap(() => {
                    // Remove the feature from the categorizedFeatures map
                    const category = feature.category || 'Sin categoría';
                    const features = this.categorizedFeatures.get(category);
                    if (features) {
                        const featureIndex = features.findIndex(f => f.id === feature.id);
                        if (featureIndex !== -1) {
                            features.splice(featureIndex, 1);
                        }
                    }

                    // Remove the feature from all data sources
                    this.removeFeatureFromTree(feature.id);

                    // Restore the expanded state of tree nodes
                    setTimeout(() => {
                        this.treeControl.dataNodes.forEach(node => {
                            if (expandedNodes.has(node.id)) {
                                this.treeControl.expand(node);
                            }
                        });
                    }, 0);
                })
            ).subscribe({
                next : () => {
                    this.#notyfService.success(this.#ts.translate('maintainers.feature-toggles.messages.deleted'));
                },
                error: () => {
                    this.#notyfService.error(this.#ts.translate('errors.service.message'));
                }
            });
        }
    }

    // Helper method to remove a feature from the tree
    removeFeatureFromTree(featureId: string): void {
        // Remove the feature from all category data sources
        this.categorizedFeatures.forEach((features, category) => {
            // Remove the feature from the array
            const removeFeatureRecursively = (nodes: FeatureToggleEntity[]): FeatureToggleEntity[] => {
                return nodes.filter(node => {
                    if (node.id === featureId) {
                        return false; // Remove this node
                    }
                    if (node.children?.length) {
                        node.children = removeFeatureRecursively(node.children);
                    }
                    return true; // Keep this node
                });
            };

            const updatedFeatures = removeFeatureRecursively(features);
            this.categorizedFeatures.set(category, updatedFeatures);

            // Update the data source
            const dataSource = this.categoryDataSources.get(category);
            if (dataSource) {
                const rootFeatures = updatedFeatures.filter(f =>
                    !f.parentId || !updatedFeatures.some(cf => cf.id === f.parentId)
                );
                dataSource.data = [ ...rootFeatures ]; // Create a new array to trigger change detection
            }
        });
    }

    applyFilters() {
        this.featureTogglesResource.reload();
    }

    resetFilters() {
        this.searchControl.setValue(undefined);
        this.categoryControl.setValue(undefined);
        this.parentIdControl.setValue(undefined);
        this.enabledControl.setValue(undefined);
        this.featureTogglesResource.reload();
    }
}
