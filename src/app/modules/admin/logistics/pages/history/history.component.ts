import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnDestroy, resource, signal } from '@angular/core';
import { CommonModule }                                                                                  from '@angular/common';
import { FormControl, ReactiveFormsModule }                                                              from '@angular/forms';
import { MatButtonModule }                                                                               from '@angular/material/button';
import { MatCardModule }                                                                                 from '@angular/material/card';
import { MatDatepickerModule }                                                                           from '@angular/material/datepicker';
import { MatNativeDateModule }                                                                           from '@angular/material/core';
import { MatFormFieldModule }                                                                            from '@angular/material/form-field';
import { MatIconModule }                                                                                 from '@angular/material/icon';
import { MatInputModule }                                                                                from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                      from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                               from '@angular/material/select';
import { MatTableModule }                                                                                from '@angular/material/table';
import { MatPaginatorModule, PageEvent }                                                                 from '@angular/material/paginator';
import { TranslocoService }                                                                              from '@ngneat/transloco';
import { PageHeaderComponent }                                                                           from '@layout/components/page-header/page-header.component';
import { debounceTime, distinctUntilChanged, startWith }                                                 from 'rxjs/operators';
import { VehicleSessionsService }                                                                        from '../../services/vehicle-sessions.service';
import { SessionStatus, VehicleSession }                                                                 from '../../domain/model/vehicle-session.model';
import { Router }                                                                                        from '@angular/router';
import { MatTooltip }                                                                                    from '@angular/material/tooltip';
import { NotyfService }                                                                                  from '@shared/services/notyf.service';
import { firstValueFrom, Subscription }                                                                  from 'rxjs';
import { toSignal }                                                                                      from '@angular/core/rxjs-interop';
import BigNumber                                                                                         from 'bignumber.js';

@Component({
    selector   : 'app-history',
    standalone : true,
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
        MatTooltip
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './history.component.html'
})
export class HistoryComponent implements OnDestroy {
    private subscriptions = new Subscription();
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);
    readonly #destroyRef = inject(DestroyRef);

    // Controles de filtro (se mantienen para los inputs, pero se sincronizan con señales)
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
    driverFilterSignal = toSignal(this.driverFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    vehicleFilterSignal = toSignal(this.vehicleFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    dateFromSignal = toSignal(this.dateFromFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    dateToSignal = toSignal(this.dateToFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));
    statusFilterSignal = toSignal(this.statusFilter.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()));

    // Paginación con Signals
    pageSize = signal(10);
    pageSizeOptions = signal<number[]>([ 5, 10, 25, 50 ]);
    currentPage = signal(0);

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

    // Signal computada: sesiones filtradas sin paginación
    private filteredFullSessions = computed(() => {
        let filtered = [ ...this.sessionsHistory() ];
        const driverSearch = this.driverFilterSignal().toLowerCase();
        if (driverSearch) {
            filtered = filtered.filter(session => session.driver?.name.toLowerCase().includes(driverSearch));
        }
        const vehicleSearch = this.vehicleFilterSignal().toLowerCase();
        if (vehicleSearch) {
            filtered = filtered.filter(session => session.vehicleId.toLowerCase().includes(vehicleSearch));
        }
        const dateFrom = this.dateFromSignal();
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filtered = filtered.filter(session => new Date(session.startTime) >= fromDate);
        }
        const dateTo = this.dateToSignal();
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(session => new Date(session.startTime) <= toDate);
        }
        const statusValue = this.statusFilterSignal();
        if (statusValue) {
            filtered = filtered.filter(session => session.status === statusValue);
        }
        return filtered;
    });

    // Signal computada: sesiones filtradas con paginación aplicada
    filteredSessions = computed(() => {
        const filtered = this.filteredFullSessions();
        const start = this.currentPage() * this.pageSize();
        return filtered.slice(start, start + this.pageSize());
    });

    totalSessions = computed(() => this.filteredFullSessions().length);

    historyResource = resource({
        request: () => ({
            driver  : this.driverFilterSignal(),
            vehicle : this.vehicleFilterSignal(),
            dateFrom: this.dateFromSignal(),
            dateTo  : this.dateToSignal(),
            status  : this.statusFilterSignal()
        }),
        loader : async ({request}) => {
            this.currentPage.set(0);
            this.isLoading.set(true);

            try {
                const sessions = await firstValueFrom(this.sessionsService.getHistoricalSessions());
                this.sessionsHistory.set(sessions.items);
                return this.isLoading.set(false);
            } catch {
                this.notyf.error('Error al cargar el historial de sesiones');
                this.isLoading.set(false);
            }
        }
    })

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    onPageChange(event: PageEvent): void {
        this.pageSize.set(event.pageSize);
        this.currentPage.set(event.pageIndex);
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
        this.router.navigate([ '/logistics/session-details', session.id ]);
    }

    toggleAdvancedFilters(): void {
        this.showAdvancedFilters.update(value => !value);
    }

    protected readonly SessionStatus = SessionStatus;
}
