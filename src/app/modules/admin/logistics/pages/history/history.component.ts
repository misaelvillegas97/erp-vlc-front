import { Component, OnInit, inject }                     from '@angular/core';
import { CommonModule }                                  from '@angular/common';
import { FormControl, ReactiveFormsModule }              from '@angular/forms';
import { MatButtonModule }                               from '@angular/material/button';
import { MatCardModule }                                 from '@angular/material/card';
import { MatDatepickerModule }                           from '@angular/material/datepicker';
import { MatNativeDateModule }                           from '@angular/material/core';
import { MatFormFieldModule }                            from '@angular/material/form-field';
import { MatIconModule }                                 from '@angular/material/icon';
import { MatInputModule }                                from '@angular/material/input';
import { MatProgressSpinnerModule }                      from '@angular/material/progress-spinner';
import { MatSelectModule }                               from '@angular/material/select';
import { MatTableModule }                                from '@angular/material/table';
import { MatPaginatorModule, PageEvent }                 from '@angular/material/paginator';
import { TranslocoPipe, TranslocoService }               from '@ngneat/transloco';
import { PageHeaderComponent }                           from '@layout/components/page-header/page-header.component';
import { Notyf }                                         from 'notyf';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { VehicleSessionsService }                        from '../../services/vehicle-sessions.service';
import { VehicleSession, SessionStatus }                 from '../../domain/model/vehicle-session.model';
import { Router }                                        from '@angular/router';

@Component({
    selector   : 'app-history',
    standalone : true,
    imports    : [
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
        PageHeaderComponent
    ],
    templateUrl: './history.component.html'
})
export class HistoryComponent implements OnInit {
    readonly #router = inject(Router);
    readonly #ts = inject(TranslocoService);
    readonly #sessionsService = inject(VehicleSessionsService);
    readonly #notyf = new Notyf();

    // Filtros
    driverFilter = new FormControl('');
    vehicleFilter = new FormControl('');
    dateFromFilter = new FormControl('');
    dateToFilter = new FormControl('');
    statusFilter = new FormControl('');

    // Estado de la tabla
    isLoading = true;
    displayedColumns: string[] = [
        'startTimestamp',
        'endTimestamp',
        'driverName',
        'vehicleInfo',
        'distance',
        'status',
        'actions'
    ];
    sessionsHistory: VehicleSession[] = [];
    filteredSessions: VehicleSession[] = [];

    // Paginación
    pageSize = 10;
    pageSizeOptions: number[] = [ 5, 10, 25, 50 ];
    currentPage = 0;
    totalSessions = 0;

    // Enum para uso en el template
    SessionStatus = SessionStatus;

    ngOnInit(): void {
        this.loadSessionsHistory();

        // Configurar suscripciones para filtros
        this.setupFilters();
    }

    setupFilters(): void {
        // Combinar todos los filtros
        const filterControls = [
            this.driverFilter,
            this.vehicleFilter,
            this.dateFromFilter,
            this.dateToFilter,
            this.statusFilter
        ];

        filterControls.forEach(control => {
            control.valueChanges.pipe(
                startWith(''),
                debounceTime(300),
                distinctUntilChanged()
            ).subscribe(() => this.applyFilters());
        });
    }

    loadSessionsHistory(): void {
        this.isLoading = true;

        this.#sessionsService.getHistoricalSessions().subscribe({
            next : (sessions) => {
                this.sessionsHistory = sessions;
                this.applyFilters();
                this.isLoading = false;
            },
            error: () => {
                this.#notyf.error({message: 'Error al cargar el historial de sesiones'});
                this.isLoading = false;
            }
        });
    }

    applyFilters(): void {
        let filtered = [ ...this.sessionsHistory ];

        // Filtro por conductor
        const driverSearch = (this.driverFilter.value || '').toLowerCase();
        if (driverSearch) {
            filtered = filtered.filter(session =>
                session.driverId.toLowerCase().includes(driverSearch) ||
                // Asumiendo que tienes información del conductor en la sesión
                // session.driverName?.toLowerCase().includes(driverSearch)
                false
            );
        }

        // Filtro por vehículo
        const vehicleSearch = (this.vehicleFilter.value || '').toLowerCase();
        if (vehicleSearch) {
            filtered = filtered.filter(session =>
                session.vehicleId.toLowerCase().includes(vehicleSearch) ||
                // Asumiendo que tienes información del vehículo en la sesión
                // session.vehicleLicensePlate?.toLowerCase().includes(vehicleSearch)
                false
            );
        }

        // Filtro por fecha desde
        const dateFrom = this.dateFromFilter.value;
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filtered = filtered.filter(session =>
                new Date(session.startTimestamp) >= fromDate
            );
        }

        // Filtro por fecha hasta
        const dateTo = this.dateToFilter.value;
        if (dateTo) {
            const toDate = new Date(dateTo);
            // Establecer la hora al final del día
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(session =>
                new Date(session.startTimestamp) <= toDate
            );
        }

        // Filtro por estado
        const statusValue = this.statusFilter.value;
        if (statusValue) {
            filtered = filtered.filter(session =>
                session.status === statusValue
            );
        }

        // Aplicar paginación
        this.totalSessions = filtered.length;
        this.filteredSessions = filtered.slice(
            this.currentPage * this.pageSize,
            (this.currentPage + 1) * this.pageSize
        );
    }

    onPageChange(event: PageEvent): void {
        this.pageSize = event.pageSize;
        this.currentPage = event.pageIndex;
        this.applyFilters();
    }

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

    calculateDistance(session: VehicleSession): number {
        if (session.finalOdometer && session.initialOdometer) {
            return session.finalOdometer - session.initialOdometer;
        }
        return 0;
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
        // Aquí implementaríamos la navegación a una vista de detalle
        this.#notyf.success({message: 'Vista de detalle no implementada aún'});
        // this.#router.navigate(['/logistics/session-details', session.id]);
    }
}
