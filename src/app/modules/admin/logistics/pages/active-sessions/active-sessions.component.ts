import { Component, OnInit, OnDestroy, inject }                                     from '@angular/core';
import { Router }                                                                   from '@angular/router';
import { CommonModule }                                                             from '@angular/common';
import { FormControl, ReactiveFormsModule }                                         from '@angular/forms';
import { MatButtonModule }                                                          from '@angular/material/button';
import { MatCardModule }                                                            from '@angular/material/card';
import { MatDialog, MatDialogModule }                                               from '@angular/material/dialog';
import { MatFormFieldModule }                                                       from '@angular/material/form-field';
import { MatIconModule }                                                            from '@angular/material/icon';
import { MatInputModule }                                                           from '@angular/material/input';
import { MatProgressSpinnerModule }                                                 from '@angular/material/progress-spinner';
import { MatSelectModule }                                                          from '@angular/material/select';
import { TranslocoPipe, TranslocoService }                                          from '@ngneat/transloco';
import { PageHeaderComponent }                                                      from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                    from 'notyf';
import { Subject, interval }                                                        from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { VehicleSessionsService }                                                   from '../../services/vehicle-sessions.service';
import { ActiveSessionView }                                                        from '../../domain/model/vehicle-session.model';
import { ConfirmDialogComponent }                                                   from './confirm-dialog.component';

@Component({
    selector   : 'app-active-sessions',
    standalone : true,
    imports    : [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        ReactiveFormsModule,
        PageHeaderComponent
    ],
    templateUrl: './active-sessions.component.html'
})
export class ActiveSessionsComponent implements OnInit, OnDestroy {
    readonly #router = inject(Router);
    readonly #ts = inject(TranslocoService);
    readonly #dialog = inject(MatDialog);
    readonly #sessionsService = inject(VehicleSessionsService);
    readonly #notyf = new Notyf();

    // Filtros
    searchControl = new FormControl('');
    sortControl = new FormControl('duration_desc');

    // Estado
    isLoading = true;
    activeSessions: ActiveSessionView[] = [];
    filteredSessions: ActiveSessionView[] = [];

    // Utilidades
    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        // Cargar sesiones y refrescar cada 30 segundos
        this.loadActiveSessions();
        interval(30000).pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => this.loadActiveSessions());

        // Aplicar filtros cuando cambian
        this.searchControl.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => this.applyFilters());

        this.sortControl.valueChanges.pipe(
            startWith('duration_desc'),
            takeUntil(this.destroy$)
        ).subscribe(() => this.applyFilters());
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadActiveSessions(): void {
        this.isLoading = true;

        this.#sessionsService.getActiveSessions().subscribe({
            next : (sessions) => {
                this.activeSessions = sessions;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                this.#notyf.error({message: 'Error al cargar sesiones activas'});
                this.isLoading = false;
            }
        });
    }

    applyFilters(): void {
        let filtered = [ ...this.activeSessions ];

        // Aplicar búsqueda
        const searchTerm = (this.searchControl.value || '').toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(session =>
                session.driver.name.toLowerCase().includes(searchTerm) ||
                session.driver.lastName.toLowerCase().includes(searchTerm) ||
                session.vehicle.brand.toLowerCase().includes(searchTerm) ||
                session.vehicle.model.toLowerCase().includes(searchTerm) ||
                session.vehicle.licensePlate.toLowerCase().includes(searchTerm)
            );
        }

        // Aplicar ordenamiento
        const sortOption = this.sortControl.value;
        if (sortOption) {
            switch (sortOption) {
                case 'duration_asc':
                    filtered.sort((a, b) => a.duration - b.duration);
                    break;
                case 'duration_desc':
                    filtered.sort((a, b) => b.duration - a.duration);
                    break;
                case 'name_asc':
                    filtered.sort((a, b) => (a.driver.lastName + a.driver.name)
                        .localeCompare(b.driver.lastName + b.driver.name));
                    break;
                case 'name_desc':
                    filtered.sort((a, b) => (b.driver.lastName + b.driver.name)
                        .localeCompare(a.driver.lastName + a.driver.name));
                    break;
                case 'plate_asc':
                    filtered.sort((a, b) => a.vehicle.licensePlate.localeCompare(b.vehicle.licensePlate));
                    break;
                case 'plate_desc':
                    filtered.sort((a, b) => b.vehicle.licensePlate.localeCompare(a.vehicle.licensePlate));
                    break;
            }
        }

        this.filteredSessions = filtered;
    }

    finishSession(sessionId: string): void {
        const dialogRef = this.#dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data : {
                title  : 'Confirmar finalización',
                message: '¿Está seguro que desea finalizar esta sesión de vehículo?'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.#router.navigate([ '/logistics/finish-session', sessionId ]);
            }
        });
    }

    formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${ hours }h ${ mins }m`;
    }

    getStatusColor(status: 'normal' | 'warning' | 'alert'): string {
        switch (status) {
            case 'normal':
                return 'bg-green-500';
            case 'warning':
                return 'bg-amber-500';
            case 'alert':
                return 'bg-red-500';
        }
    }

    getStatusText(status: 'normal' | 'warning' | 'alert'): string {
        switch (status) {
            case 'normal':
                return 'Normal';
            case 'warning':
                return 'Extendido';
            case 'alert':
                return 'Excedido';
        }
    }
}
