import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, TemplateRef, viewChild } from '@angular/core';
import { CommonModule }                                                                                 from '@angular/common';
import { Router, ActivatedRoute, Params }                                                               from '@angular/router';
import { FormControl, ReactiveFormsModule }                                                             from '@angular/forms';
import { MatButtonModule }                                                                              from '@angular/material/button';
import { MatCardModule }                                                                                from '@angular/material/card';
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
    template       : `
        <div class="flex flex-col min-w-0 w-full min-h-screen">
            <page-header
                title="Lista de Procedimientos"
                subtitle="Consulta y gestión de procedimientos y documentación de cumplimiento"
                icon="heroicons_outline:document-text"
                class="text-white">
            </page-header>

            <div class="container mx-auto px-4 py-8">
                <div class="flex flex-col w-full max-w-7xl mx-auto gap-y-8">
                    <!-- Panel de filtros -->
                    <div class="w-full bg-card rounded-xl shadow-md p-6 border transition-all duration-300 hover:shadow-lg">
                        <h2 class="text-lg font-semibold mb-4 flex items-center">
                            <mat-icon class="mr-2 text-blue-600">filter_list</mat-icon>
                            Filtros
                        </h2>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <mat-form-field class="w-full fuse-mat-dense" [subscriptSizing]="'dynamic'">
                                <mat-label>Buscar</mat-label>
                                <input matInput [formControl]="searchControl" placeholder="Buscar procedimientos...">
                                <mat-icon matSuffix svgIcon="heroicons_outline:magnifying-glass"></mat-icon>
                            </mat-form-field>

                            <mat-form-field class="w-full fuse-mat-dense" [subscriptSizing]="'dynamic'">
                                <mat-label>Categoría</mat-label>
                                <mat-select [formControl]="categoryControl">
                                    <mat-option value="">Todas las Categorías</mat-option>
                                    <mat-option value="Reglamento Interno">Reglamento Interno</mat-option>
                                    <mat-option value="SSO">Seguridad y Salud</mat-option>
                                    <mat-option value="Operacional">Operacional</mat-option>
                                    <mat-option value="Calidad">Calidad</mat-option>
                                </mat-select>
                            </mat-form-field>

                            <mat-form-field class="w-full fuse-mat-dense" [subscriptSizing]="'dynamic'">
                                <mat-label>Estado</mat-label>
                                <mat-select [formControl]="statusControl">
                                    <mat-option value="">Todos los Estados</mat-option>
                                    <mat-option value="draft">Borrador</mat-option>
                                    <mat-option value="in_review">En Revisión</mat-option>
                                    <mat-option value="approved">Aprobado</mat-option>
                                    <mat-option value="published">Publicado</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>

                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-6">
                            <!-- New Procedure Button -->
                            <button
                                mat-flat-button
                                color="primary"
                                type="button"
                                (click)="createProcedure()"
                                class="rounded-md hover:shadow-md transition-all duration-200">
                                <mat-icon class="mr-1">add</mat-icon>
                                Nuevo Procedimiento
                            </button>

                            <!-- Action Buttons -->
                            <div class="flex justify-end items-center gap-3">
                                <button
                                    mat-flat-button
                                    color="warn"
                                    type="button"
                                    (click)="clearFilters()"
                                    [disabled]="!hasActiveFilters()"
                                    class="rounded-md hover:shadow-md transition-all duration-200">
                                    <mat-icon class="mr-1">clear</mat-icon>
                                    Limpiar filtros
                                </button>
                                <button
                                    (click)="refresh()"
                                    [matTooltip]="'Recargar datos'"
                                    mat-flat-button
                                    color="accent"
                                    class="rounded-md hover:shadow-md transition-all duration-200">
                                    <mat-icon class="mr-1">refresh</mat-icon>
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Tabla de datos -->
                    <div class="bg-card rounded-xl shadow-md p-6 border w-full">
                        <h2 class="text-lg font-semibold mb-4 flex items-center">
                            <mat-icon class="mr-2 text-blue-600">document_scanner</mat-icon>
                            Registro de Procedimientos
                        </h2>
                        <div class="relative overflow-hidden w-full rounded-lg">
                            @if (columnsConfig()) {
                                <table-builder
                                    [columns]="columnsConfig()"
                                    [data]="filteredProcedures() || []"
                                    class="w-full">
                                </table-builder>
                            }

                            <!-- Estado vacío -->
                            @if (filteredProcedures() && filteredProcedures().length === 0) {
                                <div class="flex flex-col items-center justify-center p-8 text-center">
                                    <mat-icon class="text-6xl text-gray-300 mb-4">document_scanner</mat-icon>
                                    <h3 class="text-xl font-medium">No hay procedimientos</h3>
                                    <p class="mt-2">No se encontraron procedimientos con los filtros aplicados</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading overlay -->
            @if (isLoading()) {
                <div class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div class="bg-card p-6 rounded-lg shadow-xl flex flex-col items-center">
                        <mat-spinner diameter="48"></mat-spinner>
                        <p class="mt-4 font-medium">Cargando datos...</p>
                    </div>
                </div>
            }
        </div>

        <!-- Template for actions column -->
        <ng-template #actionsTemplate let-data="data">
            <div class="flex items-center gap-1">
                <button mat-icon-button matTooltip="Editar" (click)="editProcedure(data.id)">
                    <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Versiones" (click)="viewVersions(data.id)">
                    <mat-icon>history</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Publicar" (click)="publishProcedure(data.id)">
                    <mat-icon>publish</mat-icon>
                </button>
            </div>
        </ng-template>
    `
})
export class ProcedureListComponent implements OnInit {
    private store = inject(ProcedureStore);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notyf = inject(NotyfService);

    // Template references
    actionsTemplate = viewChild.required<TemplateRef<any>>('actionsTemplate');

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
    columnsConfig = signal<ColumnConfig<Procedure>[]>([
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
        // {
        //     key: 'actions',
        //     header: 'Acciones',
        //     visible: true,
        //     display: {
        //         type: 'custom',
        //         customTemplate: this.actionsTemplate()
        //     }
        // }
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
}
