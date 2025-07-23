import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, resource, signal } from '@angular/core';
import { CommonModule }                                                                        from '@angular/common';
import { FormControl, ReactiveFormsModule }                                                    from '@angular/forms';
import { MatButtonModule }                                                                     from '@angular/material/button';
import { MatCardModule }                                                                       from '@angular/material/card';
import { MatDatepickerModule }                                                                 from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                 from '@angular/material/core';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { MatIconModule }                                                                       from '@angular/material/icon';
import { MatInputModule }                                                                      from '@angular/material/input';
import { MatProgressSpinnerModule }                                                            from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                     from '@angular/material/select';
import { MatTableModule }                                                                      from '@angular/material/table';
import { MatPaginatorModule, PageEvent }                                                       from '@angular/material/paginator';
import { TranslocoService }                                                                    from '@ngneat/transloco';
import { PageHeaderComponent }                                                                 from '@layout/components/page-header/page-header.component';
import { debounceTime, distinctUntilChanged, startWith }                                       from 'rxjs/operators';
import { VehicleSessionsService }                                                              from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { SessionStatus, VehicleSession }                                                       from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { Router, RouterLink }                                                                  from '@angular/router';
import { MatTooltip }                                                                          from '@angular/material/tooltip';
import { NotyfService }                                                                        from '@shared/services/notyf.service';
import { firstValueFrom, Subscription }                                                        from 'rxjs';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import BigNumber                                                                               from 'bignumber.js';
import { VehicleSelectorComponent }                                                            from '@shared/controls/components/vehicle-selector/vehicle-selector.component';
import { Paginator }                                                                           from '@shared/domain/model/paginator';

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
export class HistoryComponent implements OnDestroy {
    private subscriptions = new Subscription();
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);
    readonly #destroyRef = inject(DestroyRef);

    // Controles de filtro (se mantienen para los inputs, pero se sincronizan con señales)
    searchFilter = new FormControl('');
    driverFilter = new FormControl('');
    vehicleFilter = new FormControl('');
    dateFromFilter = new FormControl('');
    dateToFilter = new FormControl('');
    statusFilter = new FormControl('');

    // Estados manejados con Signals
    isLoading = signal(true);
    sessionsHistory = signal<VehicleSession[]>([]);
    showAdvancedFilters = signal(false);

    // Señales para almacenar los valores actuales de cada filtro
    searchFilterSignal = toSignal(this.searchFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    driverFilterSignal = toSignal(this.driverFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    vehicleFilterSignal = toSignal(this.vehicleFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    dateFromSignal = toSignal(this.dateFromFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    dateToSignal = toSignal(this.dateToFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    statusFilterSignal = toSignal(this.statusFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));

    // Paginación con Signals
    pageSizeOptions = signal<number[]>([ 5, 10, 25, 50 ]);
    pagination = signal<Paginator>({
        page         : 0,
        limit        : 10,
        totalElements: 0,
        totalPages   : 0,
        disabled     : true
    });

    // Columnas que se muestran en la tabla (constante)
    displayedColumns: string[] = [
        'startTimestamp',
        'endTimestamp',
        'driverName',
        'vehicleInfo',
        'distance',
        'status',
        'actions'
    ];


    historyResource = resource({
        params: () => ({
            search: this.searchFilterSignal(),
            driver    : this.driverFilterSignal(),
            vehicle   : this.vehicleFilterSignal(),
            dateFrom  : this.dateFromSignal(),
            dateTo    : this.dateToSignal(),
            status    : this.statusFilterSignal(),
            pagination: this.pagination(),
        }),
        loader: async ({params}) => {
            // this.isLoading.set(true);

            const filter: any = {};
            if (params.search) filter.search = params.search;
            if (params.driver) filter.driverId = params.driver;
            if (params.vehicle) filter.vehicleId = params.vehicle;
            if (params.dateFrom) filter.startDateFrom = params.dateFrom;
            if (params.dateTo) filter.startDateTo = params.dateTo;
            if (params.status) filter.status = params.status;
            if (params.pagination) {
                filter.page = params.pagination.page;
                filter.limit = params.pagination.limit;
            }

            try {
                const sessions = await firstValueFrom(this.sessionsService.getHistoricalSessions(filter));
                this.sessionsHistory.set(sessions.items);
                this.pagination.set({
                    page         : sessions.page,
                    limit        : sessions.limit,
                    totalElements: sessions.totalElements,
                    totalPages   : sessions.totalPages,
                    disabled     : sessions.totalElements === 0
                });
                return this.isLoading.set(false);
            } catch {
                this.notyf.error('Error al cargar el historial de sesiones');
                this.isLoading.set(false);
            }
        }
    });

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    onPageChange(event: PageEvent): void {
        this.pagination.update(paginator => ({
            ...paginator,
            page : event.pageIndex + 1,
            limit: event.pageSize,
        }));
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
