import { FuelType }                            from '@modules/admin/logistics/fuel-management/domain/model/fuel-record.model';
import { Vehicle, VehicleStatus, VehicleType } from '@modules/admin/logistics/fleet-management/domain/model/vehicle.model';

export interface QueryVehicleDto {
    search?: string;
    status?: VehicleStatus;
    type?: VehicleType;
    brand?: string;
    page?: number;
    limit?: number;
    fuelType?: FuelType;
    departmentId?: string;
    available?: boolean;
    sortBy?: keyof Vehicle;
    sortOrder?: 'ASC' | 'DESC';
}
