import { Injectable, inject, signal } from '@angular/core';
import { Router }                     from '@angular/router';
import { firstValueFrom, of }         from 'rxjs';
import { catchError }                 from 'rxjs/operators';
import { Notyf }                      from 'notyf';

import { VehicleSessionsService }               from './vehicle-sessions.service';
import { VehiclesService }                      from './vehicles.service';
import { HapticFeedbackService }                from './haptic-feedback.service';
import { FleetGpsManagerService }               from './fleet-gps-manager.service';
import { NewVehicleSessionDto, VehicleSession } from '../domain/model/vehicle-session.model';

/**
 * Service to manage vehicle session operations for fleet control.
 * Handles session creation, validation, and related workflows.
 * Extracted from FleetControlComponent to improve separation of concerns.
 */
@Injectable({
    providedIn: 'root'
})
export class FleetSessionManagerService {
    private readonly sessionsService = inject(VehicleSessionsService);
    private readonly vehiclesService = inject(VehiclesService);
    private readonly hapticService = inject(HapticFeedbackService);
    private readonly gpsManager = inject(FleetGpsManagerService);
    private readonly router = inject(Router);
    private readonly notyf = new Notyf();

    // Session state management
    readonly isSubmitting = signal(false);
    readonly sessionState = signal<'idle' | 'starting' | 'active'>('idle');
    readonly buttonPressed = signal(false);

    /**
     * Starts a new vehicle session with the provided form data.
     * Handles validation, GPS checking, session creation, and navigation.
     * @param formValue Raw form values from the fleet control form
     * @returns Promise<boolean> indicating success or failure
     */
    async startVehicleSession(formValue: any): Promise<boolean> {
        try {
            // Provide haptic feedback for button press
            this.provideFeedback('buttonPress');
            this.buttonPressed.set(true);
            setTimeout(() => this.buttonPressed.set(false), 150);

            // Validate GPS status before proceeding
            const gpsValidation = this.gpsManager.validateGpsStatus();
            if (!gpsValidation.isValid) {
                this.provideFeedback('error');
                this.showError(gpsValidation.error || 'Error de GPS');
                return false;
            }

            // Set loading state
            this.isSubmitting.set(true);
            this.sessionState.set('starting');

            // Get current location
            const currentLocation = await this.gpsManager.getCurrentPosition();
            if (!currentLocation) {
                this.provideFeedback('error');
                this.showError('No se pudo obtener la ubicación actual. Por favor, asegúrese de que el GPS está habilitado.');
                return false;
            }

            // Create session DTO
            const newSession: NewVehicleSessionDto = {
                driverId       : formValue.driverId,
                vehicleId      : formValue.vehicleId,
                initialOdometer: parseFloat(formValue.initialOdometer),
                initialLocation: currentLocation,
                purpose        : formValue.purpose || null
            };

            // Start the session
            const session = await this.createSession(newSession);
            if (!session) {
                return false;
            }

            // Handle successful session creation
            await this.handleSessionSuccess(session);
            return true;

        } catch (error: any) {
            this.handleSessionError(error);
            return false;
        } finally {
            this.isSubmitting.set(false);
            this.sessionState.set('idle');
        }
    }

    /**
     * Validates that a session can be started with the given parameters.
     * @param formValue Form values to validate
     * @returns Object with validation status and error messages
     */
    validateSessionStart(formValue: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check required fields
        if (!formValue.driverId) {
            errors.push('Debe seleccionar un conductor');
        }
        if (!formValue.vehicleId) {
            errors.push('Debe seleccionar un vehículo');
        }
        if (!formValue.initialOdometer || formValue.initialOdometer < 0) {
            errors.push('Debe ingresar un odómetro válido');
        }

        // Check GPS status
        const gpsValidation = this.gpsManager.validateGpsStatus();
        if (!gpsValidation.isValid) {
            errors.push(gpsValidation.error || 'Error de GPS');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Gets the current session state for UI display.
     * @returns Object with current state information
     */
    getSessionStatus(): {
        isSubmitting: boolean;
        sessionState: string;
        buttonPressed: boolean;
        canStartSession: boolean;
    } {
        return {
            isSubmitting   : this.isSubmitting(),
            sessionState   : this.sessionState(),
            buttonPressed  : this.buttonPressed(),
            canStartSession: !this.isSubmitting() && this.sessionState() === 'idle'
        };
    }

    /**
     * Creates a vehicle session via the API.
     * @param sessionDto Session data to create
     * @returns Promise<VehicleSession | null> Created session or null if failed
     */
    private async createSession(sessionDto: NewVehicleSessionDto): Promise<VehicleSession | null> {
        try {
            const session = await firstValueFrom(
                this.sessionsService.startSession(sessionDto).pipe(
                    catchError(error => {
                        console.error('Error creating session:', error);
                        this.showError('Error al iniciar la sesión: ' + error.message);
                        return of<VehicleSession | null>(null);
                    })
                )
            );

            return session;
        } catch (error: any) {
            console.error('Unexpected error creating session:', error);
            this.showError('Error inesperado al iniciar la sesión');
            return null;
        }
    }

    /**
     * Handles successful session creation.
     * @param session The created session
     */
    private async handleSessionSuccess(session: VehicleSession): Promise<void> {
        // Provide success feedback
        this.provideFeedback('sessionStart');
        this.sessionState.set('active');

        // Show success message
        this.showSuccess('Sesión de vehículo iniciada correctamente');

        // Refresh available vehicles list
        try {
            await this.refreshAvailableVehicles();
        } catch (error) {
            console.warn('Failed to refresh vehicles list:', error);
            // Don't block the success flow for this non-critical operation
        }

        // Navigate to active sessions with delay for animation
        setTimeout(() => {
            void this.router.navigate([ '/logistics/fleet-management/active-sessions' ]);
        }, 500);
    }

    /**
     * Handles session creation errors.
     * @param error The error that occurred
     */
    private handleSessionError(error: any): void {
        console.error('Session creation error:', error);
        this.provideFeedback('error');
        this.sessionState.set('idle');

        const errorMessage = error?.message || error || 'Error desconocido';
        this.showError(`Error inesperado al iniciar la sesión: ${ errorMessage }`);
    }

    /**
     * Refreshes the list of available vehicles.
     * Used after session creation to update the vehicle list.
     */
    private async refreshAvailableVehicles(): Promise<void> {
        try {
            await firstValueFrom(this.vehiclesService.findAvailableVehicles());
        } catch (error) {
            console.error('Error refreshing vehicles:', error);
            this.showError('Error al actualizar la lista de vehículos disponibles');
        }
    }

    /**
     * Provides haptic feedback based on the action type.
     * @param feedbackType Type of feedback to provide
     */
    private provideFeedback(feedbackType: 'buttonPress' | 'error' | 'sessionStart'): void {
        switch (feedbackType) {
            case 'buttonPress':
                this.hapticService.buttonPress();
                break;
            case 'error':
                this.hapticService.errorAction();
                break;
            case 'sessionStart':
                this.hapticService.sessionStart();
                break;
        }
    }

    /**
     * Shows error notification to user.
     * @param message Error message to display
     */
    private showError(message: string): void {
        this.notyf.error({
            message,
            duration: 5000,
            ripple  : true
        });
    }

    /**
     * Shows success notification to user.
     * @param message Success message to display
     */
    private showSuccess(message: string): void {
        this.notyf.success({
            message,
            duration: 3000,
            ripple  : true
        });
    }
}
