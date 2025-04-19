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
import { TableBuilderComponent }                                                               from '@shared/components/table-builder/table-builder.component';
import { MatInput }                                                                            from '@angular/material/input';
import { MatSlideToggle }                                                                      from '@angular/material/slide-toggle';
import { debounceTime, firstValueFrom }                                                        from 'rxjs';
import { FeatureTogglesService }                                                               from '../../feature-toggles.service';
import { MatOption, MatSelect }                                                                from '@angular/material/select';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';

@Component({
    selector   : 'app-list',
    standalone : true,
    imports    : [
        CommonModule,
        MatFormFieldModule,
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIconAnchor,
        MatIcon,
        ReactiveFormsModule,
        TableBuilderComponent,
        MatInput,
        TranslocoPipe,
        MatIconButton,
        MatSlideToggle,
        MatSelect,
        MatOption,
        MatButton
    ],
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

    // Resource for loading feature toggles
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
                console.log(this.parentIdControlSignal());
                params.parentId = this.parentIdControl.value;
            }

            if (this.enabledControlSignal() && this.enabledControlSignal() !== '') {
                params.enabled = this.enabledControl.value;
            }

            return params;
        },
        loader : ({request}) => {
            console.log(request);
            return firstValueFrom(this.#service.findAll(request));
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

        this.#service.toggle(feature.id, enabled).subscribe({
            next : () => {
                const message = enabled
                    ? this.#ts.translate('maintainers.feature-toggles.messages.enabled')
                    : this.#ts.translate('maintainers.feature-toggles.messages.disabled');
                this.#notyfService.success(message);
                this.featureTogglesResource.reload();
            },
            error: () => {
                this.#notyfService.error(this.#ts.translate('errors.service.message'));
                // Revert the toggle state
                event.source.checked = !enabled;
            }
        });
    }

    deleteFeature(feature: any) {
        if (confirm(this.#ts.translate('maintainers.feature-toggles.messages.confirmDelete'))) {
            this.#service.delete(feature.id).subscribe({
                next : () => {
                    this.#notyfService.success(this.#ts.translate('maintainers.feature-toggles.messages.deleted'));
                    this.featureTogglesResource.reload();
                },
                error: () => {
                    this.#notyfService.error(this.#ts.translate('errors.service.message'));
                }
            });
        }
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
