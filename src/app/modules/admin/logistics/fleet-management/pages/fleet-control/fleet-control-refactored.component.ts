import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule }                                                                                    from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule }                                                     from '@angular/forms';
import { MatButtonModule }                                                                                 from '@angular/material/button';
import { MatCardModule }                                                                                   from '@angular/material/card';
import { MatDialog, MatDialogModule }                                                                      from '@angular/material/dialog';
import { MatFormFieldModule }                                                                              from '@angular/material/form-field';
import { MatIconModule }                                                                                   from '@angular/material/icon';
import { MatInputModule }                                                                                  from '@angular/material/input';
import { MatProgressSpinnerModule }                                                                        from '@angular/material/progress-spinner';
import { MatSelectModule }                                                                                 from '@angular/material/select';
import { takeUntilDestroyed }                                                                              from '@angular/core/rxjs-interop';

import { PageHeaderComponent }      from '@layout/components/page-header/page-header.component';
import { VehicleSelectorComponent } from '@shared/controls/components/vehicle-selector/vehicle-selector.component';
import { DriverSelectorComponent }  from '@shared/controls';
import { HapticClickDirective }     from '@modules/admin/logistics/fleet-management/directives/haptic-click.directive';
import { FleetAnimationsService }   from '@modules/admin/logistics/fleet-management/services/fleet-animations.service';

// Refactored services
import { FleetControlFormService }    from '@modules/admin/logistics/fleet-management/services/fleet-control-form.service';
import { FleetGpsManagerService }     from '@modules/admin/logistics/fleet-management/services/fleet-gps-manager.service';
import { FleetSessionManagerService } from '@modules/admin/logistics/fleet-management/services/fleet-session-manager.service';
import { FleetDataLoaderService }     from '@modules/admin/logistics/fleet-management/services/fleet-data-loader.service';
import { GpsWarningDialogComponent }  from './gps-warning-dialog.component';

/**
 * Refactored Fleet Control Component with improved separation of concerns.
 *
 * This component now uses specialized services for different responsibilities:
 * - FleetControlFormService: Form management and validation
 * - FleetGpsManagerService: GPS functionality and location tracking
 * - FleetSessionManagerService: Vehicle session operations
 * - FleetDataLoaderService: Data loading and caching
 *
 * Benefits of this refactor:
 * - Reduced component size (from 364 lines to ~200 lines)
 * - Better testability with separated concerns
 * - Improved reusability of business logic
 * - Cleaner, more maintainable code
 * - Consistent error handling patterns
 */
@Component({
    selector       : 'app-fleet-control-refactored',
    standalone     : true,
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
        FormsModule,
        PageHeaderComponent,
        VehicleSelectorComponent,
        DriverSelectorComponent,
        HapticClickDirective
    ],
    animations     : [
        FleetAnimationsService.buttonPress,
        FleetAnimationsService.sessionStateChange,
        FleetAnimationsService.gpsIndicator,
        FleetAnimationsService.fadeInOut,
        FleetAnimationsService.dataLoading
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './fleet-control-refactored.component.html'
})
export class FleetControlRefactoredComponent implements OnInit, AfterViewInit {
    // Service injections
    private readonly formService = inject(FleetControlFormService);
    private readonly gpsManager = inject(FleetGpsManagerService);
    private readonly sessionManager = inject(FleetSessionManagerService);
    private readonly dataLoader = inject(FleetDataLoaderService);
    private readonly dialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    // Form management
    form: FormGroup = this.formService.createForm();

    // Current date/time signal with automatic updates
    currentDateTime = signal(new Date());

    // Computed signals from services
    readonly isLoading = computed(() => this.dataLoader.isLoading());
    readonly hasGeolocationPermission = computed(() => this.gpsManager.hasGeolocationPermission());
    readonly currentLocation = computed(() => this.gpsManager.currentLocation());
    readonly gpsState = computed(() => this.gpsManager.gpsState());

