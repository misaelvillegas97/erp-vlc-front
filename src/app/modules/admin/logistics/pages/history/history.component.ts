import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { FormControl, ReactiveFormsModule }                                     from '@angular/forms';
import { MatButtonModule }                                                      from '@angular/material/button';
import { MatCardModule }                                                        from '@angular/material/card';
import { MatDatepickerModule }                                                  from '@angular/material/datepicker';
import { MatNativeDateModule }                                                  from '@angular/material/core';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatIconModule }                                                        from '@angular/material/icon';
import { MatInputModule }                                                       from '@angular/material/input';
import { MatProgressSpinnerModule }                                             from '@angular/material/progress-spinner';
import { MatSelectModule }                                                      from '@angular/material/select';
import { MatTableModule }                                                       from '@angular/material/table';
import { MatPaginatorModule, PageEvent }                                        from '@angular/material/paginator';
import { TranslocoService }                                                     from '@ngneat/transloco';
import { PageHeaderComponent }                                                  from '@layout/components/page-header/page-header.component';
import { debounceTime, distinctUntilChanged, startWith }                        from 'rxjs/operators';
import { VehicleSessionsService }                                               from '../../services/vehicle-sessions.service';
import { SessionStatus, VehicleSession }                                        from '../../domain/model/vehicle-session.model';
import { Router }                                                               from '@angular/router';
import { MatTooltip }                                                           from '@angular/material/tooltip';
import { NotyfService }                                                         from '@shared/services/notyf.service';

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
export class HistoryComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly notyf = inject(NotyfService);

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
    driverFilterSignal = signal<string>('');
    vehicleFilterSignal = signal<string>('');
    dateFromSignal = signal<string>('');
    dateToSignal = signal<string>('');
    statusFilterSignal = signal<string>('');

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
            filtered = filtered.filter(session =>
                    session.driverId.toLowerCase().includes(driverSearch)
                // Si tu sesión dispone de más información del conductor,
                // se puede extender el filtro (ej. session.driverName)
            );
        }
        const vehicleSearch = this.vehicleFilterSignal().toLowerCase();
        if (vehicleSearch) {
            filtered = filtered.filter(session =>
                    session.vehicleId.toLowerCase().includes(vehicleSearch)
                // Se podría ampliar si se cuenta con otros datos (ej. licensePlate)
            );
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

    // Signal computada para mostrar el total de sesiones filtradas
    totalSessions = computed(() => this.filteredFullSessions().length);

    ngOnInit(): void {
        this.loadSessionsHistory();
        this.setupFilters();
    }

    // Configurar la sincronización de cada control de filtro con sus respectivas señales
    setupFilters(): void {
        this.driverFilter.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.driverFilterSignal.set(value || '');
            this.currentPage.set(0);
        });

        this.vehicleFilter.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.vehicleFilterSignal.set(value || '');
            this.currentPage.set(0);
        });

        this.dateFromFilter.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.dateFromSignal.set(value || '');
            this.currentPage.set(0);
        });

        this.dateToFilter.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.dateToSignal.set(value || '');
            this.currentPage.set(0);
        });

        this.statusFilter.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.statusFilterSignal.set(value || '');
            this.currentPage.set(0);
        });
    }

    // Carga el historial de sesiones y actualiza la señal correspondiente
    loadSessionsHistory(): void {
        this.isLoading.set(true);
        this.sessionsService.getHistoricalSessions().subscribe({
            next : sessions => {
                this.sessionsHistory.set(sessions);
                this.isLoading.set(false);
            },
            error: () => {
                this.notyf.error('Error al cargar el historial de sesiones');
                this.isLoading.set(false);
            }
        });
    }

    // Actualiza la paginación al cambiar página o tamaño de página
    onPageChange(event: PageEvent): void {
        this.pageSize.set(event.pageSize);
        this.currentPage.set(event.pageIndex);
    }

    // Formatea la fecha/hora para mostrarla en la tabla
    formatDateTime(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleString('es-CL', {
            year  : 'numeric',
            month : '2-digit',
            day   : '2-digit',
            hour  : '2-digit',
            minute: '2-digit'
        });
    }

    // Calcula la distancia recorrida a partir del odómetro final e inicial
    calculateDistance(session: VehicleSession): number {
        if (session.finalOdometer && session.initialOdometer) {
            return session.finalOdometer - session.initialOdometer;
        }
        return 0;
    }

    // Determina la clase de estilo según el estado de la sesión
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

    // Devuelve un texto descriptivo del estado de la sesión
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

    // Navega o muestra detalles de la sesión (lógica pendiente de implementar)
    viewDetails(session: VehicleSession): void {
        this.notyf.info('Vista de detalle no implementada aún');
        // this.router.navigate(['/logistics/session-details', session.id]);
    }

    // Alterna la visibilidad de los filtros avanzados
    toggleAdvancedFilters(): void {
        this.showAdvancedFilters.update(value => !value);
    }

    protected readonly SessionStatus = SessionStatus;
}
