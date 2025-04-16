import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink }                                                              from '@angular/router';
import { CommonModule }                                                                    from '@angular/common';
import { FormControl, ReactiveFormsModule }                                                from '@angular/forms';
import { MatButtonModule }                                                                 from '@angular/material/button';
import { MatCardModule }                                                                   from '@angular/material/card';
import { MatDialog, MatDialogModule }                                                      from '@angular/material/dialog';
import { MatFormFieldModule }                                                              from '@angular/material/form-field';
import { MatIconModule }                                                                   from '@angular/material/icon';
import { MatInputModule }                                                                  from '@angular/material/input';
import { MatProgressSpinnerModule }                                                        from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                 from '@angular/material/select';
import { PageHeaderComponent }                                                             from '@layout/components/page-header/page-header.component';
import { Notyf }                                                                           from 'notyf';
import { interval, Subscription }                                                          from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith }                                   from 'rxjs/operators';
import { VehicleSessionsService }                                                          from '../../services/vehicle-sessions.service';
import { ActiveSessionView }                                                               from '../../domain/model/vehicle-session.model';
import { ConfirmDialogComponent }                                                          from './confirm-dialog.component';

@Component({
    selector   : 'app-active-sessions',
    standalone : true,
    imports        : [
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
        PageHeaderComponent,
        RouterLink
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './active-sessions.component.html'
})
export class ActiveSessionsComponent implements OnInit, OnDestroy {
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly notyf = new Notyf();

    // Filtros
    searchControl = new FormControl('');
    sortControl = new FormControl('duration_desc');

    // Signals para estado
    isLoading = signal(true);
    activeSessions = signal<ActiveSessionView[]>([]);
    searchTerm = signal('');
    sortOption = signal('duration_desc');

    // Signal computado para sesiones filtradas
    filteredSessions = computed(() => {
        let sessions = [ ...this.activeSessions() ];
        const term = this.searchTerm().toLowerCase();

        if (term) {
            sessions = sessions.filter(session =>
                session.driver.firstName.toLowerCase().includes(term) ||
                session.driver.lastName.toLowerCase().includes(term) ||
                session.vehicle.brand.toLowerCase().includes(term) ||
                session.vehicle.model.toLowerCase().includes(term) ||
                session.vehicle.licensePlate.toLowerCase().includes(term)
            );
        }

        switch (this.sortOption()) {
            case 'duration_asc':
                sessions.sort((a, b) => a.duration - b.duration);
                break;
            case 'duration_desc':
                sessions.sort((a, b) => b.duration - a.duration);
                break;
            case 'name_asc':
                sessions.sort((a, b) =>
                    (a.driver.lastName + a.driver.firstName).localeCompare(b.driver.lastName + b.driver.firstName)
                );
                break;
            case 'name_desc':
                sessions.sort((a, b) =>
                    (b.driver.lastName + b.driver.firstName).localeCompare(a.driver.lastName + a.driver.firstName)
                );
                break;
            case 'plate_asc':
                sessions.sort((a, b) => a.vehicle.licensePlate.localeCompare(b.vehicle.licensePlate));
                break;
            case 'plate_desc':
                sessions.sort((a, b) => b.vehicle.licensePlate.localeCompare(a.vehicle.licensePlate));
                break;
        }

        return sessions;
    });

    private subscriptions: Subscription[] = [];

    ngOnInit(): void {
        this.loadActiveSessions();

        // Recargar sesiones activas cada 30 segundos
        const intervalSub = interval(30000).subscribe(() => this.loadActiveSessions());
        this.subscriptions.push(intervalSub);

        // Suscribirse a cambios en los filtros
        const searchSub = this.searchControl.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => this.searchTerm.set(value || ''));

        const sortSub = this.sortControl.valueChanges.pipe(
            startWith('duration_desc'),
            distinctUntilChanged()
        ).subscribe(value => this.sortOption.set(value || 'duration_desc'));

        this.subscriptions.push(searchSub, sortSub);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private loadActiveSessions(): void {
        this.isLoading.set(true);

        this.sessionsService.getActiveSessions().subscribe({
            next : sessions => {
                this.activeSessions.set(sessions);
                this.isLoading.set(false);
            },
            error: () => {
                this.notyf.error({message: 'Error al cargar sesiones activas'});
                this.isLoading.set(false);
            }
        });
    }

    finishSession(sessionId: string): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data : {
                title  : 'Confirmar finalización',
                message: '¿Está seguro que desea finalizar esta sesión de vehículo?'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.router.navigate([ '/logistics/finish-session', sessionId ]);
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
                return 'bg-green-600 hover:bg-green-700';
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-700';
            case 'alert':
                return 'bg-red-600 hover:bg-red-700';
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
