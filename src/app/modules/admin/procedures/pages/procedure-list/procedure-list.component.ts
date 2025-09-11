import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, TemplateRef, viewChild, Signal } from '@angular/core';
import { CommonModule }                                                                                         from '@angular/common';
import { Router, ActivatedRoute, Params }                                                               from '@angular/router';
import { FormControl, ReactiveFormsModule }                                                             from '@angular/forms';
import { MatButtonModule }                                                                              from '@angular/material/button';
import { MatCardModule }                                                                                from '@angular/material/card';
import { MatDialogModule, MatDialog }                                                                           from '@angular/material/dialog';
import { MatFormFieldModule }                                                                           from '@angular/material/form-field';
import { MatIconModule }                                                                                from '@angular/material/icon';
import { MatInputModule }                                                                               from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                     from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                              from '@angular/material/select';
import { MatTooltipModule }                                                                             from '@angular/material/tooltip';
import { MatDatepickerModule }                                                                          from '@angular/material/datepicker';
import { debounceTime, distinctUntilChanged, startWith }                                                from 'rxjs/operators';
import { toSignal }                                                                                     from '@angular/core/rxjs-interop';
import { PageHeaderComponent }                                                                          from '@layout/components/page-header/page-header.component';
import { TableBuilderComponent }                                                                        from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                                                                                 from '@shared/components/table-builder/column.type';
import { Color }                                                                                        from '@shared/components/badge/domain/model/badge.type';
import { NotyfService }                                                                                 from '@shared/services/notyf.service';
import { PdfViewerComponent }                                                                                   from '@shared/components/pdf-viewer/pdf-viewer.component';

import { ProcedureStore }         from '../../store/procedure.store';
import { Procedure }              from '../../domain/interfaces';
import { ProcedureVersionStatus } from '../../domain/enums';

@Component({
    selector       : 'app-procedure-list',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTooltipModule,
        MatDatepickerModule,
        PageHeaderComponent,
        TableBuilderComponent
    ],
    templateUrl    : './procedure-list.component.html',
})
export class ProcedureListComponent implements OnInit {
    private store = inject(ProcedureStore);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notyf = inject(NotyfService);
    private dialog = inject(MatDialog);

    // Template references
    actionsTemplate: Signal<TemplateRef<any>> = viewChild('actionsTemplate');

    // Form controls
    searchControl = new FormControl('');
    categoryControl = new FormControl('');
    statusControl = new FormControl('');

    // Store signals
    filteredProcedures = this.store.filteredProcedures;
    isLoading = this.store.isLoading;
    error = this.store.error;

