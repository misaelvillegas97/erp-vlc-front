import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { CommonModule }                                                           from '@angular/common';
import { FormControl, ReactiveFormsModule }                                       from '@angular/forms';
import { MatButtonModule }                                                        from '@angular/material/button';
import { MatCardModule }                                                          from '@angular/material/card';
import { MatDatepickerModule }                                                    from '@angular/material/datepicker';
import { MatNativeDateModule }                                                    from '@angular/material/core';
import { MatFormFieldModule }                                                     from '@angular/material/form-field';
import { MatIconModule }                                                          from '@angular/material/icon';
import { MatInputModule }                                                         from '@angular/material/input';
import { MatProgressSpinnerModule }                                               from '@angular/material/progress-spinner';
import { MatSelectModule }                                                        from '@angular/material/select';
import { MatTableModule }                                                         from '@angular/material/table';
import { MatPaginatorModule, PageEvent }                                          from '@angular/material/paginator';
import { PageHeaderComponent }                                                    from '@layout/components/page-header/page-header.component';
import { debounceTime, distinctUntilChanged, startWith }                          from 'rxjs/operators';
import { VehicleSessionsService }                                                 from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { SessionStatus, VehicleSession }                                          from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { Router, RouterLink }                                                     from '@angular/router';
import { MatTooltip }                                                             from '@angular/material/tooltip';
import { NotyfService }                                                           from '@shared/services/notyf.service';
import { firstValueFrom }                                                         from 'rxjs';
import { toSignal }                                                               from '@angular/core/rxjs-interop';
import BigNumber                                                                  from 'bignumber.js';
import { VehicleSelectorComponent }                                               from '@shared/controls/components/vehicle-selector/vehicle-selector.component';

@Component({
    selector       : 'app-history',
    standalone     : true,
    imports        : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTableModule,
        MatPaginatorModule,
        ReactiveFormsModule,
        PageHeaderComponent,
        MatTooltip,
        RouterLink,
        VehicleSelectorComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './history.component.html'
})
export class HistoryComponent {
    private readonly router = inject(Router);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);

    // Controles de filtro
    searchFilter = new FormControl('');
    driverFilter = new FormControl('');
    vehicleFilter = new FormControl('');
    dateFromFilter = new FormControl('');
    dateToFilter = new FormControl('');
    statusFilter = new FormControl('');

    // Estados manejados con Signals
    showAdvancedFilters = signal(false);

    // Señales para almacenar los valores actuales de cada filtro
    searchFilterSignal = toSignal(this.searchFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    driverFilterSignal = toSignal(this.driverFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    vehicleFilterSignal = toSignal(this.vehicleFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    dateFromSignal = toSignal(this.dateFromFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    dateToSignal = toSignal(this.dateToFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    statusFilterSignal = toSignal(this.statusFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));

    // Paginación con Signals - Separamos los triggers de los metadatos para evitar loops infinitos
    pageSizeOptions = signal<number[]>([ 5, 10, 25, 50 ]);

    // Signals que actúan como triggers para el resource (solo page y limit)
    currentPage = signal(1);
    currentLimit = signal(10);

    // Signals para metadatos de paginación (no triggers, solo información)
    paginationMetadata = signal<{
        totalElements: number;
        totalPages: number;
        disabled: boolean;
    }>({
        totalElements: 0,
        totalPages: 0,
        disabled  : true
    });

    // Computed signal para compatibilidad con el template
    pagination = computed(() => ({
        page         : this.currentPage(),
        limit        : this.currentLimit(),
        totalElements: this.paginationMetadata().totalElements,
        totalPages   : this.paginationMetadata().totalPages,
        disabled     : this.paginationMetadata().disabled
    }));

    // Columnas que se muestran en la tabla (constante)
    displayedColumns: string[] = [
        'startTimestamp',
        'endTimestamp',
        'driverName',
        'vehicleInfo',
        'initialOdometer',
        'finalOdometer',
        'distance',
        'status',
        'actions'
    ];


    historyResource = resource({
        params: () => ({
            search: this.searchFilterSignal(),
            driver  : this.driverFilterSignal(),
            vehicle : this.vehicleFilterSignal(),
            dateFrom: this.dateFromSignal(),
            dateTo  : this.dateToSignal(),
            status  : this.statusFilterSignal(),
            // Solo usamos los triggers de paginación, no los metadatos
            page : this.currentPage(),
            limit: this.currentLimit(),
        }),
        loader: async ({params}) => {
            const filter: any = {};
            if (params.search) filter.search = params.search;
            if (params.driver) filter.driverId = params.driver;
            if (params.vehicle) filter.vehicleId = params.vehicle;
            if (params.dateFrom) filter.startDateFrom = params.dateFrom;
            if (params.dateTo) filter.startDateTo = params.dateTo;
            if (params.status) filter.status = params.status;
            // Usamos los parámetros directos en lugar del objeto pagination
            if (params.page) filter.page = params.page;
            if (params.limit) filter.limit = params.limit;

            try {
                const sessions = await firstValueFrom(this.sessionsService.getHistoricalSessions(filter));
                // Solo actualizamos los metadatos, no los triggers para evitar el loop infinito
                this.paginationMetadata.set({
                    totalElements: sessions.totalElements,
                    totalPages: sessions.totalPages,
                    disabled  : sessions.totalElements === 0
                });
                return sessions.items;
            } catch (error) {
                this.notyf.error('Error al cargar el historial de sesiones');
                throw error;
            }
        }
    });

    // Computed signals for better performance
    sessionsHistory = computed(() => this.historyResource.value() || []);
    isLoading = computed(() => this.historyResource.isLoading());

    onPageChange(event: PageEvent): void {
        // Actualizamos solo los triggers de paginación, no los metadatos
        this.currentPage.set(event.pageIndex + 1);
        this.currentLimit.set(event.pageSize);
    }

    calculateDistance(session: VehicleSession): string {
        if (session.finalOdometer && session.initialOdometer) {
            return (new BigNumber(session.finalOdometer)).minus(new BigNumber(session.initialOdometer)).toFixed(2);
        }
        return '0.00';
    }

    getStatusClass(status: SessionStatus): string {
        switch (status) {
            case SessionStatus.COMPLETED:
                return 'bg-green-100 text-green-800';
            case SessionStatus.CANCELLED:
                return 'bg-amber-100 text-amber-800';
            case SessionStatus.EXPIRED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusText(status: SessionStatus): string {
        switch (status) {
            case SessionStatus.ACTIVE:
                return 'Activa';
            case SessionStatus.COMPLETED:
                return 'Completada';
            case SessionStatus.CANCELLED:
                return 'Cancelada';
            case SessionStatus.EXPIRED:
                return 'Expirada';
            default:
                return 'Desconocido';
        }
    }

    viewDetails(session: VehicleSession): void {
        this.router.navigate([ '/logistics/fleet-management/session-details', session.id ]);
    }

    toggleAdvancedFilters(): void {
        this.showAdvancedFilters.update(value => !value);
    }

    protected readonly SessionStatus = SessionStatus;
}
