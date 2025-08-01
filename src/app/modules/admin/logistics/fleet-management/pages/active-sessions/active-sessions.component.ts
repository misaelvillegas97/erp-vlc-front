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
import { firstValueFrom, interval, Subscription }                                          from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith }                                   from 'rxjs/operators';
import { VehicleSessionsService }                                                          from '@modules/admin/logistics/fleet-management/services/vehicle-sessions.service';
import { VehicleSession }                                                                  from '@modules/admin/logistics/fleet-management/domain/model/vehicle-session.model';
import { HapticFeedbackService }  from '@modules/admin/logistics/fleet-management/services/haptic-feedback.service';
import { FleetAnimationsService } from '@modules/admin/logistics/fleet-management/services/fleet-animations.service';
import { HapticClickDirective }   from '@modules/admin/logistics/fleet-management/directives/haptic-click.directive';
import { ConfirmDialogComponent }                                                          from './confirm-dialog.component';
import { DateTime }                                                                        from 'luxon';

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
        RouterLink,
        HapticClickDirective
    ],
    animations     : [
        FleetAnimationsService.sessionList,
        FleetAnimationsService.sessionCardHover,
        FleetAnimationsService.buttonPress,
        FleetAnimationsService.fadeInOut,
        FleetAnimationsService.dataLoading
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './active-sessions.component.html'
})
export class ActiveSessionsComponent implements OnInit, OnDestroy {
    private readonly router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly hapticService = inject(HapticFeedbackService);
    private readonly notyf = new Notyf();

    // Filtros
    searchControl = new FormControl('');
    sortControl = new FormControl('duration_desc');

    // Signals para estado
    isLoading = signal(true);
    activeSessions = signal<VehicleSession[]>([]);
    searchTerm = signal('');
    sortOption = signal('duration_desc');

    // Estado para animaciones
    hoveredCard = signal<string | null>(null);
    pressedButton = signal<string | null>(null);
    loadingState = signal<'loading' | 'loaded'>('loading');

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
                sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
                break;
            case 'duration_desc':
                sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
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
        this.loadingState.set('loading');

        firstValueFrom(this.sessionsService.getActiveSessions())
            .then(sessions => {
                // Convertir fechas de inicio a objetos Date
                sessions.forEach(session => {
                    session.startTime = new Date(session.startTime);
                });
                this.activeSessions.set(sessions);
                this.isLoading.set(false);
                this.loadingState.set('loaded');
            })
            .catch(() => {
                this.hapticService.errorAction();
                this.notyf.error({message: 'Error al cargar sesiones activas'});
                this.isLoading.set(false);
                this.loadingState.set('loaded');
            });
    }

    finishSession(sessionId: string): void {
        // Feedback háptico antes de mostrar el diálogo
        this.hapticService.sessionEnd();

        // Animación de botón presionado
        this.pressedButton.set('finish-' + sessionId);
        setTimeout(() => this.pressedButton.set(null), 100);

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data : {
                title  : 'Confirmar finalización',
                message: '¿Está seguro que desea finalizar esta sesión de vehículo?'
            }
        });

        const dialogSub = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.hapticService.buttonPress();
                this.router.navigate([ '/logistics/fleet-management/finish-session', sessionId ]);
            }
        });
        this.subscriptions.push(dialogSub);
    }

    onCardHover(sessionId: string, isHovered: boolean): void {
        this.hoveredCard.set(isHovered ? sessionId : null);
        if (isHovered) {
            this.hapticService.buttonPress();
        }
    }

    onButtonPress(buttonId: string): void {
        this.hapticService.buttonPress();
        this.pressedButton.set(buttonId);
        setTimeout(() => this.pressedButton.set(null), 150);
    }

    navigateToDrivingMode(): void {
        this.hapticService.buttonPress();
        // La navegación se maneja por routerLink
    }

    navigateToFleetControl(): void {
        this.hapticService.buttonPress();
        // La navegación se maneja por routerLink
    }

    formatDuration(startTime: Date): string {
        const timeDiff = DateTime.fromJSDate(new Date(startTime));
        const now = DateTime.now();
        const diff = now.diff(timeDiff, [ 'hours', 'minutes' ]);
        const hours = Math.floor(diff.hours);
        const minutes = Math.floor(diff.minutes);

        return `${ hours }h ${ minutes }m`;
    }
}