    // Data from data loader service
    readonly availableDrivers = computed(() => this.dataLoader.availableDrivers());
    readonly availableVehicles = computed(() => this.dataLoader.availableVehicles());
    readonly selectedDriver = computed(() => this.dataLoader.selectedDriver());
    readonly selectedVehicle = computed(() => this.dataLoader.selectedVehicle());

    // Session management state
    readonly sessionStatus = computed(() => this.sessionManager.getSessionStatus());

    // User information from form service
    readonly currentUser = computed(() => this.formService.currentUser());
    readonly currentUserIsDriver = computed(() => this.formService.currentUserIsDriver());

    /**
     * Component initialization.
     * Sets up data loading, GPS, and form change handlers.
     */
    async ngOnInit(): Promise<void> {
        this.setupDateTimeUpdates();
        this.setupFormChangeHandlers();

        // Initialize GPS and load data in parallel
        await Promise.allSettled([
            this.gpsManager.initializeGPS(),
            this.dataLoader.loadInitialData()
        ]);
    }

    /**
     * After view initialization.
     * Shows GPS warning dialog if needed.
     */
    ngAfterViewInit(): void {
        this.showGpsWarningIfNeeded();
    }

    /**
     * Starts a vehicle session using the session manager service.
     * Validates form and handles the complete session creation workflow.
     */
    async startVehicleSession(): Promise<void> {
        // Validate form first
        const formValidation = this.formService.validateForm(this.form);
        if (!formValidation.isValid) {
            this.form.markAllAsTouched();
            return;
        }

        // Get form values and start session
        const formValue = this.form.getRawValue();
        const success = await this.sessionManager.startVehicleSession(formValue);

        if (success) {
            // Reset form and refresh vehicle list
            this.form.reset();
            await this.dataLoader.refreshVehiclesAfterSessionStart();

            // Update form service with new form instance
            this.form = this.formService.createForm();
            this.setupFormChangeHandlers();
        }
    }

    /**
     * Gets GPS location display text for the UI.
     */
    getLocationDisplayText(): string {
        return this.gpsManager.getLocationDisplayText();
    }

    /**
     * Gets GPS accuracy display text for the UI.
     */
    getAccuracyDisplayText(): string {
        return this.gpsManager.getAccuracyDisplayText();
    }

    /**
     * Refreshes current GPS position.
     */
    async refreshGpsPosition(): Promise<void> {
        await this.gpsManager.refreshPosition();
    }

    /**
     * Sets up automatic date/time updates every second.
     */
    private setupDateTimeUpdates(): void {
        const intervalId = window.setInterval(() => {
            this.currentDateTime.set(new Date());
        }, 1000);

        this.destroyRef.onDestroy(() => clearInterval(intervalId));
    }

    /**
     * Sets up form change handlers for driver and vehicle selection.
     */
    private setupFormChangeHandlers(): void {
        // Handle driver selection changes
        this.form.get('driverId')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(async (driverId: string) => {
                if (driverId) {
                    await this.dataLoader.loadDriverDetails(driverId);
                } else {
                    this.dataLoader.selectedDriver.set(null);
                }
            });

        // Handle vehicle selection changes
        this.form.get('vehicleId')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(async (vehicleId: string) => {
                if (vehicleId) {
                    const vehicle = await this.dataLoader.loadVehicleDetails(vehicleId);
                    if (vehicle) {
                        // Update form service with selected vehicle for validation
                        this.formService.updateSelectedVehicle(vehicle, this.form);
                    }
                } else {
                    this.dataLoader.selectedVehicle.set(null);
                    this.formService.updateSelectedVehicle(null, this.form);
                }
            });
    }

    /**
     * Shows GPS warning dialog if conditions are met.
     */
    private showGpsWarningIfNeeded(): void {
        if (this.gpsManager.shouldShowGpsWarning()) {
            setTimeout(() => {
                this.dialog.open(GpsWarningDialogComponent, {
                    width       : '400px',
                    disableClose: true
                });
                this.gpsManager.markGpsWarningShown();
            });
        }
    }
}
