import { TestBed }                from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { signal }                 from '@angular/core';

import { FleetControlFormService } from './fleet-control-form.service';
import { UserService }             from '@core/user/user.service';
import { RoleEnum }                from '@core/user/role.type';
import { Vehicle }                 from '../domain/model/vehicle.model';

describe('FleetControlFormService', () => {
    let service: FleetControlFormService;
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let mockUser: any;
    let mockVehicle: Vehicle;

    beforeEach(() => {
        // Mock user data
        mockUser = {
            id  : 'user-123',
            role: {id: RoleEnum.driver}
        };

        // Mock vehicle data
        mockVehicle = {
            id               : 'vehicle-123',
            lastKnownOdometer: 10000
        } as Vehicle;

        // Create UserService spy
        userServiceSpy = jasmine.createSpyObj('UserService', [], {
            user$: signal(mockUser).asReadonly()
        });

        TestBed.configureTestingModule({
            providers: [
                FleetControlFormService,
                FormBuilder,
                {provide: UserService, useValue: userServiceSpy}
            ]
        });

        service = TestBed.inject(FleetControlFormService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('createForm', () => {
        it('should create form with proper structure', () => {
            const form = service.createForm();

            expect(form).toBeTruthy();
            expect(form.get('driverId')).toBeTruthy();
            expect(form.get('vehicleId')).toBeTruthy();
            expect(form.get('initialOdometer')).toBeTruthy();
            expect(form.get('purpose')).toBeTruthy();
        });

        it('should disable driver field when current user is driver', () => {
            const form = service.createForm();
            const driverControl = form.get('driverId');

            expect(driverControl?.disabled).toBe(true);
            expect(driverControl?.value).toBe('user-123');
        });

        it('should enable driver field when current user is not driver', () => {
            // Change user role to admin
            mockUser.role.id = RoleEnum.admin;

            const form = service.createForm();
            const driverControl = form.get('driverId');

            expect(driverControl?.disabled).toBe(false);
        });
    });

    describe('updateSelectedVehicle', () => {
        let form: FormGroup;

        beforeEach(() => {
            form = service.createForm();
        });

        it('should update selected vehicle signal', () => {
            service.updateSelectedVehicle(mockVehicle, form);

            expect(service.selectedVehicle()).toBe(mockVehicle);
        });

        it('should update odometer field with vehicle value', () => {
            service.updateSelectedVehicle(mockVehicle, form);

            expect(form.get('initialOdometer')?.value).toBe(10000);
        });

        it('should handle null vehicle', () => {
            service.updateSelectedVehicle(null, form);

            expect(service.selectedVehicle()).toBe(null);
        });

        it('should trigger form validation update', () => {
            spyOn(form.get('initialOdometer')!, 'updateValueAndValidity');

            service.updateSelectedVehicle(mockVehicle, form);

            expect(form.get('initialOdometer')!.updateValueAndValidity).toHaveBeenCalled();
        });
    });

    describe('validateForm', () => {
        let form: FormGroup;

        beforeEach(() => {
            form = service.createForm();
        });

        it('should return valid when form is valid', () => {
            // Set valid form data
            form.patchValue({
                driverId       : 'driver-123',
                vehicleId      : 'vehicle-123',
                initialOdometer: 10050,
                purpose        : 'Test purpose'
            });

            const result = service.validateForm(form);

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return errors for invalid form', () => {
            // Leave form empty
            const result = service.validateForm(form);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should include required field errors', () => {
            const result = service.validateForm(form);

            expect(result.errors).toContain('Conductor es requerido');
            expect(result.errors).toContain('Vehículo es requerido');
            expect(result.errors).toContain('Odómetro inicial es requerido');
        });

        it('should include odometer tolerance error', () => {
            // Set vehicle for validation
            service.updateSelectedVehicle(mockVehicle, form);

            // Set odometer value outside tolerance
            form.patchValue({
                driverId       : 'driver-123',
                vehicleId      : 'vehicle-123',
                initialOdometer: 9800 // 200km below last known (outside 100km tolerance)
            });

            const result = service.validateForm(form);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('odómetro debe estar entre'))).toBe(true);
        });
    });

    describe('currentUserIsDriver computed signal', () => {
        it('should return true when user is driver', () => {
            expect(service.currentUserIsDriver()).toBe(true);
        });

        it('should return false when user is not driver', () => {
            mockUser.role.id = RoleEnum.admin;

            expect(service.currentUserIsDriver()).toBe(false);
        });
    });

    describe('odometer tolerance validator', () => {
        let form: FormGroup;

        beforeEach(() => {
            form = service.createForm();
            service.updateSelectedVehicle(mockVehicle, form);
        });

        it('should allow odometer within tolerance', () => {
            form.patchValue({initialOdometer: 10050}); // Within tolerance

            const odometerControl = form.get('initialOdometer');
            expect(odometerControl?.errors).toBe(null);
        });

        it('should reject odometer outside tolerance', () => {
            form.patchValue({initialOdometer: 9800}); // Outside tolerance (200km below)

            const odometerControl = form.get('initialOdometer');
            expect(odometerControl?.errors?.['odometerTolerance']).toBeTruthy();
        });

        it('should allow odometer higher than last known', () => {
            form.patchValue({initialOdometer: 12000}); // Much higher than last known

            const odometerControl = form.get('initialOdometer');
            expect(odometerControl?.errors).toBe(null);
        });

        it('should not validate when no vehicle selected', () => {
            service.updateSelectedVehicle(null, form);
            form.patchValue({initialOdometer: 5000}); // Would be invalid if vehicle was selected

            const odometerControl = form.get('initialOdometer');
            expect(odometerControl?.errors?.['odometerTolerance']).toBeFalsy();
        });
    });
});