    // Search signals from form controls
    searchValue = toSignal(this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
    ), {initialValue: ''});

    categoryValue = toSignal(this.categoryControl.valueChanges.pipe(startWith('')), {initialValue: ''});
    statusValue = toSignal(this.statusControl.valueChanges.pipe(startWith('')), {initialValue: ''});

    // Configuración de columnas
    columnsConfig = computed<ColumnConfig<Procedure>[]>(() => [
        {
            key     : 'code',
            header  : 'Código',
            sortable: true,
            visible : true
        },
        {
            key     : 'title',
            header  : 'Título',
            sortable: true,
            visible : true
        },
        {
            key     : 'category',
            header  : 'Categoría',
            sortable: true,
            visible : true
        },
        {
            key    : 'tags',
            header : 'Etiquetas',
            visible: true,
            render : (value: string[]) => {
                if (!value || value.length === 0) return '';
                return value.map(tag => `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-1">${ tag }</span>`).join('');
            }
        },
        {
            key    : 'status',
            header : 'Estado',
            visible: true,
            display: {
                type : 'badge',
                label: (value) => this.getStatusLabel(value),
                color: (value) => this.getStatusColor(value)
            }
        },
        {
            key     : 'updatedAt',
            header  : 'Actualizado',
            sortable: true,
            visible : true,
            display : {
                type: 'date'
            }
        },
        {
            key    : 'actions',
            header : 'Acciones',
            visible: true,
            display: {
                type          : 'custom',
                customTemplate: this.actionsTemplate()
            }
        }
    ]);

    ngOnInit(): void {
        this.store.loadProcedures();
        this.setupFilters();
        this.loadQueryParams();
    }

    private setupFilters(): void {
        // Update store filters when form controls change
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(search => {
            this.store.updateFilters({search: search || undefined});
            this.updateQueryParams();
        });

        this.categoryControl.valueChanges.subscribe(category => {
            this.store.updateFilters({category: category || undefined});
            this.updateQueryParams();
        });

        this.statusControl.valueChanges.subscribe(status => {
            this.store.updateFilters({
                status: status ? status as ProcedureVersionStatus : undefined
            });
            this.updateQueryParams();
        });
    }

    private loadQueryParams(): void {
        this.route.queryParams.subscribe(params => {
            if (params['search']) this.searchControl.setValue(params['search'], {emitEvent: false});
            if (params['category']) this.categoryControl.setValue(params['category'], {emitEvent: false});
            if (params['status']) this.statusControl.setValue(params['status'], {emitEvent: false});
        });
    }

    private updateQueryParams(): void {
        const queryParams: Params = {};
        if (this.searchControl.value) queryParams['search'] = this.searchControl.value;
        if (this.categoryControl.value) queryParams['category'] = this.categoryControl.value;
        if (this.statusControl.value) queryParams['status'] = this.statusControl.value;

        this.router.navigate([], {
            relativeTo         : this.route,
            queryParams,
            queryParamsHandling: 'merge'
        });
    }

    hasActiveFilters(): boolean {
        return !!(this.searchValue() || this.categoryValue() || this.statusValue());
    }

    clearFilters(): void {
        this.searchControl.setValue('');
        this.categoryControl.setValue('');
        this.statusControl.setValue('');
        this.store.clearFilters();
    }

    clearSearch(): void {
        this.searchControl.setValue('');
    }

    refresh(): void {
        this.store.loadProcedures();
    }

    getStatusText(status: string): string {
        const statusMap: Record<string, string> = {
            'draft'    : 'Borrador',
            'in_review': 'En Revisión',
            'approved' : 'Aprobado',
            'published': 'Publicado'
        };
        return statusMap[status] || status;
    }

    // Helper methods for column configuration
    private getStatusLabel(status: string): string {
        return this.getStatusText(status);
    }

    private getStatusColor(status: string): Color {
        const colorMap: Record<string, Color> = {
            'draft'    : 'gray',
            'in_review': 'amber',
            'approved' : 'green',
            'published': 'blue'
        };
        return colorMap[status] || 'gray';
    }

    // Navigation methods
    createProcedure(): void {
        this.router.navigate([ '../new' ], {relativeTo: this.route});
    }

    selectProcedure(id: string): void {
        this.store.selectProcedure(id);
        this.router.navigate([ id, 'edit' ], {relativeTo: this.route});
    }

    editProcedure(id: string): void {
        this.router.navigate([ id, 'edit' ], {relativeTo: this.route});
    }

    viewVersions(id: string): void {
        this.router.navigate([ id, 'versions' ], {relativeTo: this.route});
    }

    publishProcedure(id: string): void {
        this.router.navigate([ id, 'publish' ], {relativeTo: this.route});
    }

    openPdfViewer(procedure: Procedure): void {
        console.log(procedure);
        if (!procedure.latestVersionFile) {
            this.notyf.error('No hay archivo disponible para este procedimiento');
            return;
        }

        this.dialog.open(PdfViewerComponent, {
            data        : {
                filePath: procedure.latestVersionFile.path,
                title   : `${ procedure.code } - ${ procedure.title }`
            },
            disableClose: false,
            hasBackdrop : true,
            panelClass  : 'pdf-viewer-dialog-container'
        });
    }
}
