import { Role }             from '@core/user/role.type';
import { Status }           from '@core/user/status.type';
import { FileDto }          from './file-dto.model';
import { DriverLicenseDto } from './driver-license.model';

export class RoleDto implements Partial<Role> {
    id: number;
}

export class StatusDto implements Status {
    id: number;
    name?: string;
}

export class CreateUserDto {
    email: string | null;
    password?: string;
    firstName: string | null;
    lastName: string | null;
    photo?: FileDto | null;
    role?: RoleDto | null;
    status?: StatusDto;

    // Campos específicos para conductores
    documentId?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    notes?: string;

    // Flag to determine if user is a driver
    isDriver?: boolean;

    // Información de licencia de conducir (obligatoria para conductores)
    driverLicense?: Array<DriverLicenseDto>;
}
