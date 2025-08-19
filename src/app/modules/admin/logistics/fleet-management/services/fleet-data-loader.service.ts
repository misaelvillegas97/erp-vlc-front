import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom }             from 'rxjs';
import { Notyf }                      from 'notyf';

import { DriversService }  from './drivers.service';
import { VehiclesService } from './vehicles.service';
import { Driver }          from '../domain/model/driver.model';
import { Vehicle }         from '../domain/model/vehicle.model';

/**
 * Service to manage data loading operations for fleet control.
 * Handles loading drivers, vehicles, and their details with proper error handling and caching.
 * Extracted from FleetControlComponent to improve separation of concerns.
 */
@Injectable({
    providedIn: 'root'
})
export class FleetDataLoaderService {
    private readonly driversService = inject(DriversService);
    private readonly vehiclesService = inject(VehiclesService);
    private readonly notyf = new Notyf();

    // Data state signals
    readonly isLoading = signal(false);
    readonly availableDrivers = signal<Driver[]>([]);
    readonly availableVehicles = signal<Vehicle[]>([]);
    readonly selectedDriver = signal<Driver | null>(null);
    readonly selectedVehicle = signal<Vehicle | null>(null);

    // Cache for loaded driver/vehicle details to avoid repeated API calls
    private driverCache = new Map<string, Driver>();
    private vehicleCache = new Map<string, Vehicle>();

    /**
     * Loads initial data (drivers and vehicles) needed for fleet control.
     * @returns Promise that resolves when all data is loaded
     */
    async loadInitialData(): Promise<void> {
        this.isLoading.set(true);

        try {
            // Load drivers and vehicles in parallel
            const [ driversResult, vehiclesResult ] = await Promise.allSettled([
                this.loadDrivers(),
                this.loadVehicles()
            ]);

            // Handle any failures
            if (driversResult.status === 'rejected') {
                console.error('Failed to load drivers:', driversResult.reason);
                this.showError('Error al cargar conductores');
            }

            if (vehiclesResult.status === 'rejected') {
                console.error('Failed to load vehicles:', vehiclesResult.reason);
                this.showError('Error al cargar vehículos');
            }

        } catch (error) {
            console.error('Unexpected error loading initial data:', error);
            this.showError('Error al cargar datos iniciales');
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Loads available drivers from the API.
     * @returns Promise that resolves when drivers are loaded
     */
    async loadDrivers(): Promise<void> {
        try {
            const result = await firstValueFrom(this.driversService.findAll());

            this.availableDrivers.set(result.items);

            // Cache loaded drivers
            result.items.forEach(driver => {
                this.driverCache.set(driver.id, driver);
            });

            if (result.total === 0) {
                this.showWarning('No hay conductores disponibles actualmente');
            }

        } catch (error) {
            console.error('Error loading drivers:', error);
            throw error;
        }
    }

    /**
     * Loads available vehicles from the API.
     * @returns Promise that resolves when vehicles are loaded
     */
    async loadVehicles(): Promise<void> {
        try {
            const result = await firstValueFrom(this.vehiclesService.findAvailableVehicles());

            this.availableVehicles.set(result.items);

            // Cache loaded vehicles
            result.items.forEach(vehicle => {
                this.vehicleCache.set(vehicle.id, vehicle);
            });

            if (result.total === 0) {
                this.showWarning('No hay vehículos disponibles actualmente');
            }

        } catch (error) {
            console.error('Error loading vehicles:', error);
            throw error;
        }
    }

    /**
     * Loads detailed information for a specific driver.
     * Uses caching to avoid repeated API calls.
     * @param driverId ID of the driver to load
     * @returns Promise<Driver | null> Driver details or null if not found
     */
    async loadDriverDetails(driverId: string): Promise<Driver | null> {
        try {
            // Check cache first
            if (this.driverCache.has(driverId)) {
                const driver = this.driverCache.get(driverId)!;
                this.selectedDriver.set(driver);
                return driver;
            }

            // Load from API
            const driver = await firstValueFrom(this.driversService.findById(driverId));

            // Update cache and state
            this.driverCache.set(driverId, driver);
            this.selectedDriver.set(driver);

            return driver;

        } catch (error) {
            console.error('Error loading driver details:', error);
            this.showError('Error al cargar detalles del conductor');
            this.selectedDriver.set(null);
            return null;
        }
    }

    /**
     * Loads detailed information for a specific vehicle.
     * Uses caching to avoid repeated API calls.
     * @param vehicleId ID of the vehicle to load
     * @returns Promise<Vehicle | null> Vehicle details or null if not found
     */
    async loadVehicleDetails(vehicleId: string): Promise<Vehicle | null> {
        try {
            // Check cache first
            if (this.vehicleCache.has(vehicleId)) {
                const vehicle = this.vehicleCache.get(vehicleId)!;
                this.selectedVehicle.set(vehicle);
                return vehicle;
            }

            // Load from API
            const vehicle = await firstValueFrom(this.vehiclesService.findById(vehicleId));

            // Update cache and state
            this.vehicleCache.set(vehicleId, vehicle);
            this.selectedVehicle.set(vehicle);

            return vehicle;

        } catch (error) {
            console.error('Error loading vehicle details:', error);
            this.showError('Error al cargar detalles del vehículo');
            this.selectedVehicle.set(null);
            return null;
        }
    }

    /**
     * Refreshes the vehicles list after a session has been created.
     * This is needed because a vehicle becomes unavailable after starting a session.
     * @returns Promise that resolves when vehicles are refreshed
     */
    async refreshVehiclesAfterSessionStart(): Promise<void> {
        try {
            // Clear vehicle cache since availability has changed
            this.vehicleCache.clear();

            // Reload vehicles
            await this.loadVehicles();

        } catch (error) {
            console.error('Error refreshing vehicles:', error);
            this.showError('Error al actualizar vehículos disponibles');
        }
    }

    /**
     * Clears all cached data and resets state.
     * Useful when data needs to be completely refreshed.
     */
    clearCache(): void {
        this.driverCache.clear();
        this.vehicleCache.clear();
        this.selectedDriver.set(null);
        this.selectedVehicle.set(null);
        this.availableDrivers.set([]);
        this.availableVehicles.set([]);
    }

    /**
     * Gets the current loading state and data availability.
     * @returns Object with loading state and data status
     */
    getDataStatus(): {
        isLoading: boolean;
        hasDrivers: boolean;
        hasVehicles: boolean;
        selectedDriver: Driver | null;
        selectedVehicle: Vehicle | null;
    } {
        return {
            isLoading      : this.isLoading(),
            hasDrivers     : this.availableDrivers().length > 0,
            hasVehicles    : this.availableVehicles().length > 0,
            selectedDriver : this.selectedDriver(),
            selectedVehicle: this.selectedVehicle()
        };
    }

    /**
     * Gets cache statistics for debugging purposes.
     * @returns Object with cache information
     */
    getCacheInfo(): {
        driversCached: number;
        vehiclesCached: number;
        totalCached: number;
    } {
        return {
            driversCached : this.driverCache.size,
            vehiclesCached: this.vehicleCache.size,
            totalCached   : this.driverCache.size + this.vehicleCache.size
        };
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
     * Shows warning notification to user.
     * @param message Warning message to display
     */
    private showWarning(message: string): void {
        this.notyf.error({
            message,
            duration: 5000,
            ripple  : false
        });
    }
}
